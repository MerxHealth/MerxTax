'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ThemeProvider } from '@/lib/ThemeContext';
import Sidebar from '@/components/Sidebar';

type Transaction = {
  id: string; user_id: string; date: string; type: 'INCOME' | 'EXPENSE';
  amount_gross: number; amount_net: number | null; vat_amount: number | null;
  vat_rate: string; description: string; category: string;
  income_source: 'TRADING' | 'PROPERTY' | 'OTHER' | null;
  accounting_method: string; tax_year: string; quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  receipt_url: string | null; status: 'DRAFT' | 'CONFIRMED'; notes: string | null; created_at: string;
};

type Screen = 'ledger' | 'quarters' | 'pl';
type FilterType = 'ALL' | 'INCOME' | 'EXPENSE';

const HMRC_CATEGORIES = [
  { value: 'TRADING_INCOME',    label: 'Trading income',                    tooltip: 'Revenue from self-employed work or your business' },
  { value: 'PROPERTY_INCOME',   label: 'Property / rental income',          tooltip: 'Rental income from land or buildings you own' },
  { value: 'OTHER_INCOME',      label: 'Other income',                      tooltip: 'Dividends, interest, or other income - for Final Declaration' },
  { value: 'GOODS_MATERIALS',   label: 'Cost of goods / materials',         tooltip: 'Stock, raw materials, or goods purchased to resell' },
  { value: 'TRAVEL',            label: 'Car, van and travel',               tooltip: 'Business mileage (45p/mile first 10,000), fuel, parking, public transport' },
  { value: 'WAGES',             label: 'Wages and salaries',                tooltip: 'Payments to employees and PAYE costs' },
  { value: 'RENT_RATES',        label: 'Rent and rates',                    tooltip: 'Business premises rent, business rates, water rates' },
  { value: 'REPAIRS',           label: 'Repairs and maintenance',           tooltip: 'Keeping existing business property or equipment in working order' },
  { value: 'ADMIN',             label: 'General admin',                     tooltip: 'Postage, stationery, printing, phone, internet' },
  { value: 'MARKETING',         label: 'Advertising and marketing',         tooltip: 'Website, ads, flyers, social media promotion' },
  { value: 'PROFESSIONAL_FEES', label: 'Professional fees',                 tooltip: 'Accountant, solicitor, consultant fees for business purposes' },
  { value: 'FINANCIAL_CHARGES', label: 'Financial charges',                 tooltip: 'Bank charges, loan interest only - not capital repayments' },
  { value: 'DEPRECIATION',      label: 'Depreciation / capital allowances', tooltip: 'Tax relief on equipment, vehicles, or assets bought for business' },
  { value: 'OTHER_EXPENSE',     label: 'Other expense',                     tooltip: 'Any allowable expense not covered above - must add description' },
];

const VAT_RATES = [
  { value: 'NOT_REGISTERED', label: 'Not VAT Registered', tooltip: 'You are not registered for VAT - no VAT to record' },
  { value: 'EXEMPT',         label: 'Exempt',              tooltip: 'Outside the VAT system - you cannot reclaim VAT on related costs' },
  { value: 'ZERO',           label: '0% Zero Rated',       tooltip: 'Taxable at 0% but still in the VAT system - you CAN reclaim input VAT' },
  { value: 'REDUCED',        label: '5% Reduced Rate',     tooltip: 'Domestic energy, childrens car seats, and some other goods' },
  { value: 'STANDARD',       label: '20% Standard Rate',   tooltip: 'Most goods and services in the UK' },
];

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

function fmt(n: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);
}

function todayISO(): string { return new Date().toISOString().split('T')[0]; }
function getCatLabel(value: string): string { return HMRC_CATEGORIES.find(c => c.value === value)?.label ?? value; }

function getDeadline(q: string, taxYear: string): string {
  const y = parseInt(taxYear.split('-')[0]);
  const map: Record<string, string> = { Q1: `7 Aug ${y}`, Q2: `7 Nov ${y}`, Q3: `7 Feb ${y + 1}`, Q4: `7 May ${y + 1}` };
  return map[q] ?? '';
}

