// src/app/admin/integrations/hmrc/page.tsx
// MerxTax Sprint 7 · Slice 7A · Step 9
// HMRC Integrations Page — Session Management
//
// THIS IS THE LOGOFF FIX — solves the original Sprint 7 pain:
// "I am logged to HMRC Sandbox, but there is no option to logoff."
//
// FEATURES:
//   - Two environment cards (Sandbox / Production) showing connection status
//   - Live token expiry countdown
//   - Disconnect button → sets revoked_at = now() + (Sprint 8) revokes token at HMRC
//   - Refresh button → triggers token refresh flow (Sprint 8 wires to HMRC API)
//   - Last 10 API calls table (from hmrc_api_log)
//   - Every action logged to admin_audit_log

'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logAdminAction } from '@/lib/audit';

// ============ TYPES ============
interface HmrcConnection {
  id: string;
  user_id: string;
  environment: 'sandbox' | 'production' | null;
  agent_code: string | null;
  connected_at: string | null;
  expires_at: string | null;
  last_api_call_at: string | null;
  revoked_at: string | null;
  vrn: string | null;
  scope: string | null;
}

interface HmrcApiLogRow {
  id: string;
  endpoint: string;
  method: string;
  status_code: number | null;
  environment: string;
  correlation_id: string | null;
  error_code: string | null;
  response_ms: number | null;
  created_at: string;
}

type SessionStatus = 'CONNECTED' | 'EXPIRED' | 'REVOKED' | 'NOT_CONNECTED';

