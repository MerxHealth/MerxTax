'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ThemeProvider } from '@/lib/ThemeContext';
import Sidebar from '@/components/Sidebar';

function getTaxYear(date: Date): string {
  const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
  const after = m > 4 || (m === 4 && d >= 6);
  return after ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`;
}

function getHMRCQuarter(date: Date): 'Q1' | 'Q2' | 'Q3' | 'Q4' {
  const m = date.getMonth() + 1, d = date.getDate(), n = m * 100 + d;
  if (n >= 406 && n <= 705) return 'Q1';
  if (n >= 706 && n <= 1005) return 'Q2';
  if (n >= 1006 || n <= 105) return 'Q3';
  return 'Q4';
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n);
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function getQuarterDeadlines(taxYear: string) {
  const y = parseInt(taxYear.split('-')[0]);
  return { Q1: `${y}-08-07`, Q2: `${y}-11-07`, Q3: `${y + 1}-02-07`, Q4: `${y + 1}-05-07` };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const INCOME_CATEGORIES = ['Freelance / Consulting', 'Sales', 'Rental Income', 'Investment Income', 'Other Income'];
const EXPENSE_CATEGORIES = ['Office & Supplies', 'Travel & Mileage', 'Software & Subscriptions', 'Marketing & Advertising', 'Professional Services', 'Equipment', 'Meals & Entertainment', 'Utilities', 'Other Expense'];

function AddTransactionModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const supabase = createClient();
  const [step, setStep] = useState<'choose' | 'manual'>('choose');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const categories = type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSave = async () => {
    if (!description.trim()) { setError('Please enter a description.'); return; }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) { setError('Please enter a valid amount.'); return; }
    if (!category) { setError('Please select a category.'); return; }
    setSaving(true);
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    const txDate = new Date(date);
    const quarter = getHMRCQuarter(txDate);
    const taxYear = getTaxYear(txDate);
    const { error: err } = await supabase.from('transactions').insert({
      user_id: user.id,
      type,
      description: description.trim(),
      amount_gross: Number(amount),
      category,
      date,
      quarter,
      tax_year: taxYear,
      status: 'CONFIRMED',
    });
    setSaving(false);
    if (err) { setError('Failed to save. Please try again.'); return; }
    onSaved();
    onClose();
  };

  const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 };
  const modal: React.CSSProperties = { background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, padding: 28, fontFamily: "'DM Sans', sans-serif", position: 'relative' };
  const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#0A2E1E', marginBottom: 5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' };
  const input: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none', marginBottom: 14, boxSizing: 'border-box' };

  if (step === 'choose') {
    return (
      <div style={overlay} onClick={onClose}>
        <div style={modal} onClick={e => e.stopPropagation()}>
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9CA3AF' }}>✕</button>
          <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 18, color: '#0A2E1E', marginBottom: 6 }}>Add Transaction</div>
          <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>How would you like to add it?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div onClick={() => setStep('manual')} style={{ border: '1.5px solid #01D98D', borderRadius: 12, padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F0FDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>✏️</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0A2E1E' }}>Manual Entry</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Type in the details yourself</div>
              </div>
            </div>
            <div onClick={() => { onClose(); window.location.href = '/dashboard/impensum'; }} style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🤖</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0A2E1E' }}>Smart Entry — IMPENSUM</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Scan a receipt, use voice, or GPS mileage</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9CA3AF' }}>✕</button>
        <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 18, color: '#0A2E1E', marginBottom: 20 }}>Manual Entry</div>

        {/* Type toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          {(['INCOME', 'EXPENSE'] as const).map(t => (
            <button key={t} onClick={() => { setType(t); setCategory(''); }} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: `1.5px solid ${type === t ? (t === 'INCOME' ? '#01D98D' : '#EF4444') : '#E5E7EB'}`, background: type === t ? (t === 'INCOME' ? '#F0FDF8' : '#FEF2F2') : '#fff', color: type === t ? (t === 'INCOME' ? '#065F46' : '#991B1B') : '#6B7280', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              {t === 'INCOME' ? '↑ Income' : '↓ Expense'}
            </button>
          ))}
        </div>

        <label style={label}>Description</label>
        <input style={input} placeholder="e.g. Invoice #001 — Client A" value={description} onChange={e => setDescription(e.target.value)} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={label}>Amount (£)</label>
            <input style={input} type="number" placeholder="0.00" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div>
            <label style={label}>Date</label>
            <input style={input} type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>

        <label style={label}>Category</label>
        <select style={{ ...input, color: category ? '#0A2E1E' : '#9CA3AF' }} value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">Select category...</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {error && <div style={{ fontSize: 12, color: '#EF4444', marginBottom: 12, marginTop: -8 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button onClick={() => setStep('choose')} style={{ flex: 1, padding: '11px 0', borderRadius: 9, border: '1px solid #E5E7EB', background: '#fff', color: '#6B7280', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Back</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '11px 0', borderRadius: 9, border: 'none', background: '#01D98D', color: '#0A2E1E', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: "'DM Sans', sans-serif" }}>
            {saving ? 'Saving...' : 'Save Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const supabase = createClient();
  const today = new Date();
  const currentTaxYear = getTaxYear(today);
  const currentQuarter = getHMRCQuarter(today);

  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [plan, setPlan] = useState('SOLO');
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [taxDue, setTaxDue] = useState(0);
  const [totalTx, setTotalTx] = useState(0);
  const [draftTx, setDraftTx] = useState(0);
  const [complianceScore, setComplianceScore] = useState(0);
  const [quarterStatuses, setQuarterStatuses] = useState<Record<string, string>>({});
  const [quarterReadiness, setQuarterReadiness] = useState<Record<string, number>>({});
  const [connected, setConnected] = useState(false);
  const [nextAction, setNextAction] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }

    const { data: profile } = await supabase.from('profiles').select('full_name, plan').eq('id', user.id).single();
    setUserName(profile?.full_name || '');
    setPlan(profile?.plan?.toUpperCase() || 'SOLO');

    const connRes = await fetch('/api/vrn');
    const connData = await connRes.json();
    setConnected(!!connData.connected);

    const { data: txData } = await supabase.from('transactions').select('type, amount_gross, status, quarter').eq('tax_year', currentTaxYear);
    const { data: subData } = await supabase.from('quarterly_submissions').select('quarter, status').eq('tax_year', currentTaxYear);

    const confirmed = (txData || []).filter((t: any) => t.status === 'CONFIRMED');
    const drafts = (txData || []).filter((t: any) => t.status !== 'CONFIRMED');
    const inc = confirmed.filter((t: any) => t.type === 'INCOME').reduce((s: number, t: any) => s + Number(t.amount_gross), 0);
    const exp = confirmed.filter((t: any) => t.type === 'EXPENSE').reduce((s: number, t: any) => s + Number(t.amount_gross), 0);
    const net = inc - exp;
    const tax = Math.max(0, (Math.min(net, 50270) - 12570) * 0.2 + Math.max(0, net - 50270) * 0.4);

    setIncome(inc); setExpenses(exp); setNetProfit(net); setTaxDue(tax);
    setTotalTx((txData || []).length); setDraftTx(drafts.length);

    const deadlines = getQuarterDeadlines(currentTaxYear);
    const statusMap: Record<string, string> = {};
    const readinessMap: Record<string, number> = {};
    (['Q1','Q2','Q3','Q4'] as const).forEach(q => {
      const sub = (subData || []).find((s: any) => s.quarter === q);
      statusMap[q] = sub?.status || 'pending';
      const qTx = (txData || []).filter((t: any) => t.quarter === q);
      const qConf = qTx.filter((t: any) => t.status === 'CONFIRMED');
      readinessMap[q] = qTx.length === 0 ? 0 : Math.round((qConf.length / qTx.length) * 100);
    });
    setQuarterStatuses(statusMap);
    setQuarterReadiness(readinessMap);

    let score = 0;
    if (connData.connected) score += 25;
    if (connData.vrn) score += 15;
    if ((txData || []).length > 0) score += 20;
    if (drafts.length === 0 && (txData || []).length > 0) score += 20;
    if ((txData || []).filter((t: any) => t.quarter === currentQuarter).length > 0) score += 20;
    setComplianceScore(Math.min(100, score));

    if (!connData.connected) setNextAction('Connect your HMRC account to unlock your full compliance picture.');
    else if (drafts.length > 0) setNextAction(`You have ${drafts.length} draft transaction${drafts.length > 1 ? 's' : ''} to confirm before your next submission.`);
    else if ((txData || []).length === 0) setNextAction('Add your first transaction — it only takes 10 seconds.');
    else setNextAction('Everything looks good. Keep recording your income and expenses regularly.');

    setLoading(false);
  }, [currentTaxYear, currentQuarter]);

  useEffect(() => { load(); }, [load]);

  const deadlines = getQuarterDeadlines(currentTaxYear);

  const qColour = (q: string) => {
    const s = quarterStatuses[q];
    if (s === 'submitted' || s === 'accepted') return '#01D98D';
    const days = daysUntil(deadlines[q as keyof typeof deadlines]);
    if (days < 0) return '#EF4444';
    if (days < 30) return '#F59E0B';
    return '#9CA3AF';
  };

  const qLabel = (q: string) => {
    const s = quarterStatuses[q];
    if (s === 'submitted' || s === 'accepted') return 'Filed';
    const days = daysUntil(deadlines[q as keyof typeof deadlines]);
    if (days < 0) return 'Overdue';
    if (days < 14) return 'Urgent';
    if (days < 30) return 'Due soon';
    return 'Upcoming';
  };

  const scoreColor = complianceScore >= 80 ? '#01D98D' : complianceScore >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <ThemeProvider>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#EEF1F4', fontFamily: "'DM Sans', sans-serif" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Montserrat:wght@600;700;800&display=swap');
          * { box-sizing: border-box; }
          .dash-topbar { display: flex; }
          .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
          .main-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 12px; margin-bottom: 20px; }
          .quarter-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 18px; }
          .quickadd-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
          .dash-content { flex: 1; padding: 12px 28px 24px; overflow-y: auto; }
          @media (max-width: 767px) {
            .dash-topbar { display: none !important; }
            .stat-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
            .main-grid { grid-template-columns: 1fr; }
            .quarter-grid { grid-template-columns: repeat(2, 1fr); }
            .quickadd-grid { grid-template-columns: repeat(3, 1fr); }
            .dash-content { padding: 12px 14px 24px; }
            .hmrc-banner { flex-direction: column; gap: 12px; align-items: flex-start !important; }
            .hmrc-banner a { width: 100%; text-align: center; }
          }
        `}</style>

        <Sidebar
          active="DASHBOARD"
          userName={userName}
          plan={plan}
          netProfit={netProfit}
          income={income}
          expenses={expenses}
          taxDue={taxDue}
          badge={draftTx > 0 ? { REDITUS: draftTx } : {}}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          <div className="dash-topbar" style={{ background: '#fff', borderBottom: '0.5px solid #E5E7EB', padding: '0 28px', height: 64, alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 15, color: '#0A2E1E' }}>
              {loading ? '' : `${getGreeting()}${userName ? `, ${userName}` : ''}.`}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>{today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <button onClick={() => setShowAddModal(true)} style={{ fontSize: 13, padding: '8px 18px', borderRadius: 9, background: '#01D98D', color: '#0A2E1E', border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                + Add transaction
              </button>
            </div>
          </div>

          <div className="dash-content">

            {!loading && (
              <div style={{ background: '#F0FDF8', border: '1px solid #BBF7E4', borderRadius: 10, padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#01D98D', flexShrink: 0 }} />
                <div style={{ fontSize: 13, color: '#065F46', fontWeight: 500 }}>{nextAction}</div>
              </div>
            )}

            <div className="stat-grid">
              {[
                { label: 'Net profit', value: fmt(netProfit), sub: `${currentTaxYear} tax year`, color: '#0A2E1E' },
                { label: 'Tax to set aside', value: fmt(taxDue), sub: 'Est. January bill', color: '#D97706' },
                { label: 'Transactions', value: totalTx.toString(), sub: draftTx > 0 ? `${draftTx} drafts pending` : 'All confirmed', color: '#0A2E1E' },
                { label: 'Compliance', value: complianceScore.toString(), sub: complianceScore >= 80 ? 'Good standing' : 'Needs attention', color: scoreColor },
              ].map(item => (
                <div key={item.label} style={{ background: '#fff', border: '0.5px solid #E5E7EB', borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', minHeight: 96 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: item.color, marginTop: 'auto', paddingTop: 8, fontFamily: "'Montserrat', sans-serif", lineHeight: 1 }}>{loading ? '—' : item.value}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 5 }}>{item.sub}</div>
                </div>
              ))}
            </div>

            <div className="main-grid">
              <div style={{ background: '#fff', border: '0.5px solid #E5E7EB', borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0A2E1E', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>Quarter status — {currentTaxYear}</div>
                <div className="quarter-grid">
                  {(['Q1','Q2','Q3','Q4'] as const).map(q => {
                    const color = qColour(q);
                    const label = qLabel(q);
                    return (
                      <div key={q} onClick={() => { window.location.href = '/dashboard/quartus'; }} style={{ background: '#F9FAFB', border: `0.5px solid ${label === 'Filed' ? '#BBF7E4' : '#E5E7EB'}`, borderRadius: 9, padding: '10px 10px 8px', cursor: 'pointer', textAlign: 'center' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0A2E1E', marginBottom: 2 }}>{q}</div>
                        <div style={{ fontSize: 10, color, marginBottom: 8 }}>{label}</div>
                        <div style={{ height: 3, background: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${label === 'Filed' ? 100 : quarterReadiness[q] || 0}%`, background: color, borderRadius: 2 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0A2E1E', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Quick add</div>
                <div className="quickadd-grid">
                  {[
                    { name: 'Upload receipt', desc: 'Scan with AI' },
                    { name: 'Voice entry', desc: 'Speak to log' },
                    { name: 'Log mileage', desc: 'GPS tracker' },
                  ].map(item => (
                    <div key={item.name} onClick={() => { window.location.href = '/dashboard/impensum'; }} style={{ background: '#F9FAFB', border: '0.5px solid #E5E7EB', borderRadius: 9, padding: '10px 12px', cursor: 'pointer' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0A2E1E' }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: '#fff', border: '0.5px solid #E5E7EB', borderRadius: 12, padding: '18px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0A2E1E', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16, alignSelf: 'flex-start' }}>Compliance</div>
                <div style={{ width: 84, height: 84, borderRadius: '50%', border: `6px solid ${scoreColor}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 28, color: scoreColor, lineHeight: 1 }}>{loading ? '—' : complianceScore}</div>
                  <div style={{ fontSize: 8, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Score</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0A2E1E', marginBottom: 6 }}>
                  {complianceScore >= 80 ? 'You are doing brilliantly.' : 'Good progress.'}
                </div>
                <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.5 }}>
                  {draftTx > 0 ? `Confirm ${draftTx} draft${draftTx > 1 ? 's' : ''} to improve your score.` : 'Keep recording regularly.'}
                </div>
                <button onClick={() => { window.location.href = '/dashboard/vigil'; }} style={{ marginTop: 16, fontSize: 12, padding: '7px 18px', borderRadius: 8, background: '#F0FDF8', color: '#065F46', border: '1px solid #BBF7E4', cursor: 'pointer', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                  View VIGIL →
                </button>
              </div>
            </div>

            {!connected && !loading && (
              <div className="hmrc-banner" style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0A2E1E', marginBottom: 4 }}>Connect HMRC</div>
                  <div style={{ fontSize: 13, color: '#6B7280' }}>Link your HMRC account to enable MTD submissions and real-time compliance checking.</div>
                </div>
                <a href="/api/auth/hmrc" style={{ padding: '10px 22px', background: '#01D98D', color: '#0A2E1E', borderRadius: 9, fontWeight: 700, fontSize: 13, textDecoration: 'none', flexShrink: 0, marginLeft: 20 }}>
                  Connect now →
                </a>
              </div>
            )}
          </div>
        </div>

        {showAddModal && (
          <AddTransactionModal
            onClose={() => setShowAddModal(false)}
            onSaved={() => load()}
          />
        )}
      </div>
    </ThemeProvider>
  );
}