function daysLeft(q: string, taxYear: string): number {
  return Math.ceil((new Date(getDeadline(q, taxYear)).getTime() - Date.now()) / 86400000);
}

function Tooltip({ text }: { text: string }) {
  const [v, setV] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-block', marginLeft: 4 }}>
      <span onMouseEnter={() => setV(true)} onMouseLeave={() => setV(false)}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 15, height: 15, borderRadius: '50%', background: '#E8F8F2', color: '#01D98D', fontSize: 9, fontWeight: 700, cursor: 'help', border: '1px solid #01D98D' }}>i</span>
      {v && (
        <span style={{ position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)', background: '#0A2E1E', color: '#fff', padding: '6px 10px', borderRadius: 6, fontSize: 11, whiteSpace: 'normal', zIndex: 1000, width: 200, lineHeight: 1.4, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          {text}
        </span>
      )}
    </span>
  );
}

export default function ReditusPage() {
  const supabase = createClient();
  const today = new Date();
  const currentTaxYear = getTaxYear(today);
  const currentQuarter = getHMRCQuarter(today);

  const [isMobile, setIsMobile] = useState(false);
  const [userName, setUserName] = useState('');
  const [plan, setPlan] = useState('SOLO');
  const [sidebarNetProfit, setSidebarNetProfit] = useState(0);
  const [sidebarIncome, setSidebarIncome] = useState(0);
  const [sidebarExpenses, setSidebarExpenses] = useState(0);
  const [sidebarTaxDue, setSidebarTaxDue] = useState(0);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<Screen>('ledger');
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [filterQuarter, setFilterQuarter] = useState<string>(currentQuarter);
  const [filterTaxYear, setFilterTaxYear] = useState<string>(currentTaxYear);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showVAT, setShowVAT] = useState(false);
  const [draftBadge, setDraftBadge] = useState(0);

  const emptyForm = {
    amount_gross: '', type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    date: todayISO(), category: '', description: '',
    income_source: 'TRADING' as 'TRADING' | 'PROPERTY' | 'OTHER',
    vat_rate: 'NOT_REGISTERED', notes: '', status: 'DRAFT' as 'DRAFT' | 'CONFIRMED',
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('full_name, plan').eq('id', user.id).single();
      setUserName(profile?.full_name || '');
      setPlan(profile?.plan?.toUpperCase() || 'SOLO');
    }
    loadUser();
  }, []);

  const fetchTx = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('transactions').select('*').eq('tax_year', filterTaxYear).order('date', { ascending: false });
    if (!error && data) {
      setTransactions(data as Transaction[]);
      const confirmed = (data as Transaction[]).filter(t => t.status === 'CONFIRMED');
      const drafts = (data as Transaction[]).filter(t => t.status !== 'CONFIRMED');
      const inc = confirmed.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount_gross), 0);
      const exp = confirmed.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount_gross), 0);
      const net = inc - exp;
      const tax = Math.max(0, (Math.min(net, 50270) - 12570) * 0.2 + Math.max(0, net - 50270) * 0.4);
      setSidebarIncome(inc);
      setSidebarExpenses(exp);
      setSidebarNetProfit(net);
      setSidebarTaxDue(tax);
      setDraftBadge(drafts.length);
    }
    setLoading(false);
  }, [filterTaxYear]);

  useEffect(() => { fetchTx(); }, [fetchTx]);

  const filtered = transactions.filter(t => {
    if (filterType !== 'ALL' && t.type !== filterType) return false;
    if (filterQuarter !== 'ALL' && t.quarter !== filterQuarter) return false;
    return true;
  });

  const totalIncome  = filtered.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount_gross), 0);
  const totalExpense = filtered.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount_gross), 0);
  const netProfit    = totalIncome - totalExpense;

  const quarterData = ['Q1','Q2','Q3','Q4'].map(q => {
    const qTx = transactions.filter(t => t.quarter === q);
    const inc = qTx.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount_gross), 0);
    const exp = qTx.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount_gross), 0);
    const status = qTx.length === 0 ? 'Not Started' : qTx.some(t => t.status === 'CONFIRMED') ? 'In Progress' : 'Draft';
    return { quarter: q, income: inc, expense: exp, net: inc - exp, status, days: daysLeft(q, filterTaxYear) };
  });

  const annualIncome  = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount_gross), 0);
  const annualExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount_gross), 0);
  const annualNet     = annualIncome - annualExpense;
  const estTax        = Math.max(0, (annualNet - 12570) * 0.2);

  const categoryPL = HMRC_CATEGORIES.map(cat => {
    const catTx = transactions.filter(t => t.category === cat.value);
    const total = catTx.reduce((s, t) => s + (t.type === 'INCOME' ? Number(t.amount_gross) : -Number(t.amount_gross)), 0);
    return { ...cat, total, count: catTx.length };
  }).filter(c => c.count > 0);

  async function handleSave() {
    setSaveError('');
    if (!form.amount_gross || !form.category || !form.description) { setSaveError('Amount, category and description are required.'); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaveError('Not authenticated.'); setSaving(false); return; }
    const dateObj = new Date(form.date);
    const gross = parseFloat(form.amount_gross);
    let net = gross; let vat = 0;
    if (form.vat_rate === 'STANDARD') { net = gross / 1.2; vat = gross - net; }
    else if (form.vat_rate === 'REDUCED') { net = gross / 1.05; vat = gross - net; }
    const row = {
      user_id: user.id, date: form.date, type: form.type,
      amount_gross: gross, amount_net: parseFloat(net.toFixed(2)),
      vat_amount: parseFloat(vat.toFixed(2)), vat_rate: form.vat_rate,
      description: form.description, category: form.category,
      income_source: form.type === 'INCOME' ? form.income_source : null,
      accounting_method: 'CASH', tax_year: getTaxYear(dateObj),
      quarter: getHMRCQuarter(dateObj), status: form.status, notes: form.notes || null,
    };
    const { error } = editingId
      ? await supabase.from('transactions').update(row).eq('id', editingId)
      : await supabase.from('transactions').insert(row);
    setSaving(false);
    if (error) { setSaveError(error.message); return; }
    setShowModal(false); setForm(emptyForm); setEditingId(null); fetchTx();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this transaction?')) return;
    await supabase.from('transactions').delete().eq('id', id);
    fetchTx();
  }

  function openEdit(t: Transaction) {
    setForm({ amount_gross: String(t.amount_gross), type: t.type, date: t.date, category: t.category, description: t.description, income_source: t.income_source ?? 'TRADING', vat_rate: t.vat_rate, notes: t.notes ?? '', status: t.status });
    setEditingId(t.id); setShowModal(true);
  }

  const navTab = (active: boolean): React.CSSProperties => ({
    padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 6, border: 'none', fontFamily: "'DM Sans', sans-serif",
    background: active ? '#fff' : 'transparent', color: active ? '#0A2E1E' : '#6B7280', boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
  });
  const filterBtn = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 6, border: 'none', fontFamily: "'DM Sans', sans-serif",
    background: active ? '#01D98D' : 'transparent', color: active ? '#fff' : '#6B7280',
  });
  const summaryCard = (color: string): React.CSSProperties => ({
    background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #E5E7EB', borderLeft: `4px solid ${color}`,
  });
  const toggleBtn = (active: boolean, color: string): React.CSSProperties => ({
    flex: 1, padding: '12px', fontSize: 14, fontWeight: 700, borderRadius: 10,
    border: `2px solid ${active ? color : '#E5E7EB'}`, background: active ? color : '#fff',
    color: active ? '#fff' : '#9CA3AF', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
  });

  return (
    <ThemeProvider>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#EEF1F4', fontFamily: "'DM Sans', sans-serif", color: '#1C1C1E' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Montserrat:wght@600;700;800&display=swap');
          * { box-sizing: border-box; }
          .tx-row:hover { background: #F9FAFB !important; }
          .fab:hover { transform: scale(1.08); }
        `}</style>

        <Sidebar
          active="REDITUS"
          userName={userName}
          plan={plan}
          netProfit={sidebarNetProfit}
          income={sidebarIncome}
          expenses={sidebarExpenses}
          taxDue={sidebarTaxDue}
          badge={draftBadge > 0 ? { REDITUS: draftBadge } : {}}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

          {/* Top bar — desktop only */}
          {!isMobile && (
            <div style={{ background: '#fff', borderBottom: '0.5px solid #E5E7EB', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 15, color: '#0A2E1E' }}>
                  REDITUS <span style={{ color: '#01D98D' }}>|</span> Income &amp; Expenses
                </span>
              </div>
              <div style={{ display: 'flex', gap: 0, background: '#F3F4F6', borderRadius: 8, padding: 3 }}>
                <button style={navTab(screen === 'ledger')}   onClick={() => setScreen('ledger')}>Ledger</button>
                <button style={navTab(screen === 'quarters')} onClick={() => setScreen('quarters')}>Quarters</button>
                <button style={navTab(screen === 'pl')}       onClick={() => setScreen('pl')}>P&amp;L</button>
              </div>
            </div>
          )}

          {/* Mobile tab bar */}
          {isMobile && (
            <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '10px 16px', display: 'flex', gap: 0, justifyContent: 'center' }}>
              <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 8, padding: 3 }}>
                <button style={navTab(screen === 'ledger')}   onClick={() => setScreen('ledger')}>Ledger</button>
                <button style={navTab(screen === 'quarters')} onClick={() => setScreen('quarters')}>Quarters</button>
                <button style={navTab(screen === 'pl')}       onClick={() => setScreen('pl')}>P&amp;L</button>
              </div>
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <main style={{ maxWidth: 960, margin: '0 auto', padding: isMobile ? '16px 14px 100px' : '24px 28px 100px' }}>

              {screen === 'ledger' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                    <div style={summaryCard('#01D98D')}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Income</div>
                      <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 22, color: '#01D98D', marginTop: 4 }}>{fmt(totalIncome)}</div>
                    </div>
                    <div style={summaryCard('#EF4444')}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Expenses</div>
                      <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 22, color: '#EF4444', marginTop: 4 }}>{fmt(totalExpense)}</div>
                    </div>
                    <div style={{ ...summaryCard(netProfit >= 0 ? '#0A2E1E' : '#EF4444'), gridColumn: isMobile ? '1 / -1' : 'auto' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Net Profit</div>
                      <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 22, color: netProfit >= 0 ? '#0A2E1E' : '#EF4444', marginTop: 4 }}>{fmt(netProfit)}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 8, padding: 3 }}>
                      {(['ALL','INCOME','EXPENSE'] as FilterType[]).map(f => (
                        <button key={f} style={filterBtn(filterType === f)} onClick={() => setFilterType(f)}>
                          {f === 'ALL' ? 'All' : f === 'INCOME' ? 'Income' : 'Expenses'}
                        </button>
                      ))}
                    </div>
                    <select style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontFamily: "'DM Sans', sans-serif" }} value={filterQuarter} onChange={e => setFilterQuarter(e.target.value)}>
                      <option value="ALL">All Quarters</option>
                      <option value="Q1">Q1 (Apr-Jun)</option>
                      <option value="Q2">Q2 (Jul-Sep)</option>
                      <option value="Q3">Q3 (Oct-Dec)</option>
                      <option value="Q4">Q4 (Jan-Mar)</option>
                    </select>
                    <select style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontFamily: "'DM Sans', sans-serif" }} value={filterTaxYear} onChange={e => setFilterTaxYear(e.target.value)}>
                      {['2026-27','2025-26','2024-25'].map(y => <option key={y} value={y}>{y} Tax Year</option>)}
                    </select>
                  </div>

                  <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                    {!isMobile && (
                      <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 160px 110px 80px 60px', padding: '10px 16px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        <span>Date</span><span>Description</span><span>Category</span><span>Amount</span><span>Type</span><span>Status</span>
                      </div>
                    )}
                    {loading && <div style={{ textAlign: 'center', padding: '48px 24px', color: '#9CA3AF' }}>Loading...</div>}
                    {!loading && filtered.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '48px 24px', color: '#9CA3AF' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>No transactions yet</div>
                        <div>Tap + below to add your first income or expense</div>
                      </div>
                    )}
                    {!loading && filtered.map(t => (
                      isMobile ? (
                        <div key={t.id} className="tx-row" onClick={() => openEdit(t)}
                          style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: '#0A2E1E', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</div>
                            <div style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} · {getCatLabel(t.category)}</div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: t.type === 'INCOME' ? '#01D98D' : '#EF4444' }}>{t.type === 'INCOME' ? '+' : '-'}{fmt(Number(t.amount_gross))}</div>
                            <div style={{ fontSize: 10, color: t.status === 'CONFIRMED' ? '#01D98D' : '#F59E0B', fontWeight: 700 }}>{t.status}</div>
                          </div>
                        </div>
                      ) : (
                        <div key={t.id} className="tx-row" onClick={() => openEdit(t)}
                          style={{ display: 'grid', gridTemplateColumns: '90px 1fr 160px 110px 80px 60px', padding: '12px 16px', borderBottom: '1px solid #F3F4F6', alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
                          <span style={{ color: '#6B7280', fontSize: 12 }}>{new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                          <span style={{ fontWeight: 500, paddingRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</span>
                          <span style={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getCatLabel(t.category)}</span>
                          <span style={{ fontWeight: 700, color: t.type === 'INCOME' ? '#01D98D' : '#EF4444' }}>{t.type === 'INCOME' ? '+' : '-'}{fmt(Number(t.amount_gross))}</span>
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700, background: t.type === 'INCOME' ? '#E8F8F2' : '#FEF2F2', color: t.type === 'INCOME' ? '#01D98D' : '#EF4444' }}>{t.type}</span>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.status === 'CONFIRMED' ? '#01D98D' : '#F59E0B', display: 'inline-block' }} />
                        </div>
                      )
                    ))}
                  </div>
                </>
              )}

              {screen === 'quarters' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 20, color: '#0A2E1E', margin: 0 }}>Quarter Summary - {filterTaxYear}</h2>
                    <select style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontFamily: "'DM Sans', sans-serif" }} value={filterTaxYear} onChange={e => setFilterTaxYear(e.target.value)}>
                      {['2026-27','2025-26','2024-25'].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                    {quarterData.map(q => (
                      <div key={q.quarter} style={{ background: '#fff', borderRadius: 14, border: `2px solid ${q.quarter === currentQuarter && filterTaxYear === currentTaxYear ? '#01D98D' : '#E5E7EB'}`, padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                          <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 28, color: '#0A2E1E' }}>{q.quarter}</div>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, textTransform: 'uppercase', background: q.status === 'Not Started' ? '#F3F4F6' : q.status === 'In Progress' ? '#FEF3C7' : '#E8F8F2', color: q.status === 'Not Started' ? '#9CA3AF' : q.status === 'In Progress' ? '#D97706' : '#059669' }}>{q.status}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                          {[['Income', fmt(q.income), '#01D98D'], ['Expenses', fmt(q.expense), '#EF4444'], ['Net', fmt(q.net), q.net >= 0 ? '#0A2E1E' : '#EF4444'], ['Deadline', q.days > 0 ? `${q.days}d left` : 'Passed', q.days < 14 ? '#EF4444' : q.days < 30 ? '#D97706' : '#374151']].map(([label, value, color]) => (
                            <div key={label as string}>
                              <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                              <div style={{ fontWeight: 700, color: color as string, fontSize: 15 }}>{value}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 10 }}>Due: {getDeadline(q.quarter, filterTaxYear)}</div>
                        <button onClick={() => window.location.href = '/dashboard/quartus'} style={{ width: '100%', padding: '8px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: '1px solid #01D98D', background: '#F0FDF8', color: '#065F46', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                          Submit via QUARTUS →
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {screen === 'pl' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 20, color: '#0A2E1E', margin: 0 }}>Profit and Loss - {filterTaxYear}</h2>
                    <select style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontFamily: "'DM Sans', sans-serif" }} value={filterTaxYear} onChange={e => setFilterTaxYear(e.target.value)}>
                      {['2026-27','2025-26','2024-25'].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                    <div style={summaryCard('#01D98D')}><div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Annual Income</div><div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 22, color: '#01D98D', marginTop: 4 }}>{fmt(annualIncome)}</div></div>
                    <div style={summaryCard('#EF4444')}><div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Annual Expenses</div><div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 22, color: '#EF4444', marginTop: 4 }}>{fmt(annualExpense)}</div></div>
                    <div style={summaryCard('#0A2E1E')}><div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Net Profit</div><div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 22, color: '#0A2E1E', marginTop: 4 }}>{fmt(annualNet)}</div></div>
                  </div>
                  <div style={{ background: '#F0FDF8', border: '1px solid #BBF7E4', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#065F46', textTransform: 'uppercase', letterSpacing: 0.5 }}>Estimated Income Tax (basic rate)</div>
                      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>£12,570 personal allowance at 20% — indicative only</div>
                    </div>
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 24, color: '#0A2E1E' }}>{fmt(estTax)}</div>
                  </div>
                  <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 110px', padding: '10px 16px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      <span>Category</span><span>Transactions</span><span>Total</span>
                    </div>
                    {categoryPL.length === 0 && <div style={{ textAlign: 'center', padding: '48px 24px', color: '#9CA3AF' }}>No transactions for this tax year yet.</div>}
                    {categoryPL.map(c => (
                      <div key={c.value} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 110px', padding: '12px 16px', borderBottom: '1px solid #F3F4F6', fontSize: 13 }}>
                        <span style={{ fontWeight: 500 }}>{c.label}</span>
                        <span style={{ color: '#9CA3AF', fontSize: 12 }}>{c.count}</span>
                        <span style={{ fontWeight: 700, color: c.total >= 0 ? '#01D98D' : '#EF4444' }}>{fmt(c.total)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </main>
          </div>
        </div>

        {/* FAB */}
        <button className="fab" onClick={() => { setForm(emptyForm); setEditingId(null); setShowModal(true); }}
          style={{ position: 'fixed', bottom: 28, right: 28, width: 56, height: 56, borderRadius: '50%', background: '#01D98D', color: '#fff', border: 'none', fontSize: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(1,217,141,0.4)', zIndex: 200 }}>
          +
        </button>

        {/* Modal */}
        {showModal && (
          <div onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); setForm(emptyForm); setEditingId(null); } }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto', padding: '24px 24px 40px', boxShadow: '0 -4px 40px rgba(0,0,0,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 18, color: '#0A2E1E' }}>{editingId ? 'Edit Transaction' : 'Add Transaction'}</div>
                {editingId && <button onClick={() => handleDelete(editingId)} style={{ background: '#FEF2F2', color: '#EF4444', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Delete</button>}
              </div>
              {saveError && <div style={{ color: '#EF4444', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: '#FEF2F2', borderRadius: 8 }}>{saveError}</div>}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>Amount</label>
                <input type="number" step="0.01" min="0" placeholder="0.00" value={form.amount_gross} onChange={e => setForm(f => ({ ...f, amount_gross: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', fontSize: 24, fontWeight: 700, fontFamily: "'Montserrat', sans-serif", border: '1px solid #E5E7EB', borderRadius: 10, background: '#fff', color: '#1C1C1E', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button style={toggleBtn(form.type === 'INCOME', '#01D98D')} onClick={() => setForm(f => ({ ...f, type: 'INCOME' }))}>INCOME</button>
                <button style={toggleBtn(form.type === 'EXPENSE', '#EF4444')} onClick={() => setForm(f => ({ ...f, type: 'EXPENSE' }))}>EXPENSE</button>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid #E5E7EB', borderRadius: 10, background: '#fff', fontFamily: "'DM Sans', sans-serif", color: '#1C1C1E' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  Category <Tooltip text="HMRC requires expenses to be mapped to approved categories for MTD" />
                </label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid #E5E7EB', borderRadius: 10, background: '#fff', fontFamily: "'DM Sans', sans-serif", color: '#1C1C1E' }}>
                  <option value="">Select category</option>
                  <optgroup label="Income">
                    {HMRC_CATEGORIES.filter(c => c.value.includes('INCOME')).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </optgroup>
                  <optgroup label="Expenses">
                    {HMRC_CATEGORIES.filter(c => !c.value.includes('INCOME')).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </optgroup>
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>Description</label>
                <input type="text" placeholder="e.g. Office supplies from Staples" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid #E5E7EB', borderRadius: 10, background: '#fff', fontFamily: "'DM Sans', sans-serif", color: '#1C1C1E' }} />
              </div>
              {form.type === 'INCOME' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                    Source <Tooltip text="HMRC requires Trading and Property income to be reported separately" />
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['TRADING','PROPERTY','OTHER'] as const).map(src => (
                      <button key={src} onClick={() => setForm(f => ({ ...f, income_source: src }))}
                        style={{ flex: 1, padding: '8px 4px', fontSize: 11, fontWeight: 600, borderRadius: 8, border: `2px solid ${form.income_source === src ? '#01D98D' : '#E5E7EB'}`, background: form.income_source === src ? '#E8F8F2' : '#fff', color: form.income_source === src ? '#0A2E1E' : '#9CA3AF', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                        {src}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <button onClick={() => setShowVAT(!showVAT)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#6B7280', padding: 0, display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif" }}>
                  {showVAT ? '▼' : '▶'} VAT <Tooltip text="Only needed if you are VAT registered." />
                </button>
                {showVAT && (
                  <div style={{ marginTop: 10 }}>
                    <select value={form.vat_rate} onChange={e => setForm(f => ({ ...f, vat_rate: e.target.value }))}
                      style={{ width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid #E5E7EB', borderRadius: 10, background: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
                      {VAT_RATES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  Status <Tooltip text="Draft = not yet finalised. Confirmed = verified and ready for HMRC submission." />
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['DRAFT','CONFIRMED'] as const).map(st => (
                    <button key={st} onClick={() => setForm(f => ({ ...f, status: st }))}
                      style={{ flex: 1, padding: '8px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: `2px solid ${form.status === st ? '#01D98D' : '#E5E7EB'}`, background: form.status === st ? '#E8F8F2' : '#fff', color: form.status === st ? '#0A2E1E' : '#9CA3AF', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                      {st}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>Notes (optional)</label>
                <input type="text" placeholder="Any additional notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid #E5E7EB', borderRadius: 10, background: '#fff', fontFamily: "'DM Sans', sans-serif", color: '#1C1C1E' }} />
              </div>
              <button onClick={handleSave} disabled={saving}
                style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700, background: '#01D98D', color: '#fff', border: 'none', borderRadius: 12, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Montserrat', sans-serif", marginTop: 8, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : editingId ? 'Update Transaction' : 'Add Transaction'}
              </button>
              <button onClick={() => { setShowModal(false); setForm(emptyForm); setEditingId(null); }}
                style={{ width: '100%', padding: '12px', fontSize: 14, background: 'transparent', color: '#6B7280', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}
