'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ThemeProvider } from '@/lib/ThemeContext';
import Sidebar from '@/components/Sidebar';
import { calcUKSelfEmployedTax, calcUKTaxYear } from '@/lib/taxUtils';

type Quarter = {
  quarter: string; label: string; periodFrom: string; periodTo: string;
  deadline: string; daysLeft: number; income: number; expenses: number; net: number;
  transactionCount: number; confirmedCount: number; submissionStatus: string;
  submissionDate?: string; readiness: number; estimatedTax: number; transactions: any[];
};
type Screen = 'overview' | 'preflight' | 'intelligence' | 'protection' | 'ceremony';

function fmt(n: number): string { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n); }
function daysUntil(dateStr: string): number { return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000); }
function getQuarterMeta(taxYear: string) {
  const y = parseInt(taxYear.split('-')[0]);
  return [
    { quarter: 'Q1', label: 'Q1 Apr-Jun', from: `${y}-04-06`, to: `${y}-07-05`, deadline: `${y}-08-07` },
    { quarter: 'Q2', label: 'Q2 Jul-Sep', from: `${y}-07-06`, to: `${y}-10-05`, deadline: `${y}-11-07` },
    { quarter: 'Q3', label: 'Q3 Oct-Dec', from: `${y}-10-06`, to: `${y + 1}-01-05`, deadline: `${y + 1}-02-07` },
    { quarter: 'Q4', label: 'Q4 Jan-Mar', from: `${y + 1}-01-06`, to: `${y + 1}-04-05`, deadline: `${y + 1}-05-07` },
  ];
}
function getStatusColor(daysLeft: number, submitted: boolean): string {
  if (submitted) return '#01D98D';
  if (daysLeft < 14) return '#EF4444';
  if (daysLeft < 30) return '#F59E0B';
  return '#6B7280';
}
function getStatusLabel(daysLeft: number, submitted: boolean): string {
  if (submitted) return 'Filed';
  if (daysLeft < 0) return 'Overdue';
  if (daysLeft < 14) return 'Urgent';
  if (daysLeft < 30) return 'Due soon';
  return 'Upcoming';
}

