'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ThemeProvider } from '@/lib/ThemeContext';
import Sidebar from '@/components/Sidebar';

const AGENT_CODE = '0952CH';

type Client = {
  id: string;
  client_name: string;
  client_ref: string;
  nino?: string;
  utr?: string;
  status: string;
  authorised_at?: string;
  tax_year?: string;
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n);
}

export default function AgentPage() {
  const supabase = createClient();
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [plan, setPlan] = useState('AGENT');
  const [netProfit, setNetProfit] = useState(0);
  const [clients, setClients] = useState<Client[]>([]);
  const [view, setView] = useState<'overview' | 'add' | 'detail'>('overview');
  const [selected, setSelected] = useState<Client | null>(null);

  // Add client form
  const [clientName, setClientName] = useState('');
  const [clientRef, setClientRef] = useState('');
  const [nino, setNino] = useState('');
  const [utr, setUtr] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState('');

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }

    const { data: profile } = await supabase.from('profiles').select('full_name, plan').eq('id', user.id).single();
    setUserName(profile?.full_name || '');
    setPlan(profile?.plan?.toUpperCase() || 'AGENT');

    const { data: rels } = await supabase.from('agent_relationships').select('*').eq('agent_id', user.id).order('created_at', { ascending: false });
    setClients(rels || []);

    const today = new Date();
    const y = today.getFullYear(), m = today.getMonth() + 1, d = today.getDate();
    const after = m > 4 || (m === 4 && d >= 6);
    const taxYear = after ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`;
    const { data: txData } = await supabase.from('transactions').select('type, amount_gross, status').eq('tax_year', taxYear).eq('status', 'CONFIRMED');
    const inc = (txData || []).filter((t: any) => t.type === 'INCOME').reduce((s: number, t: any) => s + Number(t.amount_gross), 0);
    const exp = (txData || []).filter((t: any) => t.type === 'EXPENSE').reduce((s: number, t: any) => s + Number(t.amount_gross), 0);
    setNetProfit(inc - exp);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleVerify = async () => {
    if (!utr.trim()) { setVerifyResult('Please enter a UTR number first.'); return; }
    setVerifying(true); setVerifyResult('');
    await new Promise(r => setTimeout(r, 1500));
    // Sandbox verification — in production this calls HMRC CIS verify API
    if (utr.replace(/\s/g, '').length === 10) {
      setVerifyResult('✓ UTR format valid. In production this will verify with HMRC in real time.');
    } else {
      setVerifyResult('✗ UTR must be 10 digits. Please check and try again.');
    }
    setVerifying(false);
  };

  const handleAddClient = async () => {
    if (!clientName.trim()) { setMsg('Client name is required.'); return; }
    if (!utr.trim() && !nino.trim()) { setMsg('Please enter either a UTR or NI number.'); return; }
    setSaving(true); setMsg('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('agent_relationships').insert({
      agent_id: user.id,
      client_name: clientName.trim(),
      client_ref: clientRef.trim() || clientName.trim().toUpperCase().replace(/\s/g, '-'),
      nino: nino.trim() || null,
      utr: utr.trim() || null,
      status: 'pending',
      tax_year: '2026-27',
    });

    if (error) { setMsg('Failed to add client. Please try again.'); setSaving(false); return; }

    await load();
    setView('overview');
    resetForm();
    setSaving(false);
  };

  const handleAuthorise = async (client: Client) => {
    await supabase.from('agent_relationships').update({ status: 'authorised', authorised_at: new Date().toISOString() }).eq('id', client.id);
    await load();
    setSelected(prev => prev ? { ...prev, status: 'authorised', authorised_at: new Date().toISOString() } : null);
  };

  const handleRemove = async (client: Client) => {
    await supabase.from('agent_relationships').delete().eq('id', client.id);
    await load();
    setView('overview');
    setSelected(null);
  };

  const resetForm = () => { setClientName(''); setClientRef(''); setNino(''); setUtr(''); setVerifyResult(''); setMsg(''); };

  const statusColor = (s: string) => {
    if (s === 'authorised') return { bg: '#F0FDF8', color: '#065F46', border: '#BBF7E4' };
    if (s === 'pending') return { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' };
    return { bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' };
  };

  const inputStyle = { width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid #E5E7EB', borderRadius: 10, outline: 'none', fontFamily: "'DM Sans', sans-serif", color: '#1C1C1E', background: '#fff' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 };

  const authorised = clients.filter(c => c.status === 'authorised');
  const pending = clients.filter(c => c.status === 'pending');

  return (
    <ThemeProvider>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#EEF1F4', fontFamily: "'DM Sans', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Montserrat:wght@700;800;900&display=swap'); * { box-sizing: border-box; }`}</style>

        <Sidebar active="AGENT" userName={userName} plan={plan} netProfit={netProfit} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

          {/* Top bar — desktop only */}
          {!isMobile && (
            <div style={{ background: '#fff', borderBottom: '0.5px solid #E5E7EB', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 18, color: '#0A2E1E' }}>AGENT</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>SA Agent Code: <strong style={{ color: '#0A2E1E' }}>{AGENT_CODE}</strong></div>
                {view === 'overview' && (
                  <button onClick={() => { resetForm(); setView('add'); }} style={{ fontSize: 13, padding: '8px 18px', borderRadius: 9, background: '#01D98D', color: '#0A2E1E', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                    + Add client
                  </button>
                )}
                {view !== 'overview' && (
                  <button onClick={() => { setView('overview'); setSelected(null); }} style={{ fontSize: 13, padding: '8px 18px', borderRadius: 9, background: '#F3F4F6', color: '#0A2E1E', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                    ← Back
                  </button>
                )}
              </div>
            </div>
          )}

          <div style={{ flex: 1, padding: isMobile ? '12px 14px 24px' : '24px 28px', overflowY: 'auto' }}>

            {/* Mobile header */}
            {isMobile && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 16, color: '#0A2E1E' }}>
                  {view === 'overview' ? 'AGENT' : view === 'add' ? 'Add Client' : 'Client Detail'}
                </div>
                {view === 'overview' ? (
                  <button onClick={() => { resetForm(); setView('add'); }} style={{ fontSize: 12, padding: '7px 14px', borderRadius: 9, background: '#01D98D', color: '#0A2E1E', border: 'none', fontWeight: 700, cursor: 'pointer' }}>+ Add</button>
                ) : (
                  <button onClick={() => { setView('overview'); setSelected(null); }} style={{ fontSize: 12, padding: '7px 14px', borderRadius: 9, background: '#F3F4F6', color: '#0A2E1E', border: 'none', fontWeight: 600, cursor: 'pointer' }}>← Back</button>
                )}
              </div>
            )}

            {/* ── OVERVIEW ── */}
            {view === 'overview' && (
              <>
                {/* Agent info banner */}
                <div style={{ background: 'linear-gradient(175deg, #01D98D 0%, #01D98D 45%, #0EBDCA 100%)', borderRadius: 16, padding: '24px 28px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(10,46,30,0.6)', marginBottom: 6 }}>HMRC Agent Status</div>
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 22, color: '#0A2E1E', marginBottom: 4 }}>Self Assessment Agent</div>
                    <div style={{ fontSize: 13, color: 'rgba(10,46,30,0.65)' }}>Agent Code: <strong>{AGENT_CODE}</strong> · Authorised to act for clients</div>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ background: 'rgba(255,255,255,0.3)', borderRadius: 10, padding: '12px 20px', textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 28, color: '#0A2E1E' }}>{authorised.length}</div>
                      <div style={{ fontSize: 11, color: 'rgba(10,46,30,0.6)', fontWeight: 600 }}>Authorised</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.3)', borderRadius: 10, padding: '12px 20px', textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 28, color: '#0A2E1E' }}>{pending.length}</div>
                      <div style={{ fontSize: 11, color: 'rgba(10,46,30,0.6)', fontWeight: 600 }}>Pending</div>
                    </div>
                  </div>
                </div>

                {/* How it works */}
                <div style={{ background: '#F0FDF8', border: '1px solid #BBF7E4', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#01D98D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#0A2E1E', flexShrink: 0 }}>i</div>
                  <div style={{ fontSize: 13, color: '#065F46', lineHeight: 1.7 }}>
                    <strong>How client authorisation works:</strong> Add your client below, then they must authorise you via HMRC's online services (Government Gateway → Manage who can deal with HMRC for you). Once they approve, their status updates to Authorised and you can submit on their behalf using Agent Code <strong>{AGENT_CODE}</strong>.
                  </div>
                </div>

                {loading ? (
                  <div style={{ color: '#9CA3AF', fontSize: 14 }}>Loading clients...</div>
                ) : clients.length === 0 ? (
                  <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '48px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: '#0A2E1E', marginBottom: 8 }}>No clients yet</div>
                    <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>Add your first client to begin managing their Self Assessment submissions.</div>
                    <button onClick={() => { resetForm(); setView('add'); }} style={{ fontSize: 13, padding: '10px 24px', borderRadius: 10, background: '#01D98D', color: '#0A2E1E', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                      + Add first client
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Authorised clients */}
                    {authorised.length > 0 && (
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#065F46', marginBottom: 12 }}>Authorised Clients</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {authorised.map(c => {
                            const sc = statusColor(c.status);
                            return (
                              <div key={c.id} onClick={() => { setSelected(c); setView('detail'); }} style={{ background: '#fff', border: '0.5px solid #E5E7EB', borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 12 }}>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0A2E1E', marginBottom: 2 }}>{c.client_name}</div>
                                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>Ref: {c.client_ref} {c.utr ? `· UTR: ${c.utr}` : ''}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                                    {c.status.toUpperCase()}
                                  </span>
                                  <span style={{ color: '#9CA3AF', fontSize: 14 }}>›</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Pending clients */}
                    {pending.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#92400E', marginBottom: 12 }}>Pending Authorisation</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {pending.map(c => {
                            const sc = statusColor(c.status);
                            return (
                              <div key={c.id} onClick={() => { setSelected(c); setView('detail'); }} style={{ background: '#fff', border: '1px solid #FDE68A', borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 12 }}>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0A2E1E', marginBottom: 2 }}>{c.client_name}</div>
                                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>Ref: {c.client_ref} {c.utr ? `· UTR: ${c.utr}` : ''}</div>
                                  <div style={{ fontSize: 11, color: '#92400E', marginTop: 4 }}>Awaiting client authorisation via HMRC</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                                    {c.status.toUpperCase()}
                                  </span>
                                  <span style={{ color: '#9CA3AF', fontSize: 14 }}>›</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* ── ADD CLIENT ── */}
            {view === 'add' && (
              <div style={{ maxWidth: 620, margin: '0 auto' }}>
                {msg && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#991B1B', marginBottom: 16 }}>{msg}</div>}

                <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '28px', marginBottom: 16 }}>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: '#0A2E1E', marginBottom: 20 }}>Client Details</div>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={labelStyle}>Full Name *</label>
                      <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="John Smith" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Client Reference</label>
                      <input value={clientRef} onChange={e => setClientRef(e.target.value)} placeholder="Auto-generated if blank" style={inputStyle} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={labelStyle}>NI Number</label>
                      <input value={nino} onChange={e => setNino(e.target.value.toUpperCase())} placeholder="AB123456C" style={inputStyle} maxLength={9} />
                    </div>
                    <div>
                      <label style={labelStyle}>UTR Number</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input value={utr} onChange={e => setUtr(e.target.value)} placeholder="1234567890" style={{ ...inputStyle, flex: 1 }} maxLength={10} />
                        <button onClick={handleVerify} disabled={verifying} style={{ padding: '10px 14px', borderRadius: 10, background: verifying ? '#F3F4F6' : '#F0FDF8', color: verifying ? '#9CA3AF' : '#065F46', border: '1px solid #BBF7E4', fontWeight: 600, fontSize: 12, cursor: verifying ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
                          {verifying ? '...' : 'Verify'}
                        </button>
                      </div>
                      {verifyResult && (
                        <div style={{ marginTop: 6, fontSize: 12, color: verifyResult.startsWith('✓') ? '#065F46' : '#991B1B' }}>{verifyResult}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Authorisation instructions */}
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 14, color: '#92400E', marginBottom: 12 }}>📋 Next steps after adding</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      'Your client logs in to their HMRC online account (Government Gateway)',
                      'They go to: Manage who can deal with HMRC for you',
                      'They search for agent using your code: ' + AGENT_CODE,
                      'They approve the authorisation request',
                      'Status updates to Authorised — you can then submit on their behalf',
                    ].map((step, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{i + 1}</div>
                        <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={handleAddClient} disabled={saving} style={{ flex: 1, fontSize: 14, padding: '12px', borderRadius: 10, background: saving ? '#a3f0d4' : '#01D98D', color: '#0A2E1E', border: 'none', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                    {saving ? 'Saving...' : 'Add Client'}
                  </button>
                  <button onClick={() => { setView('overview'); resetForm(); }} style={{ padding: '12px 20px', borderRadius: 10, background: '#F3F4F6', color: '#6B7280', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ── CLIENT DETAIL ── */}
            {view === 'detail' && selected && (
              <div style={{ maxWidth: 620, margin: '0 auto' }}>
                {/* Status card */}
                <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '24px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                    <div>
                      <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 20, color: '#0A2E1E', marginBottom: 4 }}>{selected.client_name}</div>
                      <div style={{ fontSize: 13, color: '#6B7280' }}>Ref: {selected.client_ref}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 20, ...(() => { const sc = statusColor(selected.status); return { background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }; })() }}>
                      {selected.status.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    {selected.nino && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>NI Number</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#0A2E1E' }}>{selected.nino}</div>
                      </div>
                    )}
                    {selected.utr && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>UTR</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#0A2E1E' }}>{selected.utr}</div>
                      </div>
                    )}
                    {selected.authorised_at && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Authorised On</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#0A2E1E' }}>{new Date(selected.authorised_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Agent Code</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0A2E1E' }}>{AGENT_CODE}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {selected.status === 'pending' && (
                      <button onClick={() => handleAuthorise(selected)} style={{ fontSize: 13, padding: '10px 20px', borderRadius: 9, background: '#01D98D', color: '#0A2E1E', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                        ✓ Mark as Authorised
                      </button>
                    )}
                    <a href="https://www.gov.uk/guidance/client-authorisation-an-overview" target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 13, padding: '10px 20px', borderRadius: 9, background: '#F3F4F6', color: '#0A2E1E', border: 'none', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                      HMRC Guide →
                    </a>
                    <button onClick={() => handleRemove(selected)} style={{ fontSize: 13, padding: '10px 20px', borderRadius: 9, background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', fontWeight: 600, cursor: 'pointer' }}>
                      Remove Client
                    </button>
                  </div>
                </div>

                {/* Pending instructions */}
                {selected.status === 'pending' && (
                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 16, padding: '20px 24px' }}>
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 14, color: '#92400E', marginBottom: 12 }}>Waiting for client to authorise</div>
                    <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }}>
                      Ask your client to log in to their HMRC Government Gateway account and authorise you using Agent Code <strong>{AGENT_CODE}</strong>. Once they approve, click "Mark as Authorised" above.
                    </div>
                    <div style={{ marginTop: 12, padding: '10px 14px', background: '#fff', borderRadius: 8, fontSize: 12, color: '#92400E', fontWeight: 600 }}>
                      HMRC link for your client: gov.uk → "Manage who can deal with HMRC for you"
                    </div>
                  </div>
                )}

                {selected.status === 'authorised' && (
                  <div style={{ background: '#F0FDF8', border: '1px solid #BBF7E4', borderRadius: 16, padding: '20px 24px' }}>
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 14, color: '#065F46', marginBottom: 8 }}>✓ Fully authorised</div>
                    <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }}>
                      You can now submit Self Assessment returns, view tax liabilities, and communicate with HMRC on behalf of this client using your Agent Code <strong>{AGENT_CODE}</strong>.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
