'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

const ADMIN_EMAIL = 'mark.dyas@merxdigital.co.uk';

type Relationship = {
  id: string;
  agent_id: string;
  client_name: string;
  client_ref: string;
  nino?: string;
  utr?: string;
  status: string;
  tax_year?: string;
  created_at: string;
  authorised_at?: string;
  rejected_at?: string;
  agent_name?: string;
  agent_email?: string;
  agent_plan?: string;
};

type Filter = 'pending' | 'authorised' | 'rejected' | 'all';

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminPage() {
  const supabase = createClient();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [filter, setFilter] = useState<Filter>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [selected, setSelected] = useState<Relationship | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    if (user.email !== ADMIN_EMAIL) { window.location.href = '/dashboard'; return; }
    setAuthorized(true);

    // Fetch all agent relationships
    const { data: rels } = await supabase
      .from('agent_relationships')
      .select('*')
      .order('created_at', { ascending: false });

    if (!rels || rels.length === 0) { setRelationships([]); setLoading(false); return; }

    // Get agent profiles
    const agentIds = [...new Set(rels.map((r: any) => r.agent_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, plan')
      .in('id', agentIds);

    // Get agent emails from auth
    const profileMap: Record<string, any> = {};
    (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });

    const enriched: Relationship[] = rels.map((r: any) => ({
      ...r,
      agent_name: profileMap[r.agent_id]?.full_name || 'Unknown',
      agent_plan: profileMap[r.agent_id]?.plan || '—',
    }));

    setRelationships(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (rel: Relationship, action: 'authorised' | 'rejected') => {
    setActionLoading(rel.id);
    const update: any = { status: action };
    if (action === 'authorised') update.authorised_at = new Date().toISOString();
    if (action === 'rejected') update.rejected_at = new Date().toISOString();
    await supabase.from('agent_relationships').update(update).eq('id', rel.id);
    showToast(`${rel.client_name} ${action === 'authorised' ? 'approved' : 'rejected'} ✓`);
    setSelected(null);
    await load();
    setActionLoading(null);
  };

  const filtered = relationships.filter(r => filter === 'all' ? true : r.status === filter);
  const counts = {
    pending: relationships.filter(r => r.status === 'pending').length,
    authorised: relationships.filter(r => r.status === 'authorised').length,
    rejected: relationships.filter(r => r.status === 'rejected').length,
    all: relationships.length,
  };

  const statusStyle = (s: string) => {
    if (s === 'authorised') return { bg: '#F0FDF8', color: '#065F46', border: '#BBF7E4' };
    if (s === 'pending') return { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' };
    if (s === 'rejected') return { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' };
    return { bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' };
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EEF1F4', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ color: '#9CA3AF', fontSize: 14 }}>Loading...</div>
    </div>
  );

  if (!authorized) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#EEF1F4', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Montserrat:wght@700;800&display=swap'); * { box-sizing: border-box; }`}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#0A2E1E', color: '#01D98D', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, zIndex: 999 }}>
          {toast}
        </div>
      )}

      {/* Top bar */}
      <div style={{ background: '#0A2E1E', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 16, color: '#01D98D' }}>merXtax</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>|</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Admin Panel</span>
        </div>
        <button onClick={() => { window.location.href = '/dashboard'; }} style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
          ← Back to dashboard
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 22, color: '#0A2E1E', marginBottom: 4 }}>Agent Authorisation Panel</div>
          <div style={{ fontSize: 13, color: '#6B7280' }}>Review and approve agent-client relationships submitted by users.</div>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {([['pending', 'Pending', '#FFFBEB', '#92400E', '#FDE68A'], ['authorised', 'Authorised', '#F0FDF8', '#065F46', '#BBF7E4'], ['rejected', 'Rejected', '#FEF2F2', '#991B1B', '#FECACA'], ['all', 'Total', '#F9FAFB', '#374151', '#E5E7EB']] as const).map(([key, label, bg, color, border]) => (
            <div key={key} onClick={() => setFilter(key as Filter)} style={{ background: filter === key ? bg : '#fff', border: `1px solid ${filter === key ? border : '#E5E7EB'}`, borderRadius: 12, padding: '16px 20px', cursor: 'pointer', transition: 'all 0.15s' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: filter === key ? color : '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 28, color: filter === key ? color : '#0A2E1E' }}>{counts[key as Filter]}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 16 }}>

          {/* Table */}
          <div style={{ background: '#fff', border: '0.5px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '0.5px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0A2E1E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {filter === 'all' ? 'All submissions' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} submissions`} ({filtered.length})
              </div>
              <button onClick={() => load()} style={{ fontSize: 11, color: '#01D98D', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>↻ Refresh</button>
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
                No {filter === 'all' ? '' : filter} submissions.
              </div>
            ) : (
              <div>
                {/* Table header */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 100px 120px', padding: '10px 20px', background: '#F9FAFB', borderBottom: '0.5px solid #E5E7EB' }}>
                  {['Client', 'Agent', 'UTR / NINO', 'Status', 'Submitted'].map(h => (
                    <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
                  ))}
                </div>

                {filtered.map((rel, i) => {
                  const sc = statusStyle(rel.status);
                  const isSelected = selected?.id === rel.id;
                  return (
                    <div key={rel.id} onClick={() => setSelected(isSelected ? null : rel)} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 100px 120px', padding: '14px 20px', borderBottom: i < filtered.length - 1 ? '0.5px solid #F3F4F6' : 'none', cursor: 'pointer', background: isSelected ? '#F0FDF8' : 'transparent', transition: 'background 0.1s' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0A2E1E', marginBottom: 2 }}>{rel.client_name}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>Ref: {rel.client_ref}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 2 }}>{rel.agent_name}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>{rel.agent_plan?.toUpperCase()} plan</div>
                      </div>
                      <div style={{ fontSize: 12, color: '#374151' }}>
                        {rel.utr && <div>UTR: {rel.utr}</div>}
                        {rel.nino && <div>NI: {rel.nino}</div>}
                        {!rel.utr && !rel.nino && <div style={{ color: '#9CA3AF' }}>—</div>}
                      </div>
                      <div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                          {rel.status.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{fmt(rel.created_at)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ background: '#fff', border: '0.5px solid #E5E7EB', borderRadius: 12, padding: '22px', height: 'fit-content', position: 'sticky', top: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 16, color: '#0A2E1E', marginBottom: 3 }}>{selected.client_name}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>Ref: {selected.client_ref}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>✕</button>
              </div>

              {/* Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 22 }}>
                {[
                  ['Agent', selected.agent_name || '—'],
                  ['Agent Plan', selected.agent_plan?.toUpperCase() || '—'],
                  ['UTR', selected.utr || '—'],
                  ['NI Number', selected.nino || '—'],
                  ['Tax Year', selected.tax_year || '—'],
                  ['Submitted', fmt(selected.created_at)],
                  ...(selected.authorised_at ? [['Authorised', fmt(selected.authorised_at)]] : []),
                  ...(selected.rejected_at ? [['Rejected', fmt(selected.rejected_at)]] : []),
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>{label}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0A2E1E', textAlign: 'right' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Status badge */}
              <div style={{ marginBottom: 20, padding: '10px 14px', borderRadius: 9, ...(() => { const sc = statusStyle(selected.status); return { background: sc.bg, border: `1px solid ${sc.border}` }; })() }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: (() => statusStyle(selected.status).color)(), textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Current status: {selected.status}
                </div>
              </div>

              {/* Action buttons */}
              {selected.status === 'pending' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    onClick={() => handleAction(selected, 'authorised')}
                    disabled={actionLoading === selected.id}
                    style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: '#01D98D', color: '#0A2E1E', fontWeight: 700, fontSize: 14, cursor: actionLoading === selected.id ? 'not-allowed' : 'pointer', opacity: actionLoading === selected.id ? 0.7 : 1, fontFamily: "'DM Sans', sans-serif" }}>
                    {actionLoading === selected.id ? 'Processing...' : '✓ Approve — Authorise Client'}
                  </button>
                  <button
                    onClick={() => handleAction(selected, 'rejected')}
                    disabled={actionLoading === selected.id}
                    style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #FECACA', background: '#FEF2F2', color: '#991B1B', fontWeight: 700, fontSize: 14, cursor: actionLoading === selected.id ? 'not-allowed' : 'pointer', opacity: actionLoading === selected.id ? 0.7 : 1, fontFamily: "'DM Sans', sans-serif" }}>
                    ✕ Reject
                  </button>
                </div>
              )}

              {selected.status === 'authorised' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ padding: '12px 14px', background: '#F0FDF8', border: '1px solid #BBF7E4', borderRadius: 10, fontSize: 12, color: '#065F46', fontWeight: 600 }}>
                    ✓ Already authorised
                  </div>
                  <button
                    onClick={() => handleAction(selected, 'rejected')}
                    disabled={actionLoading === selected.id}
                    style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #FECACA', background: '#FEF2F2', color: '#991B1B', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                    Revoke authorisation
                  </button>
                </div>
              )}

              {selected.status === 'rejected' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, fontSize: 12, color: '#991B1B', fontWeight: 600 }}>
                    ✕ Already rejected
                  </div>
                  <button
                    onClick={() => handleAction(selected, 'authorised')}
                    disabled={actionLoading === selected.id}
                    style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: '#01D98D', color: '#0A2E1E', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                    Approve anyway
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
