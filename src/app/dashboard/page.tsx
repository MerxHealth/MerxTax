'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ThemeProvider } from '@/lib/ThemeContext';
import Sidebar from '@/components/Sidebar';
import Logo from '@/components/Logo';

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
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFB', fontFamily: "'DM Sans', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Montserrat:wght@600;700;800&display=swap'); * { box-sizing: border-box; }`}</style>

        <Sidebar
          active="Dashboard"
          userName={userName}
          plan={plan}
          netProfit={netProfit}
          income={income}
          expenses={expenses}
          taxDue={taxDue}
          badge={draftTx > 0 ? { REDITUS: draftTx } : {}}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ background: '#fff', borderBottom: '0.5px solid #E5E7EB', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <Logo height={40} />
              <div style={{ width: 1, height: 24, background: '#E5E7EB' }} />
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 15, color: '#0A2E1E' }}>
                {loading ? '' : `${getGreeting()}${userName ? `, ${userName}` : ''}.`}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>{today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <button onClick={() => { window.location.href = '/dashboard/impensum'; }} style={{ fontSize: 13, padding: '8px 18px', borderRadius: 9, background: '#01D98D', color: '#0A2E1E', border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                + Add transaction
              </button>
            </div>
          </div>

          <div style={{ flex: 1, padding: '12px 28px 24px', overflowY: 'auto' }}>

            {!loading && (
              <div style={{ background: '#F0FDF8', border: '1px solid #BBF7E4', borderRadius: 10, padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#01D98D', flexShrink: 0 }} />
                <div style={{ fontSize: 13, color: '#065F46', fontWeight: 500 }}>{nextAction}</div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 20 }}>
              <div style={{ background: '#fff', border: '0.5px solid #E5E7EB', borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0A2E1E', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>Quarter status — {currentTaxYear}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 18 }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
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
              <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
      </div>
    </ThemeProvider>
  );
}
