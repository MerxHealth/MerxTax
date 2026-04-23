// src/lib/audit.ts
// MerxTax Sprint 7 · Slice 7A · Step 5
// Admin audit log helper — canonical entry point for writing to admin_audit_log.
//
// USAGE PATTERN (from any admin page/component):
//
//   import { logAdminAction } from '@/lib/audit';
//
//   await logAdminAction({
//     actionType: 'UPDATE',
//     targetUserId: clientUserId,
//     targetTable: 'profiles',
//     targetRecordId: clientUserId,
//     reason: 'Client requested business name correction via email 2026-04-21',
//     beforeSnapshot: { business_name: 'Marco Ltd' },
//     afterSnapshot: { business_name: 'Marco Digital Ltd' },
//   });
//
// The function captures admin_user_id, user_agent, and created_at automatically.
// IP address is captured server-side (see /api/admin/log-action route — added in a later step).

import { createClient } from '@/lib/supabase/client';

// ============================================================
// TYPES
// ============================================================

export type AdminActionType =
  | 'VIEW'
  | 'INSERT'
  | 'UPDATE'
  | 'DELETE'
  | 'IMPERSONATE_START'
  | 'IMPERSONATE_END'
  | 'AGENT_FILE'
  | 'HMRC_CONNECT'
  | 'HMRC_DISCONNECT'
  | 'PAYMENT_ACTION'
  | 'OTHER';

export interface LogAdminActionInput {
  /** What kind of action — must match CHECK constraint in admin_audit_log */
  actionType: AdminActionType;

  /** The user whose data is being acted upon (null if not user-specific, e.g. HMRC_CONNECT) */
  targetUserId?: string | null;

  /** Name of the table being acted upon (e.g. 'profiles', 'transactions') */
  targetTable?: string | null;

  /** Primary key of the specific record being acted upon */
  targetRecordId?: string | null;

  /** WHY this action was performed — REQUIRED, min 3 chars (enforced by DB CHECK) */
  reason: string;

  /** State before the change (for UPDATE / DELETE) */
  beforeSnapshot?: Record<string, unknown> | null;

  /** State after the change (for INSERT / UPDATE) */
  afterSnapshot?: Record<string, unknown> | null;

  /** True if the admin is acting in HMRC agent posture (Elena's requirement) */
  actingAsAgent?: boolean;
}

export interface LogAdminActionResult {
  ok: boolean;
  auditId?: string;
  error?: string;
}

// ============================================================
// CORE FUNCTION
// ============================================================

/**
 * Write an immutable row to admin_audit_log.
 * Throws nothing — returns {ok, auditId, error} so calling code can decide.
 *
 * NOTE: Relies on the Supabase session of the current authenticated admin.
 * The RLS policy ensures admin_user_id = auth.uid() is enforced server-side.
 */
export async function logAdminAction(
  input: LogAdminActionInput
): Promise<LogAdminActionResult> {
  // Guard: reason must be present and non-trivial
  if (!input.reason || input.reason.trim().length < 3) {
    return {
      ok: false,
      error: 'Audit log requires a reason of at least 3 characters.',
    };
  }

  const supabase = createClient();

  // Identify the acting admin from the current session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      error: 'No authenticated admin session — cannot write audit log.',
    };
  }

  // Capture user agent (client-side — IP is captured server-side elsewhere)
  const userAgent =
    typeof navigator !== 'undefined' ? navigator.userAgent : null;

  // Insert the audit row
  const { data, error } = await supabase
    .from('admin_audit_log')
    .insert({
      admin_user_id: user.id,
      action_type: input.actionType,
      target_user_id: input.targetUserId ?? null,
      target_table: input.targetTable ?? null,
      target_record_id: input.targetRecordId ?? null,
      reason: input.reason.trim(),
      before_snapshot: input.beforeSnapshot ?? null,
      after_snapshot: input.afterSnapshot ?? null,
      user_agent: userAgent,
      acting_as_agent: input.actingAsAgent ?? false,
    })
    .select('id')
    .single();

  if (error) {
    // Log to console for developer visibility but don't throw
    console.error('[audit] logAdminAction failed:', error);
    return {
      ok: false,
      error: error.message,
    };
  }

  return {
    ok: true,
    auditId: data?.id,
  };
}

// ============================================================
// CONVENIENCE WRAPPERS
// ============================================================

/**
 * Diff two records and log only the fields that changed.
 * Useful when updating a row via a form — pass before/after and this strips
 * unchanged fields from the snapshots so the audit log stays readable.
 */
export async function logAdminUpdate(
  params: {
    targetUserId: string;
    targetTable: string;
    targetRecordId: string;
    reason: string;
    beforeRow: Record<string, unknown>;
    afterRow: Record<string, unknown>;
    actingAsAgent?: boolean;
  }
): Promise<LogAdminActionResult> {
  const diffBefore: Record<string, unknown> = {};
  const diffAfter: Record<string, unknown> = {};

  const allKeys = new Set([
    ...Object.keys(params.beforeRow),
    ...Object.keys(params.afterRow),
  ]);

  for (const key of allKeys) {
    const b = params.beforeRow[key];
    const a = params.afterRow[key];
    // Only include fields that actually changed
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      diffBefore[key] = b ?? null;
      diffAfter[key] = a ?? null;
    }
  }

  // Nothing changed — still log a VIEW-type action so there's a record of
  // the admin opening the edit modal, but don't create a misleading UPDATE row.
  if (Object.keys(diffAfter).length === 0) {
    return logAdminAction({
      actionType: 'VIEW',
      targetUserId: params.targetUserId,
      targetTable: params.targetTable,
      targetRecordId: params.targetRecordId,
      reason: `${params.reason} [NO CHANGES APPLIED]`,
      actingAsAgent: params.actingAsAgent,
    });
  }

  return logAdminAction({
    actionType: 'UPDATE',
    targetUserId: params.targetUserId,
    targetTable: params.targetTable,
    targetRecordId: params.targetRecordId,
    reason: params.reason,
    beforeSnapshot: diffBefore,
    afterSnapshot: diffAfter,
    actingAsAgent: params.actingAsAgent,
  });
}

/**
 * Log the start of an impersonation session.
 * Returns the audit ID so the caller can also record it in impersonation_sessions
 * when that table is created in Slice 7B.
 */
export async function logImpersonationStart(params: {
  targetUserId: string;
  reason: string;
}): Promise<LogAdminActionResult> {
  return logAdminAction({
    actionType: 'IMPERSONATE_START',
    targetUserId: params.targetUserId,
    reason: params.reason,
  });
}

export async function logImpersonationEnd(params: {
  targetUserId: string;
  reason?: string;
}): Promise<LogAdminActionResult> {
  return logAdminAction({
    actionType: 'IMPERSONATE_END',
    targetUserId: params.targetUserId,
    reason: params.reason ?? 'Session ended normally',
  });
}