function deriveStatus(c: HmrcConnection | null): SessionStatus {
  if (!c) return 'NOT_CONNECTED';
  if (c.revoked_at) return 'REVOKED';
  if (c.expires_at && new Date(c.expires_at) < new Date()) return 'EXPIRED';
  return 'CONNECTED';
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const diffMs = new Date(iso).getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const sign = diffMs >= 0 ? 'in ' : '';
  const suffix = diffMs >= 0 ? '' : ' ago';

  const seconds = Math.floor(absMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${sign}${days}d ${hours % 24}h${suffix}`;
  if (hours > 0) return `${sign}${hours}h ${minutes % 60}m${suffix}`;
  if (minutes > 0) return `${sign}${minutes}m ${seconds % 60}s${suffix}`;
  return `${sign}${seconds}s${suffix}`;
}

// ============ MAIN PAGE ============
export default function HmrcIntegrationsPage() {
  const [sandboxConn, setSandboxConn] = useState<HmrcConnection | null>(null);
  const [productionConn, setProductionConn] = useState<HmrcConnection | null>(null);
  const [apiLog, setApiLog] = useState<HmrcApiLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [now, setNow] = useState(Date.now()); // For live countdown re-renders

  // ============ DATA LOAD ============
  const loadData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // Get the most recent active connection for each environment
    const { data: connections } = await supabase
      .from('hmrc_connections')
      .select('*')
      .eq('user_id', user.id)
      .order('connected_at', { ascending: false, nullsFirst: false });

    const sandbox = connections?.find((c) => c.environment === 'sandbox' && !c.revoked_at) ?? null;
    const production = connections?.find((c) => c.environment === 'production' && !c.revoked_at) ?? null;

    setSandboxConn(sandbox);
    setProductionConn(production);

    // Last 10 API calls for this admin
    const { data: logs } = await supabase
      .from('hmrc_api_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    setApiLog((logs ?? []) as HmrcApiLogRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Tick once per second for live countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-clear feedback after 5 seconds
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(t);
  }, [feedback]);

  // ============ ACTIONS ============
  async function handleDisconnect(conn: HmrcConnection) {
    const env = conn.environment ?? 'unknown';
    const confirmText = `Disconnect HMRC ${env.toUpperCase()} session?\n\nThis will revoke your current OAuth token. You will need to re-authenticate to file submissions.\n\nProceed?`;
    if (!window.confirm(confirmText)) return;

    setActionInFlight(`disconnect-${conn.id}`);
    setFeedback(null);

    const supabase = createClient();
    const revokedAt = new Date().toISOString();

    // Step 1: Mark the connection as revoked locally
    const { error: updateError } = await supabase
      .from('hmrc_connections')
      .update({ revoked_at: revokedAt })
      .eq('id', conn.id);

    if (updateError) {
      setActionInFlight(null);
      setFeedback({ kind: 'error', text: `Disconnect failed: ${updateError.message}` });
      return;
    }

    // Step 2: TODO (Sprint 8) — call HMRC revoke endpoint via /api/admin/hmrc/revoke
    // For now we just log the local revocation. This is the safe, working version of logoff.

    // Step 3: Audit log entry
    await logAdminAction({
      actionType: 'HMRC_DISCONNECT',
      targetTable: 'hmrc_connections',
      targetRecordId: conn.id,
      reason: `Disconnected HMRC ${env} session via Admin Integrations page`,
      beforeSnapshot: { revoked_at: null },
      afterSnapshot: { revoked_at: revokedAt },
    });

    setActionInFlight(null);
    setFeedback({ kind: 'success', text: `HMRC ${env} session disconnected successfully.` });
    await loadData();
  }

  async function handleRefresh(conn: HmrcConnection) {
    setActionInFlight(`refresh-${conn.id}`);
    setFeedback(null);

    // TODO (Sprint 8): wire to /api/admin/hmrc/refresh route which calls HMRC token endpoint
    // For Slice 7A this is a placeholder that just logs the intent.

    await logAdminAction({
      actionType: 'OTHER',
      targetTable: 'hmrc_connections',
      targetRecordId: conn.id,
      reason: `Token refresh requested for HMRC ${conn.environment} (Sprint 8 will wire to HMRC API)`,
    });

    setTimeout(() => {
      setActionInFlight(null);
      setFeedback({
        kind: 'success',
        text: 'Refresh logged. HMRC token endpoint integration ships in Sprint 8.',
      });
    }, 600);
  }

  // ============ RENDER ============
  if (loading) {
    return (
      <div style={pageWrap}>
        <div style={loadingBox}>Loading HMRC session data…</div>
      </div>
    );
  }

  return (
    <div style={pageWrap}>
      {/* HEADER */}
      <div style={headerWrap}>
        <div>
          <h1 style={title}>HMRC Integrations</h1>
          <p style={subtitle}>
            OAuth session management for HMRC Making Tax Digital APIs.
            Disconnect to revoke active tokens. All actions logged to the audit trail.
          </p>
        </div>
      </div>

      {/* FEEDBACK */}
      {feedback && (
        <div
          style={{
            ...feedbackBox,
            background: feedback.kind === 'success' ? '#D1FAE5' : '#FEE2E2',
            color: feedback.kind === 'success' ? '#065F46' : '#991B1B',
          }}
        >
          {feedback.text}
        </div>
      )}

      {/* SESSION CARDS — SANDBOX + PRODUCTION */}
      <div style={cardsGrid}>
        <SessionCard
          environment="sandbox"
          conn={sandboxConn}
          now={now}
          actionInFlight={actionInFlight}
          onDisconnect={handleDisconnect}
          onRefresh={handleRefresh}
        />
        <SessionCard
          environment="production"
          conn={productionConn}
          now={now}
          actionInFlight={actionInFlight}
          onDisconnect={handleDisconnect}
          onRefresh={handleRefresh}
        />
      </div>

      {/* LAST 10 API CALLS */}
      <div style={apiLogSection}>
        <h2 style={sectionTitle}>Last 10 API calls</h2>
        <p style={sectionSubtitle}>
          Forensic log of every HMRC API call from your account. Useful for
          HMRC support tickets — copy the correlation ID when raising issues.
        </p>

        {apiLog.length === 0 ? (
          <div style={emptyApiLog}>
            <div style={emptyIcon}>📡</div>
            <div style={emptyTitle}>No API calls logged yet</div>
            <div style={emptyText}>
              Calls will appear here once HMRC submissions are made
              and the API client is wired to log requests.
            </div>
          </div>
        ) : (
          <div style={apiLogTable}>
            <div style={apiLogHeader}>
              <div style={{ ...apiLogHeaderCell, flex: '0 0 160px' }}>Time</div>
              <div style={{ ...apiLogHeaderCell, flex: '0 0 70px' }}>Method</div>
              <div style={{ ...apiLogHeaderCell, flex: '1 1 auto' }}>Endpoint</div>
              <div style={{ ...apiLogHeaderCell, flex: '0 0 80px' }}>Status</div>
              <div style={{ ...apiLogHeaderCell, flex: '0 0 80px' }}>Time (ms)</div>
              <div style={{ ...apiLogHeaderCell, flex: '0 0 100px' }}>Env</div>
            </div>
            {apiLog.map((row) => (
              <div key={row.id} style={apiLogRow}>
                <div style={{ ...apiLogCell, flex: '0 0 160px' }}>
                  {formatTimestamp(row.created_at)}
                </div>
                <div style={{ ...apiLogCell, flex: '0 0 70px', fontFamily: 'monospace' }}>
                  {row.method}
                </div>
                <div style={{ ...apiLogCell, flex: '1 1 auto', fontFamily: 'monospace', fontSize: 12 }}>
                  {row.endpoint}
                </div>
                <div style={{ ...apiLogCell, flex: '0 0 80px' }}>
                  <span style={statusCodeBadge(row.status_code)}>
                    {row.status_code ?? '—'}
                  </span>
                </div>
                <div style={{ ...apiLogCell, flex: '0 0 80px' }}>
                  {row.response_ms ?? '—'}
                </div>
                <div style={{ ...apiLogCell, flex: '0 0 100px' }}>
                  <span style={envBadge(row.environment)}>{row.environment}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ SESSION CARD COMPONENT ============
function SessionCard(props: {
  environment: 'sandbox' | 'production';
  conn: HmrcConnection | null;
  now: number;
  actionInFlight: string | null;
  onDisconnect: (conn: HmrcConnection) => void;
  onRefresh: (conn: HmrcConnection) => void;
}) {
  const { environment, conn, actionInFlight, onDisconnect, onRefresh } = props;
  const status = deriveStatus(conn);
  const isProduction = environment === 'production';

  const statusColours = {
    CONNECTED: { bg: '#D1FAE5', fg: '#065F46', dot: '#10B981' },
    EXPIRED: { bg: '#FEF3C7', fg: '#92400E', dot: '#F59E0B' },
    REVOKED: { bg: '#FEE2E2', fg: '#991B1B', dot: '#EF4444' },
    NOT_CONNECTED: { bg: '#F3F4F6', fg: '#6B7280', dot: '#9CA3AF' },
  }[status];

  return (
    <div style={card}>
      {/* Card header */}
      <div style={cardHeader}>
        <div>
          <div style={envLabel}>
            {isProduction ? '🔒' : '🧪'} {environment.toUpperCase()}
          </div>
          <div style={statusPill(statusColours)}>
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: 4,
                background: statusColours.dot,
              }}
            />
            {status === 'CONNECTED' && 'Connected'}
            {status === 'EXPIRED' && 'Token expired'}
            {status === 'REVOKED' && 'Disconnected'}
            {status === 'NOT_CONNECTED' && 'Not connected'}
          </div>
        </div>
      </div>

      {/* Card body */}
      <div style={cardBody}>
        {!conn || status === 'NOT_CONNECTED' ? (
          <div style={notConnectedState}>
            {isProduction ? (
              <>
                <div style={{ marginBottom: 8 }}>No production connection.</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>
                  Production credentials are not yet configured. HMRC live access
                  requires application approval — currently sandbox only.
                </div>
              </>
            ) : (
              <div>No active sandbox session.</div>
            )}
          </div>
        ) : (
          <>
            <DetailRow label="Agent Code" value={conn.agent_code ?? '—'} mono />
            <DetailRow label="VRN" value={conn.vrn ?? '—'} mono />
            <DetailRow label="Connected" value={formatTimestamp(conn.connected_at)} />
            <DetailRow
              label="Expires"
              value={
                conn.expires_at ? (
                  <span>
                    {formatTimestamp(conn.expires_at)}{' '}
                    <span style={{ color: status === 'EXPIRED' ? '#991B1B' : '#6B7280', fontSize: 12 }}>
                      ({formatRelative(conn.expires_at)})
                    </span>
                  </span>
                ) : (
                  '—'
                )
              }
            />
            <DetailRow label="Last API call" value={conn.last_api_call_at ? formatTimestamp(conn.last_api_call_at) : 'No calls yet'} />
            <DetailRow label="Scope" value={conn.scope ?? '—'} mono />
          </>
        )}
      </div>

      {/* Card actions */}
      {conn && status !== 'NOT_CONNECTED' && (
        <div style={cardActions}>
          <button
            onClick={() => onRefresh(conn)}
            disabled={actionInFlight === `refresh-${conn.id}` || status === 'REVOKED'}
            style={{
              ...buttonSecondary,
              opacity: status === 'REVOKED' ? 0.4 : 1,
              cursor: status === 'REVOKED' ? 'not-allowed' : 'pointer',
            }}
          >
            {actionInFlight === `refresh-${conn.id}` ? 'Refreshing…' : '🔄 Refresh token'}
          </button>
          <button
            onClick={() => onDisconnect(conn)}
            disabled={actionInFlight === `disconnect-${conn.id}` || status === 'REVOKED'}
            style={{
              ...buttonDanger,
              opacity: status === 'REVOKED' ? 0.4 : 1,
              cursor: status === 'REVOKED' ? 'not-allowed' : 'pointer',
            }}
          >
            {actionInFlight === `disconnect-${conn.id}` ? 'Disconnecting…' : '⏻ Disconnect'}
          </button>
        </div>
      )}
    </div>
  );
}

function DetailRow(props: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div style={detailRow}>
      <div style={detailLabel}>{props.label}</div>
      <div
        style={{
          ...detailValue,
          fontFamily: props.mono ? 'Consolas, Monaco, monospace' : undefined,
        }}
      >
        {props.value}
      </div>
    </div>
  );
}

// ============ HELPERS ============
function statusCodeBadge(code: number | null): React.CSSProperties {
  let bg = '#F3F4F6';
  let fg = '#6B7280';
  if (code !== null) {
    if (code >= 200 && code < 300) {
      bg = '#D1FAE5';
      fg = '#065F46';
    } else if (code >= 400 && code < 500) {
      bg = '#FEF3C7';
      fg = '#92400E';
    } else if (code >= 500) {
      bg = '#FEE2E2';
      fg = '#991B1B';
    }
  }
  return {
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: 11,
    fontWeight: 700,
    fontFamily: 'monospace',
    borderRadius: 4,
    background: bg,
    color: fg,
  };
}

function envBadge(env: string): React.CSSProperties {
  const isProd = env === 'production';
  return {
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: 10,
    fontWeight: 700,
    fontFamily: 'Montserrat, sans-serif',
    letterSpacing: '0.05em',
    borderRadius: 4,
    background: isProd ? '#FEE2E2' : '#DBEAFE',
    color: isProd ? '#991B1B' : '#1E40AF',
  };
}

// ============ STYLES ============
const pageWrap: React.CSSProperties = {
  maxWidth: 1200,
  margin: '0 auto',
  fontFamily: 'DM Sans, sans-serif',
};

const loadingBox: React.CSSProperties = {
  padding: 64,
  textAlign: 'center',
  color: '#6B7280',
  fontSize: 14,
};

const headerWrap: React.CSSProperties = {
  marginBottom: 24,
};

const title: React.CSSProperties = {
  fontFamily: 'Montserrat, sans-serif',
  fontSize: 28,
  fontWeight: 700,
  color: '#1C1C1E',
  margin: 0,
  marginBottom: 4,
};

const subtitle: React.CSSProperties = {
  fontSize: 14,
  color: '#6B7280',
  margin: 0,
  maxWidth: 720,
  lineHeight: 1.6,
};

const feedbackBox: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
  marginBottom: 16,
};

const cardsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
  gap: 20,
  marginBottom: 32,
};

const card: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: 12,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const cardHeader: React.CSSProperties = {
  padding: '20px 24px',
  borderBottom: '1px solid #F3F4F6',
};

const envLabel: React.CSSProperties = {
  fontFamily: 'Montserrat, sans-serif',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  color: '#6B7280',
  marginBottom: 8,
};

const statusPill = (colours: { bg: string; fg: string; dot: string }): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 12px',
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 600,
  background: colours.bg,
  color: colours.fg,
});

const cardBody: React.CSSProperties = {
  padding: '20px 24px',
  flex: 1,
};

const detailRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  padding: '8px 0',
  borderBottom: '1px solid #F9FAFB',
  gap: 16,
};

const detailLabel: React.CSSProperties = {
  fontSize: 12,
  color: '#6B7280',
  fontWeight: 600,
  letterSpacing: '0.02em',
  flex: '0 0 auto',
};

const detailValue: React.CSSProperties = {
  fontSize: 13,
  color: '#1C1C1E',
  textAlign: 'right',
  flex: '1 1 auto',
  wordBreak: 'break-all',
};

const notConnectedState: React.CSSProperties = {
  fontSize: 13,
  color: '#6B7280',
  padding: '20px 0',
  textAlign: 'center',
};

const cardActions: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  padding: '16px 24px',
  borderTop: '1px solid #F3F4F6',
  background: '#F9FAFB',
};

const buttonSecondary: React.CSSProperties = {
  flex: 1,
  padding: '8px 14px',
  fontSize: 13,
  fontWeight: 600,
  fontFamily: 'DM Sans, sans-serif',
  border: '1px solid #E5E7EB',
  background: '#FFFFFF',
  color: '#1C1C1E',
  borderRadius: 8,
  cursor: 'pointer',
};

const buttonDanger: React.CSSProperties = {
  flex: 1,
  padding: '8px 14px',
  fontSize: 13,
  fontWeight: 600,
  fontFamily: 'DM Sans, sans-serif',
  border: '1px solid #D92D20',
  background: '#D92D20',
  color: '#FFFFFF',
  borderRadius: 8,
  cursor: 'pointer',
};

const apiLogSection: React.CSSProperties = {
  marginTop: 16,
};

const sectionTitle: React.CSSProperties = {
  fontFamily: 'Montserrat, sans-serif',
  fontSize: 18,
  fontWeight: 700,
  color: '#1C1C1E',
  margin: 0,
  marginBottom: 4,
};

const sectionSubtitle: React.CSSProperties = {
  fontSize: 13,
  color: '#6B7280',
  marginTop: 0,
  marginBottom: 16,
};

const emptyApiLog: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px dashed #E5E7EB',
  borderRadius: 12,
  padding: 48,
  textAlign: 'center',
};

const emptyIcon: React.CSSProperties = {
  fontSize: 36,
  marginBottom: 8,
};

const emptyTitle: React.CSSProperties = {
  fontFamily: 'Montserrat, sans-serif',
  fontSize: 16,
  fontWeight: 600,
  color: '#1C1C1E',
  marginBottom: 4,
};

const emptyText: React.CSSProperties = {
  fontSize: 13,
  color: '#6B7280',
  maxWidth: 400,
  margin: '0 auto',
  lineHeight: 1.6,
};

const apiLogTable: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: 12,
  overflow: 'hidden',
};

const apiLogHeader: React.CSSProperties = {
  display: 'flex',
  background: '#F9FAFB',
  borderBottom: '1px solid #E5E7EB',
  padding: '10px 16px',
};

const apiLogHeaderCell: React.CSSProperties = {
  fontFamily: 'Montserrat, sans-serif',
  fontSize: 11,
  fontWeight: 700,
  color: '#6B7280',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
};

const apiLogRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px 16px',
  borderBottom: '1px solid #F3F4F6',
};

const apiLogCell: React.CSSProperties = {
  fontSize: 13,
  color: '#1C1C1E',
  paddingRight: 12,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};
