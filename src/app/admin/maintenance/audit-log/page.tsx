// src/app/admin/maintenance/audit-log/page.tsx
// MerxTax Sprint 7 · Slice 7A · Step 6
// Admin Audit Log Viewer — filterable list of all admin actions
//
// Displays every row from admin_audit_log with filters for action type,
// date range, acting admin, and target user. Click a row to expand the
// full before/after JSON snapshots.
//
// Design: VIGIL-reference — white background, #01D98D accents,
// Montserrat headings, DM Sans body, card-based layout.

'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

// ============ TYPES ============
interface AuditRow {
  id: string;
  admin_user_id: string;
  action_type: string;
  target_user_id: string | null;
  target_table: string | null;
  target_record_id: string | null;
  reason: string;
  before_snapshot: Record<string, unknown> | null;
  after_snapshot: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  acting_as_agent: boolean;
  created_at: string;
  // Joined from auth.users
  admin_email?: string | null;
  target_email?: string | null;
}

type ActionFilter = 'ALL' | string;

const ACTION_OPTIONS: { value: ActionFilter; label: string }[] = [
  { value: 'ALL', label: 'All actions' },
  { value: 'VIEW', label: 'View' },
  { value: 'INSERT', label: 'Insert' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'IMPERSONATE_START', label: 'Impersonate — start' },
  { value: 'IMPERSONATE_END', label: 'Impersonate — end' },
  { value: 'AGENT_FILE', label: 'Agent filing' },
  { value: 'HMRC_CONNECT', label: 'HMRC connect' },
  { value: 'HMRC_DISCONNECT', label: 'HMRC disconnect' },
  { value: 'PAYMENT_ACTION', label: 'Payment action' },
  { value: 'OTHER', label: 'Other' },
];

const PAGE_SIZE = 50;