export default function QuartusPage() {
  const supabase = createClient();
  const today = new Date();
  const currentTaxYear = calcUKTaxYear(today);

  const [isMobile, setIsMobile] = useState(false);
  const [sidebarNetProfit, setSidebarNetProfit] = useState(0);
  const [sidebarIncome, setSidebarIncome] = useState(0);
  const [sidebarExpenses, setSidebarExpenses] = useState(0);
  const [sidebarTaxDue, setSidebarTaxDue] = useState(0);
  const [sidebarPlan, setSidebarPlan] = useState('SOLO');
  const [sidebarUserName, setSidebarUserName] = useState('');

  const [taxYear, setTaxYear] = useState(currentTaxYear);
  const [screen, setScreen] = useState<Screen>('overview');
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [loading, setLoading] = useState(true);
  const [nino, setNino] = useState('');
  const [userName, setUserName] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter | null>(null);
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditScore, setAuditScore] = useState<number | null>(null);
  const [auditFlags, setAuditFlags] = useState<string[]>([]);
  const [reconSkipped, setReconSkipped] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [ceremonyData, setCeremonyData] = useState<any>(null);
  const [whatIfIncome, setWhatIfIncome] = useState('');

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    const { data: profile } = await supabase.from('profiles').select('full_name, hmrc_nino, plan').eq('id', user.id).single();
    setNino(profile?.hmrc_nino || '');
    setUserName(profile?.full_name || '');
    setSidebarUserName(profile?.full_name || '');
    setSidebarPlan(profile?.plan?.toUpperCase() || 'SOLO');

    const { data: txData } = await supabase.from('transactions').select('*').eq('tax_year', taxYear).order('date', { ascending: true });
    const { data: subData } = await supabase.from('quarterly_submissions').select('*').eq('tax_year', taxYear);
    const meta = getQuarterMeta(taxYear);

    const built: Quarter[] = meta.map(m => {
      const qTx      = (txData || []).filter((t: any) => t.quarter === m.quarter);
      const confirmed = qTx.filter((t: any) => t.status === 'CONFIRMED');
      const income    = confirmed.filter((t: any) => t.type === 'INCOME') .reduce((s: number, t: any) => s + Number(t.amount_gross), 0);
      const expenses  = confirmed.filter((t: any) => t.type === 'EXPENSE').reduce((s: number, t: any) => s + Number(t.amount_gross), 0);
      const net       = income - expenses;
      const sub       = (subData || []).find((s: any) => s.quarter === m.quarter);
      const readiness = qTx.length === 0 ? 0 : Math.round((confirmed.length / qTx.length) * 100);
      // Per-quarter tax aside = Income Tax + Class 4 NI on this quarter's net
      const { totalTax: estimatedTax } = calcUKSelfEmployedTax(net);
      return { quarter: m.quarter, label: m.label, periodFrom: m.from, periodTo: m.to, deadline: m.deadline, daysLeft: daysUntil(m.deadline), income, expenses, net, transactionCount: qTx.length, confirmedCount: confirmed.length, submissionStatus: sub?.status ?? 'not_started', submissionDate: sub?.submitted_at, readiness, estimatedTax, transactions: qTx };
    });
    setQuarters(built);

    // Sidebar — annual figures
    const inc = (txData || []).filter((t: any) => t.type === 'INCOME') .reduce((s: number, t: any) => s + Number(t.amount_gross), 0);
    const exp = (txData || []).filter((t: any) => t.type === 'EXPENSE').reduce((s: number, t: any) => s + Number(t.amount_gross), 0);
    const net = inc - exp;
    setSidebarIncome(inc); setSidebarExpenses(exp); setSidebarNetProfit(net);
    // Income Tax + Class 4 NI (Class 2 abolished April 2024)
    const { totalTax } = calcUKSelfEmployedTax(net);
    setSidebarTaxDue(totalTax);

    setLoading(false);
  }, [taxYear]);

  useEffect(() => { load(); }, [load]);

  // Annual totals
  const totalNet      = quarters.reduce((s, q) => s + q.net, 0);
  const totalIncome   = quarters.reduce((s, q) => s + q.income, 0);
  const totalExpenses = quarters.reduce((s, q) => s + q.expenses, 0);

  // Correct annual tax breakdown (Income Tax + Class 4 NI — Class 2 abolished April 2024)
  const { incomeTax: annualIncomeTax, class4NI: annualClass4NI, totalTax: totalLiability } = calcUKSelfEmployedTax(totalNet);

  const poaApplies = totalLiability > 1000;

  // What-if modeller
  const whatIfNet = totalNet + (parseFloat(whatIfIncome) || 0);
  const { totalTax: whatIfTax } = calcUKSelfEmployedTax(whatIfNet);

  async function runAudit(q: Quarter) {
    setAuditRunning(true); setAuditScore(null); setAuditFlags([]); setSubmitError('');
    await new Promise(r => setTimeout(r, 1200));
    const flags: string[] = []; let score = 100;
    const seen = new Map<string, number>();
    q.transactions.forEach((t: any) => { const k = `${t.amount_gross}-${t.category}-${t.type}`; seen.set(k, (seen.get(k) || 0) + 1); });
    seen.forEach((count, key) => { if (count > 1) { const [amount, cat] = key.split('-'); flags.push(`Possible duplicate: ${cat} transaction of ${fmt(Number(amount))} appears ${count} times`); score -= 10; } });
    const uncat = q.transactions.filter((t: any) => !t.category || t.category === 'OTHER');
    if (uncat.length > 0) { flags.push(`${uncat.length} transaction${uncat.length > 1 ? 's' : ''} with no category`); score -= 5 * uncat.length; }
    const drafts = q.transactionCount - q.confirmedCount;
    if (drafts > 0) { flags.push(`${drafts} unconfirmed draft transaction${drafts > 1 ? 's' : ''} not included`); score -= 8 * drafts; }
    if (q.income === 0) { flags.push('No income recorded — confirm this is correct'); score -= 15; }
    if (q.income > 0 && q.expenses / q.income > 0.8) { flags.push(`Expense ratio is ${Math.round((q.expenses / q.income) * 100)}% — HMRC queries above 80%`); score -= 10; }
    if (!reconSkipped) { flags.push('Bank reconciliation not completed — reconcile or skip to proceed'); score -= 5; }
    setAuditScore(Math.max(0, Math.min(100, score))); setAuditFlags(flags); setAuditRunning(false);
  }

  async function handleSubmit(q: Quarter) {
    setSubmitting(true); setSubmitError('');
    try {
      const res = await fetch('/api/quartus/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taxYear, quarter: q.quarter, periodFrom: q.periodFrom, periodTo: q.periodTo, income: q.income, expenses: q.expenses, nino }) });
      const json = await res.json();
      if (!json.success) { setSubmitError(json.error || 'Submission failed.'); setSubmitting(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('quarterly_submissions').upsert({ user_id: user!.id, tax_year: taxYear, quarter: q.quarter, period_from: q.periodFrom, period_to: q.periodTo, income: q.income, expenses: q.expenses, net: q.net, status: 'submitted', submitted_at: new Date().toISOString(), hmrc_reference: json.reference || null, confidence_score: auditScore }, { onConflict: 'user_id,tax_year,quarter' });
      setCeremonyData({ quarter: q.label, taxYear, income: q.income, expenses: q.expenses, net: q.net, estimatedTax: q.estimatedTax, reference: json.reference || 'SANDBOX-' + Date.now(), submittedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), score: auditScore });
      setScreen('ceremony'); load();
    } catch (err: any) { setSubmitError(err.message || 'Something went wrong.'); }
    setSubmitting(false);
  }

  const navTab = (active: boolean): React.CSSProperties => ({ padding: '5px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', borderRadius: 6, border: 'none', fontFamily: "'DM Sans', sans-serif", background: active ? '#fff' : 'transparent', color: active ? '#0A2E1E' : '#6B7280', boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' });
  const scoreColor = (s: number) => s >= 90 ? '#01D98D' : s >= 70 ? '#F59E0B' : '#EF4444';

  return (
    <ThemeProvider>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#EEF1F4', fontFamily: "'DM Sans', sans-serif", color: '#1C1C1E' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Montserrat:wght@600;700;800&display=swap'); * { box-sizing: border-box; } .q-card:hover { border-color: #01D98D !important; } @media print { .no-print { display: none !important; } }`}</style>

        <Sidebar active="QUARTUS" userName={sidebarUserName} plan={sidebarPlan} netProfit={sidebarNetProfit} income={sidebarIncome} expenses={sidebarExpenses} taxDue={sidebarTaxDue} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          {!isMobile && (
            <div style={{ background: '#fff', borderBottom: '0.5px solid #E5E7EB', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }} className="no-print">
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 15, color: '#0A2E1E' }}>QUARTUS <span style={{ color: '#01D98D' }}>|</span> MTD Submissions</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <select value={taxYear} onChange={e => setTaxYear(e.target.value)} style={{ padding: '5px 10px', fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
                  {['2026-27','2025-26','2024-25'].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 8, padding: 3 }}>
                  <button style={navTab(screen === 'overview')}     onClick={() => setScreen('overview')}>Quarters</button>
                  <button style={navTab(screen === 'intelligence')} onClick={() => setScreen('intelligence')}>Intelligence</button>
                  <button style={navTab(screen === 'protection')}   onClick={() => setScreen('protection')}>Protection</button>
                </div>
              </div>
            </div>
          )}
          {isMobile && (
            <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '10px 16px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 8, padding: 3 }}>
                <button style={navTab(screen === 'overview')}     onClick={() => setScreen('overview')}>Quarters</button>
                <button style={navTab(screen === 'intelligence')} onClick={() => setScreen('intelligence')}>Intel</button>
                <button style={navTab(screen === 'protection')}   onClick={() => setScreen('protection')}>Protection</button>
              </div>
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <main style={{ maxWidth: 960, margin: '0 auto', padding: isMobile ? '16px 14px 80px' : '24px 28px 80px' }}>

              {loading && <div style={{ textAlign: 'center', padding: '80px 24px', color: '#9CA3AF' }}><div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 18, color: '#0A2E1E', marginBottom: 8 }}>Loading your submissions...</div><div>Pulling your quarters from the ledger</div></div>}

              {!loading && screen === 'overview' && (
                <>
                  <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: 28, marginBottom: 20 }}>
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 18, color: '#0A2E1E', marginBottom: 20 }}>{taxYear} at a glance</div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 12 }}>
                      {[['Total income', fmt(totalIncome), '#01D98D'], ['Total expenses', fmt(totalExpenses), '#EF4444'], ['Net profit', fmt(totalNet), '#0A2E1E'], ['Total liability', fmt(totalLiability), '#F59E0B']].map(([lbl, val, col]) => (
                        <div key={lbl as string} style={{ background: '#F9FAFB', borderRadius: 12, padding: '16px 18px' }}>
                          <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>{lbl}</div>
                          {lbl === 'Total liability' && <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 4 }}>Income Tax + Class 4 NI</div>}
                          <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 20, color: col as string }}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: '#F0FDF8', border: '1px solid #BBF7E4', borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#01D98D', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0A2E1E', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>i</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#065F46', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Submission timing advice</div>
                      <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>Submit 5–10 days before the deadline. Avoid the final 48 hours — late-period submissions attract more algorithmic scrutiny from HMRC.</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
                    {quarters.map(q => {
                      const isSubmitted = q.submissionStatus === 'submitted' || q.submissionStatus === 'accepted';
                      const color = getStatusColor(q.daysLeft, isSubmitted);
                      const label = getStatusLabel(q.daysLeft, isSubmitted);
                      return (
                        <div key={q.quarter} className="q-card" style={{ background: '#fff', borderRadius: 14, border: `2px solid ${isSubmitted ? '#BBF7E4' : '#E5E7EB'}`, padding: 22, transition: 'border-color 0.2s' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                            <div><div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 24, color: '#0A2E1E' }}>{q.quarter}</div><div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{q.label}</div></div>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 0.5, background: color === '#01D98D' ? '#E8F8F2' : color === '#F59E0B' ? '#FEF3C7' : color === '#EF4444' ? '#FEF2F2' : '#F3F4F6', color }}>{label}</span>
                          </div>
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>Readiness</span><span style={{ fontSize: 11, fontWeight: 700, color: q.readiness === 100 ? '#01D98D' : '#374151' }}>{isSubmitted ? 100 : q.readiness}%</span></div>
                            <div style={{ background: '#F3F4F6', borderRadius: 6, overflow: 'hidden', height: 6 }}><div style={{ height: '100%', width: `${isSubmitted ? 100 : q.readiness}%`, background: isSubmitted ? '#01D98D' : q.readiness === 100 ? '#01D98D' : '#F59E0B', borderRadius: 6 }} /></div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                            {[
                              { lbl: 'Income',    val: fmt(q.income),       col: '#01D98D', note: null },
                              { lbl: 'Expenses',  val: fmt(q.expenses),     col: '#EF4444', note: null },
                              { lbl: 'Net profit',val: fmt(q.net),          col: q.net >= 0 ? '#0A2E1E' : '#EF4444', note: null },
                              { lbl: 'Tax aside', val: fmt(q.estimatedTax), col: '#374151', note: 'IT + Class 4 NI' },
                            ].map(({ lbl, val, col, note }) => (
                              <div key={lbl}>
                                <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{lbl}</div>
                                {note && <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 1 }}>{note}</div>}
                                <div style={{ fontWeight: 700, fontSize: 14, color: col }}>{val}</div>
                              </div>
                            ))}
                          </div>
                          {isSubmitted ? (
                            <div style={{ background: '#F0FDF8', border: '1px solid #BBF7E4', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#065F46', fontWeight: 500, textAlign: 'center' }}>Submitted {q.submissionDate ? new Date(q.submissionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}</div>
                          ) : (
                            <button onClick={() => { setSelectedQuarter(q); setAuditScore(null); setAuditFlags([]); setReconSkipped(false); setSubmitError(''); setScreen('preflight'); }} disabled={q.transactionCount === 0}
                              style={{ width: '100%', padding: '10px', background: q.transactionCount === 0 ? '#F3F4F6' : '#0A2E1E', color: q.transactionCount === 0 ? '#9CA3AF' : '#01D98D', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: q.transactionCount === 0 ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                              {q.transactionCount === 0 ? 'No transactions yet' : 'Review & Submit'}
                            </button>
                          )}
                          <div style={{ marginTop: 8, fontSize: 11, color: '#9CA3AF', textAlign: 'center' }}>Due: {new Date(q.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {!loading && screen === 'preflight' && selectedQuarter && (
                <>
                  <button onClick={() => setScreen('overview')} style={{ fontSize: 13, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}>← Back to quarters</button>
                  <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: 28, marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                      <div><div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 24, color: '#0A2E1E' }}>{selectedQuarter.quarter} Pre-flight Audit</div><div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{selectedQuarter.label} — {taxYear}</div></div>
                      {auditScore !== null && <div style={{ textAlign: 'center', width: 80, height: 80, borderRadius: '50%', border: `5px solid ${scoreColor(auditScore)}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 24, color: scoreColor(auditScore), lineHeight: 1 }}>{auditScore}</div><div style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>Score</div></div>}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
                      {[['Income', fmt(selectedQuarter.income), '#01D98D'], ['Expenses', fmt(selectedQuarter.expenses), '#EF4444'], ['Net profit', fmt(selectedQuarter.net), '#0A2E1E']].map(([lbl, val, col]) => (
                        <div key={lbl as string} style={{ background: '#F9FAFB', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>{lbl}</div>
                          <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 20, color: col as string }}>{val}</div>
                        </div>
                      ))}
                    </div>
                    {!reconSkipped && auditScore === null && (
                      <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: '14px 18px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <div><div style={{ fontSize: 12, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Bank reconciliation</div><div style={{ fontSize: 13, color: '#374151' }}>Have you reconciled your bank transactions?</div></div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => setReconSkipped(true)} style={{ padding: '8px 16px', background: '#fff', color: '#92400E', border: '1px solid #FCD34D', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Skip</button>
                          <button onClick={() => setReconSkipped(true)} style={{ padding: '8px 16px', background: '#F59E0B', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Yes, reconciled</button>
                        </div>
                      </div>
                    )}
                    {auditScore === null && !auditRunning && <button onClick={() => runAudit(selectedQuarter)} style={{ width: '100%', padding: '14px', background: '#0A2E1E', color: '#01D98D', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>Run Pre-flight Audit</button>}
                    {auditRunning && <div style={{ textAlign: 'center', padding: '24px', color: '#6B7280' }}><div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: '#0A2E1E', marginBottom: 6 }}>Auditing your quarter...</div><div style={{ fontSize: 13 }}>Checking for duplicates, anomalies, and HMRC risk factors</div></div>}
                    {auditScore !== null && (
                      <>
                        <div style={{ background: scoreColor(auditScore) === '#01D98D' ? '#F0FDF8' : scoreColor(auditScore) === '#F59E0B' ? '#FEF3C7' : '#FEF2F2', border: `1px solid ${scoreColor(auditScore) === '#01D98D' ? '#BBF7E4' : scoreColor(auditScore) === '#F59E0B' ? '#FCD34D' : '#FECACA'}`, borderRadius: 10, padding: '14px 18px', marginBottom: 16 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#0A2E1E', marginBottom: 4 }}>{auditScore >= 90 ? 'Excellent — ready to submit.' : auditScore >= 70 ? 'Good — review the flags before submitting.' : 'Attention needed — review all flags.'}</div>
                          <div style={{ fontSize: 13, color: '#6B7280' }}>Confidence score: {auditScore}/100</div>
                        </div>
                        {auditFlags.length > 0 && (
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Flags to review</div>
                            {auditFlags.map((f, i) => <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 14px', background: '#F9FAFB', borderRadius: 8, marginBottom: 6, borderLeft: '3px solid #F59E0B' }}><span style={{ color: '#F59E0B', fontSize: 14, flexShrink: 0 }}>!</span><span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{f}</span></div>)}
                          </div>
                        )}
                        {auditFlags.length === 0 && <div style={{ background: '#F0FDF8', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#065F46', fontWeight: 500 }}>No flags found. Your quarter is clean.</div>}
                        {submitError && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: '#991B1B', marginBottom: 12 }}>{submitError}</div>}
                        <button onClick={() => handleSubmit(selectedQuarter)} disabled={submitting} style={{ width: '100%', padding: '14px', background: submitting ? '#a3f0d4' : '#01D98D', color: '#0A2E1E', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                          {submitting ? 'Submitting to HMRC...' : `Submit ${selectedQuarter.quarter} to HMRC`}
                        </button>
                        <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 8 }}>Currently connected to HMRC sandbox environment</div>
                      </>
                    )}
                  </div>
                </>
              )}

              {screen === 'ceremony' && ceremonyData && (
                <div style={{ maxWidth: 600, margin: '0 auto' }}>
                  <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#F0FDF8', border: '3px solid #01D98D', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 32 }}>✓</div>
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 28, color: '#0A2E1E', marginBottom: 8 }}>Submitted to HMRC</div>
                    <div style={{ fontSize: 15, color: '#6B7280' }}>You are running your business properly. That is what matters.</div>
                  </div>
                  <div style={{ background: '#fff', borderRadius: 16, border: '2px solid #0A2E1E', padding: 36, marginBottom: 20 }}>
                    <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: 16, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div><div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 18, color: '#0A2E1E' }}>QUARTUS</div><div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Clean Bill of Health</div></div>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#01D98D', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0A2E1E', fontWeight: 700, fontSize: 18 }}>✓</div>
                    </div>
                    <div style={{ marginBottom: 20 }}><div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Submitted on behalf of</div><div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 18, color: '#0A2E1E' }}>{userName}</div></div>
                    {[{ label: 'Period', value: `${ceremonyData.quarter} — ${ceremonyData.taxYear}` }, { label: 'Submitted', value: ceremonyData.submittedAt }, { label: 'HMRC Reference', value: ceremonyData.reference }, { label: 'Income', value: fmt(ceremonyData.income) }, { label: 'Expenses', value: fmt(ceremonyData.expenses) }, { label: 'Net profit', value: fmt(ceremonyData.net) }, { label: 'Tax aside (IT + Class 4 NI)', value: fmt(ceremonyData.estimatedTax) }, { label: 'Confidence', value: `${ceremonyData.score}/100` }].map(row => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6', fontSize: 13 }}><span style={{ color: '#6B7280' }}>{row.label}</span><span style={{ fontWeight: 600, color: '#0A2E1E' }}>{row.value}</span></div>
                    ))}
                    <div style={{ marginTop: 20, padding: '14px 16px', background: '#F0FDF8', borderRadius: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#065F46', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Tax reserve recommended (IT + Class 4 NI)</div>
                      <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 22, color: '#0A2E1E' }}>{fmt(ceremonyData.estimatedTax)}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => window.print()} style={{ flex: 1, padding: '12px', background: '#0A2E1E', color: '#01D98D', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Download Certificate</button>
                    <button onClick={() => setScreen('overview')} style={{ flex: 1, padding: '12px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Back to Quarters</button>
                  </div>
                </div>
              )}

              {!loading && screen === 'intelligence' && (
                <>
                  <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: 28, marginBottom: 20 }}>
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 18, color: '#0A2E1E', marginBottom: 4 }}>Live tax liability tracker</div>
                    <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Based on confirmed transactions across all quarters. Income Tax + Class 4 NI (Class 2 NI abolished April 2024).</div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                      {[
                        { label: 'Income Tax',    value: fmt(annualIncomeTax), note: 'After £12,570 personal allowance', highlight: false },
                        { label: 'Class 4 NI',    value: fmt(annualClass4NI),  note: '6% on £12,570–£50,270 / 2% above', highlight: false },
                        { label: 'Total liability', value: fmt(totalLiability), note: 'Income Tax + Class 4 NI', highlight: true },
                      ].map(item => (
                        <div key={item.label} style={{ background: item.highlight ? '#0A2E1E' : '#F9FAFB', borderRadius: 12, padding: '16px 18px' }}>
                          <div style={{ fontSize: 10, color: item.highlight ? '#01D98D' : '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>{item.label}</div>
                          <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 22, color: item.highlight ? '#01D98D' : '#0A2E1E', marginBottom: 2 }}>{item.value}</div>
                          <div style={{ fontSize: 11, color: item.highlight ? '#6B9F8E' : '#9CA3AF' }}>{item.note}</div>
                        </div>
                      ))}
                    </div>
                    {poaApplies && (
                      <div style={{ background: '#E6F1FB', border: '1px solid #B5D4F4', borderRadius: 10, padding: '14px 18px' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#185FA5', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Payments on account apply</div>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 8 }}>
                          {[{ label: '31 Jan — balancing + 1st POA', amount: totalLiability }, { label: '31 July — 2nd POA', amount: totalLiability / 2 }, { label: 'Total cash needed', amount: totalLiability * 1.5 }].map(p => (
                            <div key={p.label} style={{ background: '#fff', borderRadius: 8, padding: '10px 14px' }}><div style={{ fontSize: 10, color: '#6B7280', marginBottom: 4 }}>{p.label}</div><div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: '#0A2E1E' }}>{fmt(p.amount)}</div></div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: 28 }}>
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 18, color: '#0A2E1E', marginBottom: 4 }}>What-if modeller</div>
                    <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>If I earn this much more this year, my tax bill becomes...</div>
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Additional income</label>
                      <input type="number" value={whatIfIncome} onChange={e => setWhatIfIncome(e.target.value)} placeholder="e.g. 5000" style={{ width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid #E5E7EB', borderRadius: 10, outline: 'none', fontFamily: "'DM Sans', sans-serif" }} />
                    </div>
                    {whatIfIncome && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                        {[
                          { label: 'New net profit', value: fmt(whatIfNet),             color: '#0A2E1E', bg: '#F9FAFB' },
                          { label: 'New tax bill (IT + NI)', value: fmt(whatIfTax),     color: '#EF4444', bg: '#F9FAFB' },
                          { label: 'Extra tax',    value: fmt(whatIfTax - totalLiability), color: whatIfNet > 50270 ? '#92400E' : '#065F46', bg: whatIfNet > 50270 ? '#FEF3C7' : '#F0FDF8' },
                        ].map(item => (
                          <div key={item.label} style={{ background: item.bg, borderRadius: 10, padding: '14px 16px' }}>
                            <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>{item.label}</div>
                            <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 18, color: item.color }}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {!loading && screen === 'protection' && (
                <>
                  <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: 28, marginBottom: 20 }}>
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 18, color: '#0A2E1E', marginBottom: 4 }}>HMRC enquiry risk score</div>
                    <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Based on patterns HMRC targets in compliance checks.</div>
                    {(() => {
                      let risk = 0;
                      const factors: { factor: string; detail: string; points: number }[] = [];
                      const expenseRatio = totalIncome > 0 ? totalExpenses / totalIncome : 0;
                      if (expenseRatio > 0.8) { risk += 20; factors.push({ factor: 'High expense ratio', detail: `${Math.round(expenseRatio * 100)}% of income — above 80% threshold`, points: 20 }); }
                      if (totalNet > 50270) { risk += 10; factors.push({ factor: 'Higher rate taxpayer', detail: 'Profits above £50,270 attract more scrutiny', points: 10 }); }
                      const uncat = quarters.flatMap(q => q.transactions).filter((t: any) => !t.category || t.category === 'OTHER').length;
                      if (uncat > 0) { risk += 15; factors.push({ factor: 'Uncategorised transactions', detail: `${uncat} transaction${uncat > 1 ? 's' : ''} with no category`, points: 15 }); }
                      if (risk === 0) factors.push({ factor: 'No risk factors detected', detail: 'Your accounts look clean', points: 0 });
                      const riskColor = risk === 0 ? '#01D98D' : risk < 30 ? '#F59E0B' : '#EF4444';
                      const riskLabel = risk === 0 ? 'Low risk' : risk < 30 ? 'Moderate' : 'Elevated';
                      return (
                        <>
                          <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
                            <div style={{ width: 90, height: 90, borderRadius: '50%', border: `6px solid ${riskColor}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 28, color: riskColor, lineHeight: 1 }}>{risk}</div>
                              <div style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>Risk</div>
                            </div>
                            <div><div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 18, color: '#0A2E1E', marginBottom: 4 }}>{riskLabel}</div><div style={{ fontSize: 13, color: '#6B7280' }}>{risk === 0 ? 'Your accounts present a low enquiry risk.' : 'Review the factors below to reduce your risk profile.'}</div></div>
                          </div>
                          {factors.map((f, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 16px', background: f.points === 0 ? '#F0FDF8' : '#F9FAFB', borderRadius: 10, marginBottom: 8, borderLeft: `3px solid ${f.points === 0 ? '#01D98D' : '#F59E0B'}` }}>
                              <div><div style={{ fontWeight: 600, fontSize: 13, color: '#0A2E1E', marginBottom: 2 }}>{f.factor}</div><div style={{ fontSize: 12, color: '#6B7280' }}>{f.detail}</div></div>
                              {f.points > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', flexShrink: 0, marginLeft: 12 }}>+{f.points}</span>}
                            </div>
                          ))}
                        </>
                      );
                    })()}
                  </div>
                  <div style={{ background: '#F0FDF8', border: '1px solid #BBF7E4', borderRadius: 12, padding: '14px 18px', fontSize: 13, color: '#374151', lineHeight: 1.6 }}>All transactions are stored with creation timestamps, user ID, and source. QUARTUS submission records include the confidence score and audit flags. This satisfies HMRC digital record-keeping requirements under MTD.</div>
                </>
              )}
            </main>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
