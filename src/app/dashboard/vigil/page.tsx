'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

type QuarterStatus = {
  quarter: string;
  label: string;
  periodFrom: string;
  periodTo: string;
  deadline: string;
  daysLeft: number;
  transactionCount: number;
  confirmedCount: number;
  income: number;
  expenses: number;
  net: number;
  submissionStatus: string;
  readiness: number;
  estimatedTax: number;
};

type Screen = 'command' | 'penalties' | 'readiness' | 'payments';

function getTaxYear(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const after = m > 4 || (m === 4 && d >= 6);
  return after ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`;
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function getQuarterMeta(taxYear: string) {
  const y = parseInt(taxYear.split('-')[0]);
  return [
    { quarter: 'Q1', label: 'Q1 Apr-Jun', from: `${y}-04-06`, to: `${y}-07-05`, deadline: `${y}-08-07` },
    { quarter: 'Q2', label: 'Q2 Jul-Sep', from: `${y}-07-06`, to: `${y}-10-05`, deadline: `${y}-11-07` },
    { quarter: 'Q3', label: 'Q3 Oct-Dec', from: `${y}-10-06`, to: `${y + 1}-01-05`, deadline: `${y + 1}-02-07` },
    { quarter: 'Q4', label: 'Q4 Jan-Mar', from: `${y + 1}-01-06`, to: `${y + 1}-04-05`, deadline: `${y + 1}-05-07` },
  ];
}

function getStatusColor(daysLeft: number): string {
  if (daysLeft < 0) return '#EF4444';
  if (daysLeft < 14) return '#EF4444';
  if (daysLeft < 30) return '#F59E0B';
  return '#01D98D';
}

function getStatusLabel(daysLeft: number, submitted: boolean): string {
  if (submitted) return 'Filed';
  if (daysLeft < 0) return 'Overdue';
  if (daysLeft < 14) return 'Urgent';
  if (daysLeft < 30) return 'Coming up';
  return 'On track';
}

function getEncouragement(score: number): string {
  if (score === 100) return 'Your accounts are in better shape than most businesses twice your size.';
  if (score >= 80) return 'You are doing brilliantly. Just a few things to tidy up.';
  if (score >= 60) return 'Good progress. You are ahead of most people at this stage.';
  if (score >= 40) return 'You have made a start. Every transaction you confirm brings you closer.';
  if (score >= 20) return 'You have taken the first step. That already puts you ahead of doing nothing.';
  return 'Connect HMRC and add your first transactions to get started. You can do this.';
}

function getNextAction(quarters: QuarterStatus[], connected: boolean): string {
  if (!connected) return 'Connect your HMRC account to unlock your full compliance picture.';
  const urgent = quarters.find(q => q.daysLeft >= 0 && q.daysLeft < 30 && q.submissionStatus !== 'submitted');
  if (urgent) {
    const drafts = urgent.transactionCount - urgent.confirmedCount;
    if (drafts > 0) return `You have ${drafts} draft transactions to confirm before ${urgent.label} closes in ${urgent.daysLeft} days.`;
    if (urgent.readiness === 100) return `${urgent.label} is ready to submit. You are all set.`;
    return `Review your ${urgent.label} transactions before the deadline in ${urgent.daysLeft} days.`;
  }
  const incomplete = quarters.find(q => q.daysLeft >= 0 && q.confirmedCount < q.transactionCount);
  if (incomplete) return `Confirm your draft transactions in ${incomplete.label} to keep your records clean.`;
  return 'Everything looks good. Keep recording your income and expenses regularly.';
}

export default function VigilPage() {
  const supabase = createClient();
  const today = new Date();
  const currentTaxYear = getTaxYear(today);

  const [taxYear, setTaxYear] = useState(currentTaxYear);
  const [screen, setScreen] = useState<Screen>('command');
  const [quarters, setQuarters] = useState<QuarterStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [penaltyPoints, setPenaltyPoints] = useState(0);
  const [complianceScore, setComplianceScore] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);

    const connRes = await fetch('/api/vrn');
    const connData = await connRes.json();
    setConnected(!!connData.connected);

    const { data: txData } = await supabase
      .from('transactions')
      .select('quarter, type, amount_gross, status')
      .eq('tax_year', taxYear);

    const { data: subData } = await supabase
      .from('quarterly_submissions')
      .select('quarter, status')
      .eq('tax_year', taxYear);

    const meta = getQuarterMeta(taxYear);

    const built: QuarterStatus[] = meta.map(m => {
      const qTx = (txData || []).filter((t: any) => t.quarter === m.quarter);
      const confirmed = qTx.filter((t: any) => t.status === 'CONFIRMED');
      const income = confirmed.filter((t: any) => t.type === 'INCOME').reduce((s: number, t: any) => s + Number(t.amount_gross), 0);
      const expenses = confirmed.filter((t: any) => t.type === 'EXPENSE').reduce((s: number, t: any) => s + Number(t.amount_gross), 0);
      const net = income - expenses;
      const sub = (subData || []).find((s: any) => s.quarter === m.quarter);
      const readiness = qTx.length === 0 ? 0 : Math.round((confirmed.length / qTx.length) * 100);
      const estimatedTax = Math.max(0, net * 0.2);
      const days = daysUntil(m.deadline);

      return {
        quarter: m.quarter,
        label: m.label,
        periodFrom: m.from,
        periodTo: m.to,
        deadline: m.deadline,
        daysLeft: days,
        transactionCount: qTx.length,
        confirmedCount: confirmed.length,
        income,
        expenses,
        net,
        submissionStatus: sub?.status ?? 'not_started',
        readiness,
        estimatedTax,
      };
    });

    setQuarters(built);

    // Compliance score
    let score = 0;
    if (connData.connected) score += 25;
    if (connData.vrn) score += 15;
    const hasTransactions = (txData || []).length > 0;
    if (hasTransactions) score += 20;
    const allConfirmed = (txData || []).every((t: any) => t.status === 'CONFIRMED');
    if (allConfirmed && hasTransactions) score += 20;
    const currentQ = built.find(q => {
      const from = new Date(q.periodFrom);
      const to = new Date(q.periodTo);
      return today >= from && today <= to;
    });
    if (currentQ && currentQ.transactionCount > 0) score += 20;
    setComplianceScore(Math.min(100, score));

    // Penalty points - count missed deadlines from submission history
    const missedDeadlines = built.filter(q => q.daysLeft < 0 && q.submissionStatus !== 'submitted' && q.submissionStatus !== 'accepted').length;
    setPenaltyPoints(missedDeadlines);

    setLoading(false);
  }, [taxYear]);

  useEffect(() => { load(); }, [load]);

  const nextAction = getNextAction(quarters, connected);
  const penaltyExposure = penaltyPoints >= 4 ? 200 + (penaltyPoints - 4) * 200 : 0;

  const navTab = (active: boolean): React.CSSProperties => ({
    padding: '5px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
    borderRadius: 6, border: 'none', fontFamily: "'DM Sans', sans-serif",
    background: active ? '#fff' : 'transparent',
    color: active ? '#0A2E1E' : '#6B7280',
    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
  });

  const scoreColor = complianceScore >= 80 ? '#01D98D' : complianceScore >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: "'DM Sans', sans-serif", color: '#1C1C1E' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Montserrat:wght@600;700;800&display=swap');
        * { box-sizing: border-box; }
        .q-card:hover { border-color: #01D98D !important; }
      `}</style>

      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => { window.location.href = '/dashboard'; }}
            style={{ fontSize: 13, color: '#6B7280', cursor: 'pointer', background: 'none', border: 'none', fontFamily: "'DM Sans', sans-serif" }}>
            Back to Dashboard
          </button>
          <div style={{ width: 1, height: 20, background: '#E5E7EB' }} />
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 15, color: '#0A2E1E' }}>
            VIGIL <span style={{ color: '#01D98D' }}>|</span> Deadlines &amp; Penalties
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <select value={taxYear} onChange={e => setTaxYear(e.target.value)}
            style={{ padding: '5px 10px', fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
            {['2026-27','2025-26','2024-25'].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 8, padding: 3 }}>
            <button style={navTab(screen === 'command')}   onClick={() => setScreen('command')}>Overview</button>
            <button style={navTab(screen === 'penalties')} onClick={() => setScreen('penalties')}>Penalties</button>
            <button style={navTab(screen === 'readiness')} onClick={() => setScreen('readiness')}>Readiness</button>
            <button style={navTab(screen === 'payments')}  onClick={() => setScreen('payments')}>Payments</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px 60px' }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: '#9CA3AF' }}>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 18, color: '#0A2E1E', marginBottom: 8 }}>Checking your accounts...</div>
            <div>This only takes a moment</div>
          </div>
        )}

        {!loading && screen === 'command' && (
          <>
            {/* Compliance Score Hero */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: '32px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 32 }}>
              <div style={{ flexShrink: 0, width: 100, height: 100, borderRadius: '50%', border: `6px solid ${scoreColor}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 28, color: scoreColor, lineHeight: 1 }}>{complianceScore}</div>
                <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Score</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 20, color: '#0A2E1E', marginBottom: 6 }}>
                  {complianceScore === 100 ? 'Perfect. You are fully on top of your accounts.' : 'Your compliance picture'}
                </div>
                <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, marginBottom: 12 }}>
                  {getEncouragement(complianceScore)}
                </div>
                <div style={{ background: '#F3F4F6', borderRadius: 8, overflow: 'hidden', height: 8 }}>
                  <div style={{ height: '100%', width: `${complianceScore}%`, background: scoreColor, borderRadius: 8, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            </div>

            {/* Next action banner */}
            <div style={{ background: '#F0FDF8', border: '1px solid #BBF7E4', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#01D98D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>></div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#065F46', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Your next step</div>
                <div style={{ fontSize: 14, color: '#0A2E1E', fontWeight: 500 }}>{nextAction}</div>
              </div>
            </div>

            {/* Quarter cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {quarters.map(q => {
                const color = getStatusColor(q.daysLeft);
                const label = getStatusLabel(q.daysLeft, q.submissionStatus === 'submitted' || q.submissionStatus === 'accepted');
                const isSubmitted = q.submissionStatus === 'submitted' || q.submissionStatus === 'accepted';
                return (
                  <div key={q.quarter} className="q-card" style={{ background: '#fff', borderRadius: 14, border: '2px solid #E5E7EB', padding: 20, transition: 'border-color 0.2s', cursor: 'pointer' }}
                    onClick={() => setScreen('readiness')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 22, color: '#0A2E1E' }}>{q.quarter}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{q.label}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 0.5, background: color === '#01D98D' ? '#E8F8F2' : color === '#F59E0B' ? '#FEF3C7' : '#FEF2F2', color }}>
                        {label}
                      </span>
                    </div>

                    {/* Readiness bar */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>Readiness</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: q.readiness === 100 ? '#01D98D' : '#374151' }}>{q.readiness}%</span>
                      </div>
                      <div style={{ background: '#F3F4F6', borderRadius: 6, overflow: 'hidden', height: 6 }}>
                        <div style={{ height: '100%', width: `${q.readiness}%`, background: q.readiness === 100 ? '#01D98D' : '#F59E0B', borderRadius: 6 }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>Net</div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: q.net >= 0 ? '#0A2E1E' : '#EF4444' }}>{fmt(q.net)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                          {isSubmitted ? 'Status' : q.daysLeft < 0 ? 'Overdue by' : 'Deadline in'}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 14, color }}>
                          {isSubmitted ? 'Filed' : q.daysLeft < 0 ? `${Math.abs(q.daysLeft)} days` : `${q.daysLeft} days`}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>Transactions</div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#374151' }}>{q.confirmedCount} confirmed / {q.transactionCount} total</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>Tax to set aside</div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#0A2E1E' }}>{fmt(q.estimatedTax)}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 10, fontSize: 11, color: '#9CA3AF' }}>Due: {new Date(q.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  </div>
                );
              })}
            </div>

            {/* Penalty alert - only if points > 0 */}
            {penaltyPoints > 0 && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Penalty points: {penaltyPoints}</div>
                  <div style={{ fontSize: 13, color: '#374151' }}>
                    {penaltyPoints >= 4
                      ? `You have reached the penalty threshold. Current exposure: ${fmt(penaltyExposure)}`
                      : `You need ${4 - penaltyPoints} more missed deadline${4 - penaltyPoints === 1 ? '' : 's'} before a financial penalty applies.`}
                  </div>
                </div>
                <button onClick={() => setScreen('penalties')}
                  style={{ padding: '8px 16px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>
                  View Details
                </button>
              </div>
            )}

            {penaltyPoints === 0 && (
              <div style={{ background: '#F0FDF8', border: '1px solid #BBF7E4', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#01D98D', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>0</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#065F46', textTransform: 'uppercase', letterSpacing: 0.5 }}>No penalty points</div>
                  <div style={{ fontSize: 13, color: '#374151' }}>You are fully compliant. Keep filing on time and this stays at zero.</div>
                </div>
              </div>
            )}
          </>
        )}

        {!loading && screen === 'penalties' && (
          <>
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: 28, marginBottom: 20 }}>
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 18, color: '#0A2E1E', marginBottom: 4 }}>How HMRC penalties work</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 24, lineHeight: 1.6 }}>Since April 2023, HMRC uses a points-based system. Think of it like penalty points on a driving licence - you only face a fine when you collect enough points. Filing on time keeps your score at zero.</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
                {[
                  { step: '1', title: 'Miss a deadline', desc: 'You get 1 penalty point. No fine yet.', color: '#F59E0B' },
                  { step: '2', title: 'Reach 4 points', desc: 'A 200 pound fine is issued automatically.', color: '#EF4444' },
                  { step: '3', title: 'Each miss after', desc: 'Another 200 pounds per missed deadline.', color: '#EF4444' },
                ].map(item => (
                  <div key={item.step} style={{ background: '#F9FAFB', borderRadius: 12, padding: 16, borderLeft: `4px solid ${item.color}` }}>
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 28, color: item.color, marginBottom: 4 }}>{item.step}</div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#0A2E1E', marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: '#F0FDF8', borderRadius: 10, padding: '14px 18px', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#065F46', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>The good news</div>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>Points expire after 24 months of on-time filing. Stay on top of your quarterly submissions and your score resets automatically. VIGIL keeps track of this for you.</div>
              </div>

              <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '14px 18px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Late payment penalties (separate from points)</div>
                {[
                  ['After 15 days', '2% of unpaid tax'],
                  ['After 30 days', '4% of unpaid tax'],
                  ['After 31 days', '4% per year interest on remaining balance'],
                ].map(([when, what]) => (
                  <div key={when} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #E5E7EB', fontSize: 13 }}>
                    <span style={{ color: '#6B7280' }}>{when}</span>
                    <span style={{ fontWeight: 600, color: '#374151' }}>{what}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* User's current position */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: 28 }}>
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 18, color: '#0A2E1E', marginBottom: 16 }}>Your current position</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div style={{ background: penaltyPoints === 0 ? '#F0FDF8' : '#FEF2F2', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 40, color: penaltyPoints === 0 ? '#01D98D' : '#EF4444' }}>{penaltyPoints}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Penalty points</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{4 - penaltyPoints > 0 ? `${4 - penaltyPoints} more until a fine` : 'Fine threshold reached'}</div>
                </div>
                <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 40, color: penaltyExposure > 0 ? '#EF4444' : '#01D98D' }}>{fmt(penaltyExposure)}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Current exposure</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Fines issued so far</div>
                </div>
                <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 40, color: '#0A2E1E' }}>4</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Points threshold</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>HMRC quarterly filers</div>
                </div>
              </div>
            </div>
          </>
        )}

        {!loading && screen === 'readiness' && (
          <>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 20, color: '#0A2E1E', marginBottom: 20 }}>Quarter Readiness - {taxYear}</div>
            {quarters.map(q => {
              const color = getStatusColor(q.daysLeft);
              const checks = [
                { label: 'Transactions recorded', done: q.transactionCount > 0 },
                { label: 'All transactions confirmed', done: q.confirmedCount === q.transactionCount && q.transactionCount > 0 },
                { label: 'HMRC account connected', done: connected },
                { label: 'Income recorded', done: q.income > 0 },
              ];
              const doneCount = checks.filter(c => c.done).length;
              return (
                <div key={q.quarter} style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', padding: 24, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 22, color: '#0A2E1E' }}>{q.quarter} <span style={{ fontSize: 14, fontWeight: 600, color: '#6B7280' }}>{q.label}</span></div>
                      <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Due {new Date(q.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 28, color }}>
                        {q.submissionStatus === 'submitted' || q.submissionStatus === 'accepted' ? '100%' : `${q.readiness}%`}
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>ready</div>
                    </div>
                  </div>

                  <div style={{ background: '#F3F4F6', borderRadius: 8, overflow: 'hidden', height: 8, marginBottom: 16 }}>
                    <div style={{ height: '100%', width: `${q.submissionStatus === 'submitted' || q.submissionStatus === 'accepted' ? 100 : q.readiness}%`, background: color, borderRadius: 8 }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                    {checks.map(c => (
                      <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: c.done ? '#01D98D' : '#F3F4F6', color: c.done ? '#fff' : '#9CA3AF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                          {c.done ? 'Y' : 'N'}
                        </span>
                        <span style={{ color: c.done ? '#374151' : '#9CA3AF' }}>{c.label}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>Income</div>
                      <div style={{ fontWeight: 700, color: '#01D98D', fontSize: 15 }}>{fmt(q.income)}</div>
                    </div>
                    <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>Expenses</div>
                      <div style={{ fontWeight: 700, color: '#EF4444', fontSize: 15 }}>{fmt(q.expenses)}</div>
                    </div>
                    <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>Tax to set aside</div>
                      <div style={{ fontWeight: 700, color: '#0A2E1E', fontSize: 15 }}>{fmt(q.estimatedTax)}</div>
                    </div>
                  </div>

                  {doneCount === checks.length && q.submissionStatus !== 'submitted' && (
                    <div style={{ marginTop: 12, background: '#F0FDF8', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#065F46', fontWeight: 500 }}>
                      This quarter is ready. You are all set to submit when QUARTUS launches.
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {!loading && screen === 'payments' && (
          <>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 20, color: '#0A2E1E', marginBottom: 8 }}>Payment Calendar</div>
            <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>Estimated payment dates based on your current income and expenses. These are projections - your actual liability is confirmed at Final Declaration.</div>

            {(() => {
              const y = parseInt(taxYear.split('-')[0]);
              const totalNet = quarters.reduce((s, q) => s + q.net, 0);
              const totalTax = Math.max(0, (totalNet - 12570) * 0.2);
              const poa = totalTax > 1000;
              const payments = [
                { label: 'Balancing Payment', date: `${y + 1}-01-31`, amount: poa ? totalTax / 2 : totalTax, note: 'Final settlement for the tax year', color: '#0A2E1E' },
                ...(poa ? [
                  { label: 'First Payment on Account', date: `${y + 1}-01-31`, amount: totalTax / 2, note: 'Advance payment towards next year', color: '#374151' },
                  { label: 'Second Payment on Account', date: `${y + 1}-07-31`, amount: totalTax / 2, note: 'Second advance payment', color: '#374151' },
                ] : []),
              ];
              return (
                <>
                  <div style={{ background: '#F0FDF8', border: '1px solid #BBF7E4', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#065F46', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Estimated annual tax liability</div>
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 28, color: '#0A2E1E' }}>{fmt(totalTax)}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Based on {fmt(totalNet)} net profit after 12,570 personal allowance at 20% basic rate</div>
                    {poa && <div style={{ fontSize: 12, color: '#065F46', marginTop: 8, fontWeight: 500 }}>Your liability is over 1,000 so payments on account apply. HMRC splits your bill across two advance payments.</div>}
                  </div>

                  {payments.map((p, i) => {
                    const days = daysUntil(p.date);
                    const color = days < 0 ? '#EF4444' : days < 30 ? '#F59E0B' : '#01D98D';
                    return (
                      <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '20px 24px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: '#0A2E1E', marginBottom: 2 }}>{p.label}</div>
                          <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>{p.note}</div>
                          <div style={{ fontSize: 12, color: '#6B7280' }}>Due: {new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 22, color: '#0A2E1E' }}>{fmt(p.amount)}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color, marginTop: 2 }}>
                            {days < 0 ? `${Math.abs(days)} days ago` : `in ${days} days`}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '16px 20px', fontSize: 12, color: '#9CA3AF', lineHeight: 1.6 }}>
                    These figures are estimates for planning purposes only. Your actual tax liability is calculated at Final Declaration. Always consult HMRC or a qualified advisor for your final tax position.
                  </div>
                </>
              );
            })()}
          </>
        )}
      </main>
    </div>
  );
}