// ============ ACTION BADGE COLOURS ============
function actionBadgeColours(action: string): { bg: string; fg: string } {
  switch (action) {
    case 'VIEW':
      return { bg: '#F3F4F6', fg: '#374151' };
    case 'INSERT':
    case 'AGENT_FILE':
      return { bg: '#D1FAE5', fg: '#065F46' };
    case 'UPDATE':
    case 'PAYMENT_ACTION':
      return { bg: '#DBEAFE', fg: '#1E40AF' };
    case 'DELETE':
    case 'HMRC_DISCONNECT':
      return { bg: '#FEE2E2', fg: '#991B1B' };
    case 'IMPERSONATE_START':
    case 'IMPERSONATE_END':
      return { bg: '#FEF3C7', fg: '#92400E' };
    case 'HMRC_CONNECT':
      return { bg: '#E0E7FF', fg: '#3730A3' };
    default:
      return { bg: '#F3F4F6', fg: '#6B7280' };
  }
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function shortId(id: string | null | undefined): string {
  return id ? id.slice(0, 8) + '…' : '—';
}

// ============ MAIN PAGE ============
export default function AuditLogPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [actionFilter, setActionFilter] = useState<ActionFilter>('ALL');
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      let query = supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (actionFilter !== 'ALL') {
        query = query.eq('action_type', actionFilter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError.message);
        setRows([]);
      } else {
        setRows((data ?? []) as AuditRow[]);
      }

      setLoading(false);
    }

    load();
  }, [actionFilter, page]);

  // Client-side text search across reason + target table
  const filteredRows = useMemo(() => {
    if (!searchText.trim()) return rows;
    const needle = searchText.trim().toLowerCase();
    return rows.filter((r) => {
      return (
        r.reason.toLowerCase().includes(needle) ||
        (r.target_table ?? '').toLowerCase().includes(needle) ||
        (r.target_record_id ?? '').toLowerCase().includes(needle) ||
        r.action_type.toLowerCase().includes(needle)
      );
    });
  }, [rows, searchText]);

  return (
    <div style={page_wrap}>
      {/* PAGE HEADER */}
      <div style={headerWrap}>
        <div>
          <h1 style={title}>Audit Log</h1>
          <p style={subtitle}>
            Immutable record of every admin action against user data.
            Required by GDPR Article 30.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={statPill}>
            {loading ? '…' : `${filteredRows.length} ${filteredRows.length === 1 ? 'entry' : 'entries'} on this page`}
          </div>
          <button
            onClick={() => {
              const headers = ['ID','Action Type','Admin User ID','Target User ID','Created At','Details']
              const rows = filteredRows.map((r: any) => [
                r.id, r.action_type, r.admin_user_id ?? '', r.target_user_id ?? '',
                new Date(r.created_at).toISOString(), JSON.stringify(r.details ?? {})
              ])
              const csv = [headers, ...rows].map(row => row.map((v: any) => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a'); a.href = url; a.download = `audit-log-${new Date().toISOString().slice(0,10)}.csv`; a.click()
              URL.revokeObjectURL(url)
            }}
            style={{ padding: '6px 16px', background: '#111827', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div style={filterBar}>
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(0);
          }}
          style={select}
        >
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search reason, table, record…"
          style={searchInput}
        />
      </div>

      {/* CONTENT */}
      {error && (
        <div style={errorBox}>
          <strong>Unable to load audit log:</strong> {error}
        </div>
      )}

      {loading && (
        <div style={stateBox}>
          <div style={stateText}>Loading audit entries…</div>
        </div>
      )}

      {!loading && !error && filteredRows.length === 0 && (
        <div style={stateBox}>
          <div style={emptyIcon}>📋</div>
          <div style={emptyTitle}>No audit entries yet</div>
          <div style={emptyText}>
            Admin actions will appear here as soon as they happen. Nothing
            has been logged{actionFilter !== 'ALL' ? ` for action type "${actionFilter}"` : ''}
            {searchText ? ` matching "${searchText}"` : ''}.
          </div>
        </div>
      )}

      {!loading && !error && filteredRows.length > 0 && (
        <div style={table}>
          {/* Table header */}
          <div style={tableHeaderRow}>
            <div style={{ ...headerCell, flex: '0 0 180px' }}>Timestamp</div>
            <div style={{ ...headerCell, flex: '0 0 110px' }}>Action</div>
            <div style={{ ...headerCell, flex: '0 0 120px' }}>Admin</div>
            <div style={{ ...headerCell, flex: '0 0 180px' }}>Target</div>
            <div style={{ ...headerCell, flex: '1 1 auto' }}>Reason</div>
          </div>

          {/* Rows */}
          {filteredRows.map((row) => {
            const isExpanded = expandedId === row.id;
            const badge = actionBadgeColours(row.action_type);

            return (
              <div key={row.id} style={rowWrap}>
                <button
                  style={rowButton}
                  onClick={() => setExpandedId(isExpanded ? null : row.id)}
                >
                  <div style={{ ...cell, flex: '0 0 180px' }}>
                    {formatTimestamp(row.created_at)}
                  </div>

                  <div style={{ ...cell, flex: '0 0 110px' }}>
                    <span
                      style={{
                        ...badgeStyle,
                        background: badge.bg,
                        color: badge.fg,
                      }}
                    >
                      {row.action_type}
                    </span>
                  </div>

                  <div style={{ ...cell, flex: '0 0 120px', fontFamily: 'monospace', fontSize: 12 }}>
                    {shortId(row.admin_user_id)}
                  </div>

                  <div style={{ ...cell, flex: '0 0 180px', fontSize: 13 }}>
                    {row.target_table ? (
                      <div>
                        <div style={{ fontFamily: 'monospace' }}>{row.target_table}</div>
                        <div style={{ fontSize: 11, color: '#6B7280' }}>
                          {shortId(row.target_record_id)}
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: '#9CA3AF' }}>—</span>
                    )}
                  </div>

                  <div style={{ ...cell, flex: '1 1 auto' }}>
                    <div style={reasonText}>{row.reason}</div>
                    {row.acting_as_agent && (
                      <span style={agentFlag}>Acting as Agent</span>
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div style={expandedBox}>
                    <div style={expandedGrid}>
                      <div>
                        <div style={snapshotLabel}>Before</div>
                        <pre style={snapshotCode}>
                          {row.before_snapshot
                            ? JSON.stringify(row.before_snapshot, null, 2)
                            : '—'}
                        </pre>
                      </div>
                      <div>
                        <div style={snapshotLabel}>After</div>
                        <pre style={snapshotCode}>
                          {row.after_snapshot
                            ? JSON.stringify(row.after_snapshot, null, 2)
                            : '—'}
                        </pre>
                      </div>
                    </div>

                    <div style={metaRow}>
                      <div>
                        <span style={metaLabel}>Audit ID:</span>{' '}
                        <span style={metaValue}>{row.id}</span>
                      </div>
                      <div>
                        <span style={metaLabel}>User agent:</span>{' '}
                        <span style={metaValue}>{row.user_agent ?? '—'}</span>
                      </div>
                      <div>
                        <span style={metaLabel}>IP:</span>{' '}
                        <span style={metaValue}>{row.ip_address ?? '—'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* PAGINATION */}
      {!loading && !error && rows.length > 0 && (
        <div style={pagination}>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{ ...pageButton, opacity: page === 0 ? 0.4 : 1 }}
          >
            ← Previous
          </button>
          <div style={pageIndicator}>Page {page + 1}</div>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={rows.length < PAGE_SIZE}
            style={{ ...pageButton, opacity: rows.length < PAGE_SIZE ? 0.4 : 1 }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

// ============ STYLES ============
const page_wrap: React.CSSProperties = {
  maxWidth: 1200,
  margin: '0 auto',
  fontFamily: 'DM Sans, sans-serif',
};

const headerWrap: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  marginBottom: 24,
  gap: 24,
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
  maxWidth: 560,
};

const statPill: React.CSSProperties = {
  background: '#F3F4F6',
  color: '#374151',
  padding: '8px 14px',
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 600,
  whiteSpace: 'nowrap',
};

const filterBar: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  marginBottom: 24,
  flexWrap: 'wrap',
};

const select: React.CSSProperties = {
  padding: '10px 14px',
  fontSize: 14,
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  background: '#FFFFFF',
  fontFamily: 'DM Sans, sans-serif',
  color: '#1C1C1E',
  cursor: 'pointer',
  minWidth: 180,
};

const searchInput: React.CSSProperties = {
  flex: 1,
  minWidth: 240,
  padding: '10px 14px',
  fontSize: 14,
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  background: '#FFFFFF',
  fontFamily: 'DM Sans, sans-serif',
  color: '#1C1C1E',
};

const errorBox: React.CSSProperties = {
  padding: 16,
  background: '#FEE2E2',
  color: '#991B1B',
  borderRadius: 8,
  fontSize: 14,
  marginBottom: 16,
};

const stateBox: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: 12,
  padding: 64,
  textAlign: 'center',
};

const stateText: React.CSSProperties = {
  fontSize: 14,
  color: '#6B7280',
};

const emptyIcon: React.CSSProperties = {
  fontSize: 48,
  marginBottom: 12,
};

const emptyTitle: React.CSSProperties = {
  fontFamily: 'Montserrat, sans-serif',
  fontSize: 18,
  fontWeight: 600,
  color: '#1C1C1E',
  marginBottom: 8,
};

const emptyText: React.CSSProperties = {
  fontSize: 14,
  color: '#6B7280',
  maxWidth: 420,
  margin: '0 auto',
  lineHeight: 1.6,
};

const table: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: 12,
  overflow: 'hidden',
};

const tableHeaderRow: React.CSSProperties = {
  display: 'flex',
  background: '#F9FAFB',
  borderBottom: '1px solid #E5E7EB',
  padding: '12px 16px',
};

const headerCell: React.CSSProperties = {
  fontFamily: 'Montserrat, sans-serif',
  fontSize: 11,
  fontWeight: 700,
  color: '#6B7280',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
};

const rowWrap: React.CSSProperties = {
  borderBottom: '1px solid #F3F4F6',
};

const rowButton: React.CSSProperties = {
  display: 'flex',
  width: '100%',
  padding: '14px 16px',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'left',
  alignItems: 'center',
  fontFamily: 'DM Sans, sans-serif',
};

const cell: React.CSSProperties = {
  fontSize: 13,
  color: '#1C1C1E',
  paddingRight: 12,
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  fontSize: 10,
  fontWeight: 700,
  fontFamily: 'Montserrat, sans-serif',
  letterSpacing: '0.04em',
  borderRadius: 4,
};

const reasonText: React.CSSProperties = {
  fontSize: 13,
  color: '#1C1C1E',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: 480,
};

const agentFlag: React.CSSProperties = {
  display: 'inline-block',
  marginTop: 4,
  padding: '1px 6px',
  fontSize: 10,
  fontWeight: 600,
  background: '#FEF3C7',
  color: '#92400E',
  borderRadius: 3,
};

const expandedBox: React.CSSProperties = {
  background: '#F9FAFB',
  padding: 20,
  borderTop: '1px solid #E5E7EB',
};

const expandedGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 16,
  marginBottom: 16,
};

const snapshotLabel: React.CSSProperties = {
  fontFamily: 'Montserrat, sans-serif',
  fontSize: 11,
  fontWeight: 700,
  color: '#6B7280',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  marginBottom: 6,
};

const snapshotCode: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: 6,
  padding: 12,
  fontSize: 12,
  fontFamily: 'Consolas, Monaco, monospace',
  color: '#1C1C1E',
  margin: 0,
  overflow: 'auto',
  maxHeight: 240,
};

const metaRow: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  fontSize: 11,
};

const metaLabel: React.CSSProperties = {
  color: '#6B7280',
  fontWeight: 600,
};

const metaValue: React.CSSProperties = {
  color: '#1C1C1E',
  fontFamily: 'Consolas, Monaco, monospace',
};

const pagination: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 16,
  marginTop: 24,
};

const pageButton: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: 14,
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  background: '#FFFFFF',
  fontFamily: 'DM Sans, sans-serif',
  color: '#1C1C1E',
  cursor: 'pointer',
};

const pageIndicator: React.CSSProperties = {
  fontSize: 13,
  color: '#6B7280',
  fontWeight: 600,
};
