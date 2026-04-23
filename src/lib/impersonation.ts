// src/lib/impersonation.ts
// Slice 7B-1: Admin impersonation session helpers (SSR)

import { createClient } from '@/lib/supabase/server'

export interface ActiveImpersonation {
  session_id: string
  admin_user_id: string
  target_user_id: string
  target_email: string | null
  target_name: string | null
  started_at: string
  expires_at: string
}

async function fetchUserProfile(userId: string): Promise<{ email: string | null; name: string | null }> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .maybeSingle()
  return {
    email: data?.email ?? null,
    name: data?.full_name ?? null,
  }
}

export async function getActiveImpersonation(): Promise<ActiveImpersonation | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Auto-expire stale sessions
  await supabase
    .from('impersonation_sessions')
    .update({ ended_at: new Date().toISOString(), end_reason: 'timeout' })
    .is('ended_at', null)
    .lt('expires_at', new Date().toISOString())
    .eq('admin_user_id', user.id)

  const { data: session } = await supabase
    .from('impersonation_sessions')
    .select('id, admin_user_id, target_user_id, started_at, expires_at')
    .eq('admin_user_id', user.id)
    .is('ended_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!session) return null

  const profile = await fetchUserProfile(session.target_user_id)

  return {
    session_id: session.id,
    admin_user_id: session.admin_user_id,
    target_user_id: session.target_user_id,
    target_email: profile.email,
    target_name: profile.name,
    started_at: session.started_at,
    expires_at: session.expires_at,
  }
}

export async function endImpersonationSession(
  sessionId: string,
  reason: 'manual' | 'timeout' | 'signout' | 'ip_changed' = 'manual'
): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('impersonation_sessions')
    .update({ ended_at: new Date().toISOString(), end_reason: reason })
    .eq('id', sessionId)
    .is('ended_at', null)
}
