'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type Transaction = {
  id: string;
  user_id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  amount_gross: number;
  amount_net: number | null;
  vat_amount: number | null;
  vat_rate: string;
  description: string;
  category: string;
  income_source: 'TRADING' | 'PROPERTY' | 'OTHER' | null;
  accounting_method: string;
  tax_year: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  receipt_url: string | null;
  status: 'DRAFT' | 'CONFIRMED';
  notes: string | null;
  created_at: string;
};

type Screen = 'ledger' | 'quarters' | 'pl';
type FilterType = 'ALL' | 'INCOME' | 'EXPENSE';

// â”€â”€â”€ HMRC Categories â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const HMRC_CATEGORIES = [
  { value: 'GOODS_MATERIALS', label: 'Cost of goods / materials', tooltip: 'Stock, raw materials, or goods purchased to resell' },
  { value: 'TRAVEL', label: 'Car, van & travel', tooltip: 'Business mileage (45p/mile first 10,000), fuel, parking, public transport' },
  { value: 'WAGES', label: 'Wages & salaries', tooltip: 'Payments to employees and PAYE costs' },
  { value: 'RENT_RATES', label: 'Rent & rates', tooltip: 'Business premises rent, business rates, water rates' },
  { value: 'REPAIRS', label: 'Repairs & maintenance', tooltip: 'Keeping existing business property or equipment in working order' },
  { value: 'ADMIN', label: 'General admin', tooltip: 'Postage, stationery, printing, phone, internet' },
  { value: 'MARKETING', label: 'Advertising & marketing', tooltip: 'Website, ads, flyers, social media promotion' },
  { value: 'PROFESSIONAL_FEES', label: 'Professional fees', tooltip: 'Accountant, solicitor, consultant fees for business purposes' },
  { value: 'FINANCIAL_CHARGES', label: 'Financial charges', tooltip: 'Bank charges, loan interest only (not capital repayments)' },
  { value: 'DEPRECIATION', label: 'Depreciation / capital allowances', tooltip: 'Tax relief on equipment, vehicles, or assets bought for business' },
  { value: 'TRADING_INCOME', label: 'Trading income', tooltip: 'Revenue from self-employed work or your business' },
  { value: 'PROPERTY_INCOME', label: 'Property / rental income', tooltip: 'Rental income from land or buildings you own' },
  { value: 'OTHER_INCOME', label: 'Other income', tooltip: 'Dividends, interest, or other income â€” for Final Declaration' },
  { value: 'OTHER_EXPENSE', label: 'Other expense', tooltip: 'Any allowable expense not covered above â€” must add description' },
];

const VAT_RATES = [
  { value: 'NOT_REGISTERED', label: 'Not VAT Registered', tooltip: 'You are not registered for VAT â€” no VAT to record' },
  { value: 'EXEMPT', label: 'Exempt', tooltip: 'Outside the VAT system â€” you cannot reclaim VAT on related costs' },
  { value: 'ZERO', label: '0% Zero Rated', tooltip: 'Taxable at 0% but still in the VAT system â€” you CAN reclaim input VAT' },
  { value: 'REDUCED', label: '5% Reduced Rate', tooltip: 'Domestic energy, children\'s car seats, and some other goods' },
  { value: 'STANDARD', label: '20% Standard Rate', tooltip: 'Most goods and services in the UK' },
];

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function getTaxYear(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const afterApril6 = month > 4 || (month === 4 && day >= 6);
  return afterApril6 ? `${year}-${String(year + 1).slice(2)}` : `${year - 1}-${String(year).slice(2)}`;
}

function getHMRCQuarter(date: Date): 'Q1' | 'Q2' | 'Q3' | 'Q4' {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfYear = month * 100 + day;
  // Q1: 6 Apr â€“ 5 Jul (406â€“705)
  // Q2: 6 Jul â€“ 5 Oct (706â€“1005)
  // Q3: 6 Oct â€“ 5 Jan (1006â€“1305 + 101â€“405)
  // Q4: 6 Jan â€“ 5 Apr (106â€“405)
  if (dayOfYear >= 406 && dayOfYear <= 705) return 'Q1';
  if (dayOfYear >= 706 && dayOfYear <= 1005) return 'Q2';
  if (dayOfYear >= 1006 || dayOfYear <= 105) return 'Q3';
  return 'Q4';
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function getCategoryLabel(value: string): string {
  return HMRC_CATEGORIES.find(c => c.value === value)?.label ?? value;
}

function getQuarterDeadline(quarter: string, taxYear: string): string {
  const startYear = parseInt(taxYear.split('-')[0]);
  const map: Record<string, string> = {
    Q1: `7 Aug ${startYear}`,
    Q2: `7 Nov ${startYear}`,
    Q3: `7 Feb ${startYear + 1}`,
    Q4: `7 May ${startYear + 1}`,
  };
  return map[quarter] ?? '';
}

function daysToDeadline(quarter: string, taxYear: string): number {
  const deadlineStr = getQuarterDeadline(quarter, taxYear);
  const deadline = new Date(deadlineStr);
  const today = new Date();
  return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// â”€â”€â”€ Tooltip Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Tooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-block', marginLeft: 4 }}>
      <span
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 16, height: 16, borderRadius: '50%',
          background: '#E8F8F2', color: '#01D98D', fontSize: 10, fontWeight: 700,
          cursor: 'help', border: '1px solid #01D98D', lineHeight: 1,
        }}
      >â“˜</span>
      {visible && (
        <span style={{
          position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)',
          background: '#0A2E1E', color: '#fff', padding: '6px 10px', borderRadius: 6,
          fontSize: 11, zIndex: 1000, maxWidth: 240,
          whiteSpace: 'normal', lineHeight: 1.4, boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}>
          {text}
        </span>
      )}
    </span>
  );
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ReditusPage() {
  const supabase = createClient();
  const today = new Date();
  const currentTaxYear = getTaxYear(today);
  const currentQuarter = getHMRCQuarter(today);

  // State
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

  // Form state
  const emptyForm = {
    amount_gross: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    date: todayISO(),
    category: '',
    description: '',
    income_source: 'TRADING' as 'TRADING' | 'PROPERTY' | 'OTHER',
    vat_rate: 'NOT_REGISTERED',
    notes: '',
    status: 'DRAFT' as 'DRAFT' | 'CONFIRMED',
  };
  const [form, setForm] = useState(emptyForm);
  const [showVAT, setShowVAT] = useState(false);

  // â”€â”€ Fetch transactions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('tax_year', filterTaxYear)
      .order('date', { ascending: false });

    if (!error && data) setTransactions(data as Transaction[]);
    setLoading(false);
  }, [filterTaxYear]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  // â”€â”€ Computed values â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const filtered = transactions.filter(t => {
    if (filterType !== 'ALL' && t.type !== filterType) return false;
    if (filterQuarter !== 'ALL' && t.quarter !== filterQuarter) return false;
    return true;
  });

  const totalIncome = filtered.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount_gross), 0);
  const totalExpense = filtered.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount_gross), 0);
  const netProfit = totalIncome - totalExpense;

  // Quarter breakdown (always for full tax year)
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  const quarterData = quarters.map(q => {
    const qTx = transactions.filter(t => t.quarter === q);
    const inc = qTx.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount_gross), 0);
    const exp = qTx.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount_gross), 0);
    const hasConfirmed = qTx.some(t => t.status === 'CONFIRMED');
    const status = qTx.length === 0 ? 'Not Started' : hasConfirmed ? 'In Progress' : 'Draft';
    return { quarter: q, income: inc, expense: exp, net: inc - exp, status, days: daysToDeadline(q, filterTaxYear) };
  });

  // P&L by category
  const categoryPL = HMRC_CATEGORIES.map(cat => {
    const catTx = transactions.filter(t => t.category === cat.value);
    const total = catTx.reduce((s, t) => {
      return s + (t.type === 'INCOME' ? Number(t.amount_gross) : -Number(t.amount_gross));
    }, 0);
    return { ...cat, total, count: catTx.length };
  }).filter(c => c.count > 0);

  const annualIncome = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount_gross), 0);
  const annualExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount_gross), 0);
  const annualNet = annualIncome - annualExpense;
  const estimatedTax = Math.max(0, (annualNet - 12570) * 0.2); // Basic rate after personal allowance

  // â”€â”€ Save transaction â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function handleSave() {
    setSaveError('');
    if (!form.amount_gross || !form.category || !form.description) {
      setSaveError('Amount, category and description are required.');
      return;
    }
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaveError('Not authenticated.'); setSaving(false); return; }

    const dateObj = new Date(form.date);
    const gross = parseFloat(form.amount_gross);
    let net: number | null = null;
    let vat: number | null = null;

    if (form.vat_rate === 'STANDARD') { net = gross / 1.2; vat = gross - net; }
    else if (form.vat_rate === 'REDUCED') { net = gross / 1.05; vat = gross - net; }
    else { net = gross; vat = 0; }

    const row = {
      user_id: user.id,
      date: form.date,
      type: form.type,
      amount_gross: gross,
      amount_net: parseFloat(net.toFixed(2)),
      vat_amount: parseFloat((vat ?? 0).toFixed(2)),
      vat_rate: form.vat_rate,
      description: form.description,
      category: form.category,
      income_source: form.type === 'INCOME' ? form.income_source : null,
      accounting_method: 'CASH',
      tax_year: getTaxYear(dateObj),
      quarter: getHMRCQuarter(dateObj),
      status: form.status,
      notes: form.notes || null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('transactions').update(row).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('transactions').insert(row));
    }

    setSaving(false);
    if (error) { setSaveError(error.message); return; }
    setShowModal(false);
    setForm(emptyForm);
    setEditingId(null);
    fetchTransactions();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this transaction?')) return;
    await supabase.from('transactions').delete().eq('id', id);
    fetchTransactions();
  }

  function openEdit(t: Transaction) {
    setForm({
      amount_gross: String(t.amount_gross),
      type: t.type,
      date: t.date,
      category: t.category,
      description: t.description,
      income_source: t.income_source ?? 'TRADING',
      vat_rate: t.vat_rate,
      notes: t.notes ?? '',
      status: t.status,
    });
    setEditingId(t.id);
    setShowModal(true);
  }

  // â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const s = {
    page: {
      minHeight: '100vh', background: '#FAFAFA', fontFamily: "'DM Sans', sans-serif",
      color: '#1C1C1E',
    } as React.CSSProperties,
    header: {
      background: '#fff', borderBottom: '1px solid #E5E7EB',
      padding: '0 24px', height: 60, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', position: 'sticky' as const, top: 0, zIndex: 100,
    },
    logoArea: { display: 'flex', alignItems: 'center', gap: 12 },
    moduleTitle: {
      fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 15,
      color: '#0A2E1E', letterSpacing: '-0.3px',
    },
    moduleDot: { color: '#01D98D', margin: '0 4px' },
    backBtn: {
      fontSize: 13, color: '#6B7280', cursor: 'pointer', background: 'none',
      border: 'none', padding: '4px 8px', borderRadius: 6,
      fontFamily: "'DM Sans', sans-serif",
    },
    navTabs: { display: 'flex', gap: 0, background: '#F3F4F6', borderRadius: 8, padding: 3 },
    navTab: (active: boolean) => ({
      padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
      borderRadius: 6, border: 'none', fontFamily: "'DM Sans', sans-serif",
      background: active ? '#fff' : 'transparent',
      color: active ? '#0A2E1E' : '#6B7280',
      boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
      transition: 'all 0.15s',
    } as React.CSSProperties),
    body: { maxWidth: 960, margin: '0 auto', padding: '24px 16px 100px' },
    summaryBar: {
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
      gap: 12, marginBottom: 20,
    },
    summaryCard: (color: string) => ({
      background: '#fff', borderRadius: 12, padding: '16px 20px',
      border: '1px solid #E5E7EB', borderLeft: `4px solid ${color}`,
    } as React.CSSProperties),
    summaryLabel: { fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: 0.5 },
    summaryValue: (color: string) => ({
      fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 22,
      color, marginTop: 4,
    } as React.CSSProperties),
    filterRow: {
      display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' as const,
    },
    filterGroup: { display: 'flex', gap: 0, background: '#F3F4F6', borderRadius: 8, padding: 3 },
    filterBtn: (active: boolean) => ({
      padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
      borderRadius: 6, border: 'none', fontFamily: "'DM Sans', sans-serif",
      background: active ? '#01D98D' : 'transparent',
      color: active ? '#fff' : '#6B7280',
      transition: 'all 0.15s',
    } as React.CSSProperties),
    select: {
      padding: '6px 12px', fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB',
      background: '#fff', color: '#1C1C1E', fontFamily: "'DM Sans', sans-serif",
      cursor: 'pointer',
    },
    tableWrap: {
      background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden',
    },
    tableHeader: {
      display: 'grid', gridTemplateColumns: '90px 1fr 160px 100px 80px 60px',
      padding: '10px 16px', background: '#F9FAFB',
      borderBottom: '1px solid #E5E7EB', fontSize: 11,
      fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: 0.5,
    },
    tableRow: {
      display: 'grid', gridTemplateColumns: '90px 1fr 160px 100px 80px 60px',
      padding: '12px 16px', borderBottom: '1px solid #F3F4F6',
      alignItems: 'center', fontSize: 13, cursor: 'pointer',
      transition: 'background 0.1s',
    },
    typeBadge: (type: string) => ({
      display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 10,
      fontWeight: 700, letterSpacing: 0.5,
      background: type === 'INCOME' ? '#E8F8F2' : '#FEF2F2',
      color: type === 'INCOME' ? '#01D98D' : '#EF4444',
    } as React.CSSProperties),
    statusDot: (status: string) => ({
      width: 8, height: 8, borderRadius: '50%',
      background: status === 'CONFIRMED' ? '#01D98D' : '#F59E0B',
      display: 'inline-block',
    } as React.CSSProperties),
    emptyState: {
      textAlign: 'center' as const, padding: '48px 24px',
      color: '#9CA3AF', fontSize: 14,
    },
    fab: {
      position: 'fixed' as const, bottom: 28, right: 28,
      width: 56, height: 56, borderRadius: '50%',
      background: '#01D98D', color: '#fff', border: 'none',
      fontSize: 28, cursor: 'pointer', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 4px 20px rgba(1,217,141,0.4)',
      zIndex: 200, fontFamily: "'DM Sans', sans-serif",
      transition: 'transform 0.15s, box-shadow 0.15s',
    },
    // Modal
    overlay: {
      position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.4)',
      zIndex: 300, display: 'flex', alignItems: 'flex-end',
      justifyContent: 'center',
    },
    modal: {
      background: '#fff', borderRadius: '20px 20px 0 0',
      width: '100%', maxWidth: 560, maxHeight: '90vh',
      overflow: 'auto', padding: '24px 24px 40px',
      boxShadow: '0 -4px 40px rgba(0,0,0,0.15)',
    },
    modalTitle: {
      fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 18,
      color: '#0A2E1E', marginBottom: 20,
    },
    fieldGroup: { marginBottom: 16 },
    label: {
      display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 600,
      color: '#374151', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 0.4,
    },
    input: {
      width: '100%', padding: '10px 14px', fontSize: 14,
      border: '1px solid #E5E7EB', borderRadius: 10, background: '#fff',
      fontFamily: "'DM Sans', sans-serif", color: '#1C1C1E',
      boxSizing: 'border-box' as const, outline: 'none',
    },
    toggleRow: { display: 'flex', gap: 8, marginBottom: 16 },
    toggleBtn: (active: boolean, color: string) => ({
      flex: 1, padding: '12px', fontSize: 14, fontWeight: 700,
      borderRadius: 10, border: `2px solid ${active ? color : '#E5E7EB'}`,
      background: active ? color : '#fff',
      color: active ? '#fff' : '#9CA3AF',
      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
      transition: 'all 0.15s',
    } as React.CSSProperties),
    saveBtn: {
      width: '100%', padding: '14px', fontSize: 15, fontWeight: 700,
      background: '#01D98D', color: '#fff', border: 'none', borderRadius: 12,
      cursor: 'pointer', fontFamily: "'Montserrat', sans-serif",
      marginTop: 8, letterSpacing: 0.3,
    },
    cancelBtn: {
      width: '100%', padding: '12px', fontSize: 14,
      background: 'transparent', color: '#6B7280', border: 'none',
      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", marginTop: 4,
    },
    errorMsg: {
      color: '#EF4444', fontSize: 13, marginBottom: 12,
      padding: '8px 12px', background: '#FEF2F2', borderRadius: 8,
    },
    // Quarter cards
    quarterGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 },
    quarterCard: (active: boolean) => ({
      background: '#fff', borderRadius: 14, border: `2px solid ${active ? '#01D98D' : '#E5E7EB'}`,
      padding: '20px', position: 'relative' as const,
    } as React.CSSProperties),
    qLabel: {
      fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 28,
      color: '#0A2E1E', marginBottom: 12,
    },
    qStatusBadge: (status: string) => ({
      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
      letterSpacing: 0.5, textTransform: 'uppercase' as const,
      background: status === 'Not Started' ? '#F3F4F6' : status === 'In Progress' ? '#FEF3C7' : '#E8F8F2',
      color: status === 'Not Started' ? '#9CA3AF' : status === 'In Progress' ? '#D97706' : '#059669',
    } as React.CSSProperties),
  };

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <div style={s.page}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Montserrat:wght@600;700;800&display=swap');
        * { box-sizing: border-box; }
        .tx-row:hover { background: #F9FAFB !important; }
        .fab-btn:hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(1,217,141,0.5) !important; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 4px; }
      `}</style>

      {/* â”€â”€ Header â”€â”€ */}
      <header style={s.header}>
        <div style={s.logoArea}>
          <button style={s.backBtn} onClick={() => { window.location.href = '/dashboard'; }}>
            â† Dashboard
          </button>
          <div style={{ width: 1, height: 20, background: '#E5E7EB' }} />
          <span style={s.moduleTitle}>
            REDITUS<span style={s.moduleDot}>Â·</span>Income & Expenses
          </span>
        </div>
        <div style={s.navTabs}>
          <button style={s.navTab(screen === 'ledger')} onClick={() => setScreen('ledger')}>Ledger</button>
          <button style={s.navTab(screen === 'quarters')} onClick={() => setScreen('quarters')}>Quarters</button>
          <button style={s.navTab(screen === 'pl')} onClick={() => setScreen('pl')}>P&amp;L</button>
        </div>
      </header>

      {/* â”€â”€ Body â”€â”€ */}
      <main style={s.body}>

        {/* â”€ LEDGER SCREEN â”€ */}
        {screen === 'ledger' && (
          <>
            {/* Summary bar */}
            <div style={s.summaryBar}>
              <div style={s.summaryCard('#01D98D')}>
                <div style={s.summaryLabel}>Income</div>
                <div style={s.summaryValue('#01D98D')}>{formatCurrency(totalIncome)}</div>
              </div>
              <div style={s.summaryCard('#EF4444')}>
                <div style={s.summaryLabel}>Expenses</div>
                <div style={s.summaryValue('#EF4444')}>{formatCurrency(totalExpense)}</div>
              </div>
              <div style={s.summaryCard(netProfit >= 0 ? '#0A2E1E' : '#EF4444')}>
                <div style={s.summaryLabel}>Net Profit</div>
                <div style={s.summaryValue(netProfit >= 0 ? '#0A2E1E' : '#EF4444')}>{formatCurrency(netProfit)}</div>
              </div>
            </div>

            {/* Filters */}
            <div style={s.filterRow}>
              <div style={s.filterGroup}>
                {(['ALL', 'INCOME', 'EXPENSE'] as FilterType[]).map(f => (
                  <button key={f} style={s.filterBtn(filterType === f)} onClick={() => setFilterType(f)}>
                    {f === 'ALL' ? 'All' : f === 'INCOME' ? 'Income' : 'Expenses'}
                  </button>
                ))}
              </div>
              <select style={s.select} value={filterQuarter} onChange={e => setFilterQuarter(e.target.value)}>
                <option value="ALL">All Quarters</option>
                <option value="Q1">Q1 (Apr-Jun)</option>
                <option value="Q2">Q2 (Jul-Sep)</option>
                <option value="Q3">Q3 (Oct-Dec)</option>
                <option value="Q4">Q4 (Jan-Mar)</option>
              </select>
              <select style={s.select} value={filterTaxYear} onChange={e => setFilterTaxYear(e.target.value)}>
                {['2026-27', '2025-26', '2024-25'].map(y => (
                  <option key={y} value={y}>{y} Tax Year</option>
                ))}
              </select>
            </div>

            {/* Transaction table */}
            <div style={s.tableWrap}>
              <div style={s.tableHeader}>
                <span>Date</span>
                <span>Description</span>
                <span>Category</span>
                <span>Amount</span>
                <span>Type</span>
                <span>Status</span>
              </div>
              {loading && (
                <div style={s.emptyState}>Loading transactionsâ€¦</div>
              )}
              {!loading && filtered.length === 0 && (
                <div style={s.emptyState}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>ðŸ“‹</div>
                  <div style={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}>No transactions yet</div>
                  <div>Tap + below to add your first income or expense</div>
                </div>
              )}
              {!loading && filtered.map(t => (
                <div
                  key={t.id}
                  className="tx-row"
                  style={s.tableRow}
                  onClick={() => openEdit(t)}
                >
                  <span style={{ color: '#6B7280', fontSize: 12 }}>
                    {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </span>
                  <span style={{ fontWeight: 500, paddingRight: 8 }}>{t.description}</span>
                  <span style={{ fontSize: 12, color: '#6B7280' }}>{getCategoryLabel(t.category)}</span>
                  <span style={{ fontWeight: 700, color: t.type === 'INCOME' ? '#01D98D' : '#EF4444' }}>
                    {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(Number(t.amount_gross))}
                  </span>
                  <span><span style={s.typeBadge(t.type)}>{t.type}</span></span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={s.statusDot(t.status)} />
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* â”€ QUARTERS SCREEN â”€ */}
        {screen === 'quarters' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 20, color: '#0A2E1E', margin: 0 }}>
                Quarter Summary â€” {filterTaxYear}
              </h2>
              <select style={s.select} value={filterTaxYear} onChange={e => setFilterTaxYear(e.target.value)}>
                {['2026-27', '2025-26', '2024-25'].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div style={s.quarterGrid}>
              {quarterData.map(q => (
                <div key={q.quarter} style={s.quarterCard(q.quarter === currentQuarter && filterTaxYear === currentTaxYear)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={s.qLabel}>{q.quarter}</div>
                    <span style={s.qStatusBadge(q.status)}>{q.status}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>Income</div>
                      <div style={{ fontWeight: 700, color: '#01D98D', fontSize: 16 }}>{formatCurrency(q.income)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>Expenses</div>
                      <div style={{ fontWeight: 700, color: '#EF4444', fontSize: 16 }}>{formatCurrency(q.expense)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>Net</div>
                      <div style={{ fontWeight: 700, color: q.net >= 0 ? '#0A2E1E' : '#EF4444', fontSize: 16 }}>{formatCurrency(q.net)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>Deadline</div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: q.days < 14 ? '#EF4444' : q.days < 30 ? '#D97706' : '#374151' }}>
                        {q.days > 0 ? `${q.days}d left` : 'Passed'}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>Due: {getQuarterDeadline(q.quarter, filterTaxYear)}</div>
                  <button style={{
                    marginTop: 12, width: '100%', padding: '8px', fontSize: 12, fontWeight: 600,
                    borderRadius: 8, border: '1px solid #E5E7EB', background: '#F9FAFB',
                    color: '#9CA3AF', cursor: 'not-allowed', fontFamily: "'DM Sans', sans-serif",
                  }}>
                    Submit to HMRC â€” QUARTUS (coming)
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* â”€ P&L SCREEN â”€ */}
        {screen === 'pl' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 20, color: '#0A2E1E', margin: 0 }}>
                Profit & Loss â€” {filterTaxYear}
              </h2>
              <select style={s.select} value={filterTaxYear} onChange={e => setFilterTaxYear(e.target.value)}>
                {['2026-27', '2025-26', '2024-25'].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Annual summary */}
            <div style={{ ...s.summaryBar, marginBottom: 24 }}>
              <div style={s.summaryCard('#01D98D')}>
                <div style={s.summaryLabel}>Annual Income</div>
                <div style={s.summaryValue('#01D98D')}>{formatCurrency(annualIncome)}</div>
              </div>
              <div style={s.summaryCard('#EF4444')}>
                <div style={s.summaryLabel}>Annual Expenses</div>
                <div style={s.summaryValue('#EF4444')}>{formatCurrency(annualExpense)}</div>
              </div>
              <div style={s.summaryCard('#0A2E1E')}>
                <div style={s.summaryLabel}>Net Profit</div>
                <div style={s.summaryValue('#0A2E1E')}>{formatCurrency(annualNet)}</div>
              </div>
            </div>

            {/* Tax estimate */}
            <div style={{
              background: '#F0FDF8', border: '1px solid #BBF7E4', borderRadius: 12,
              padding: '16px 20px', marginBottom: 20, display: 'flex',
              justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#065F46', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Estimated Income Tax (basic rate)
                </div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                  Based on Â£{(12570).toLocaleString()} personal allowance @ 20% â€” indicative only
                </div>
              </div>
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 24, color: '#0A2E1E' }}>
                {formatCurrency(estimatedTax)}
              </div>
            </div>

            {/* Category breakdown */}
            <div style={s.tableWrap}>
              <div style={{ ...s.tableHeader, gridTemplateColumns: '1fr 100px 80px' }}>
                <span>Category</span>
                <span>Transactions</span>
                <span>Total</span>
              </div>
              {categoryPL.length === 0 && (
                <div style={s.emptyState}>No transactions recorded for this tax year yet.</div>
              )}
              {categoryPL.map(c => (
                <div key={c.value} style={{ ...s.tableRow, gridTemplateColumns: '1fr 100px 80px' }}>
                  <span style={{ fontWeight: 500 }}>{c.label}</span>
                  <span style={{ color: '#9CA3AF', fontSize: 12 }}>{c.count}</span>
                  <span style={{ fontWeight: 700, color: c.total >= 0 ? '#01D98D' : '#EF4444' }}>
                    {formatCurrency(c.total)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

      </main>

      {/* â”€â”€ FAB â”€â”€ */}
      <button
        className="fab-btn"
        style={s.fab}
        onClick={() => { setForm(emptyForm); setEditingId(null); setShowModal(true); }}
        title="Add Transaction"
      >
        +
      </button>

      {/* â”€â”€ Add / Edit Modal â”€â”€ */}
      {showModal && (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); setForm(emptyForm); setEditingId(null); } }}>
          <div style={s.modal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={s.modalTitle}>{editingId ? 'Edit Transaction' : 'Add Transaction'}</div>
              {editingId && (
                <button
                  onClick={() => handleDelete(editingId)}
                  style={{ background: '#FEF2F2', color: '#EF4444', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Delete
                </button>
              )}
            </div>

            {saveError && <div style={s.errorMsg}>{saveError}</div>}

            {/* Amount */}
            <div style={s.fieldGroup}>
              <label style={s.label}>Amount Â£</label>
              <input
                style={{ ...s.input, fontSize: 24, fontWeight: 700, fontFamily: "'Montserrat', sans-serif" }}
                type="number" step="0.01" min="0" placeholder="0.00"
                value={form.amount_gross}
                onChange={e => setForm(f => ({ ...f, amount_gross: e.target.value }))}
              />
            </div>

            {/* Type toggle */}
            <div style={s.toggleRow}>
              <button style={s.toggleBtn(form.type === 'INCOME', '#01D98D')}
                onClick={() => setForm(f => ({ ...f, type: 'INCOME' }))}>
                â†‘ INCOME
              </button>
              <button style={s.toggleBtn(form.type === 'EXPENSE', '#EF4444')}
                onClick={() => setForm(f => ({ ...f, type: 'EXPENSE' }))}>
                â†“ EXPENSE
              </button>
            </div>

            {/* Date */}
            <div style={s.fieldGroup}>
              <label style={s.label}>Date</label>
              <input style={s.input} type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>

            {/* Category */}
            <div style={s.fieldGroup}>
              <label style={s.label}>
                Category
                <Tooltip text="HMRC requires expenses to be mapped to approved categories for MTD" />
              </label>
              <select style={s.input} value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="">â€” Select category â€”</option>
                <optgroup label="Income">
                  {HMRC_CATEGORIES.filter(c => c.value.includes('INCOME')).map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Expenses">
                  {HMRC_CATEGORIES.filter(c => !c.value.includes('INCOME')).map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Description */}
            <div style={s.fieldGroup}>
              <label style={s.label}>Description</label>
              <input style={s.input} type="text" placeholder="e.g. Office supplies from Staples"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            {/* Income source â€” only for income */}
            {form.type === 'INCOME' && (
              <div style={s.fieldGroup}>
                <label style={s.label}>
                  Source
                  <Tooltip text="HMRC requires Trading income (self-employment) and Property income to be reported separately" />
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['TRADING', 'PROPERTY', 'OTHER'] as const).map(src => (
                    <button key={src} style={{
                      flex: 1, padding: '8px 4px', fontSize: 11, fontWeight: 600,
                      borderRadius: 8, border: `2px solid ${form.income_source === src ? '#01D98D' : '#E5E7EB'}`,
                      background: form.income_source === src ? '#E8F8F2' : '#fff',
                      color: form.income_source === src ? '#0A2E1E' : '#9CA3AF',
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    }}
                      onClick={() => setForm(f => ({ ...f, income_source: src }))}>
                      {src}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* VAT section */}
            <div style={s.fieldGroup}>
              <button
                onClick={() => setShowVAT(!showVAT)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#6B7280', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <span style={{ transform: showVAT ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform 0.15s' }}>â–¶</span>
                VAT
                <Tooltip text="Only needed if you are VAT registered. Most sole traders under Â£90,000 turnover are not required to register." />
              </button>
              {showVAT && (
                <div style={{ marginTop: 10 }}>
                  <select style={s.input} value={form.vat_rate}
                    onChange={e => setForm(f => ({ ...f, vat_rate: e.target.value }))}>
                    {VAT_RATES.map(v => (
                      <option key={v.value} value={v.value}>{v.label}</option>
                    ))}
                  </select>
                  {(form.vat_rate === 'STANDARD' || form.vat_rate === 'REDUCED') && form.amount_gross && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#6B7280', background: '#F9FAFB', padding: '8px 12px', borderRadius: 8 }}>
                      {form.vat_rate === 'STANDARD'
                        ? `Net: Â£${(parseFloat(form.amount_gross) / 1.2).toFixed(2)} Â· VAT: Â£${(parseFloat(form.amount_gross) - parseFloat(form.amount_gross) / 1.2).toFixed(2)}`
                        : `Net: Â£${(parseFloat(form.amount_gross) / 1.05).toFixed(2)} Â· VAT: Â£${(parseFloat(form.amount_gross) - parseFloat(form.amount_gross) / 1.05).toFixed(2)}`
                      }
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Status */}
            <div style={s.fieldGroup}>
              <label style={s.label}>
                Status
                <Tooltip text="Draft = not yet finalised. Confirmed = verified and ready for submission." />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['DRAFT', 'CONFIRMED'] as const).map(st => (
                  <button key={st} style={{
                    flex: 1, padding: '8px', fontSize: 12, fontWeight: 600,
                    borderRadius: 8, border: `2px solid ${form.status === st ? '#01D98D' : '#E5E7EB'}`,
                    background: form.status === st ? '#E8F8F2' : '#fff',
                    color: form.status === st ? '#0A2E1E' : '#9CA3AF',
                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  }}
                    onClick={() => setForm(f => ({ ...f, status: st }))}>
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div style={s.fieldGroup}>
              <label style={s.label}>Notes (optional)</label>
              <input style={s.input} type="text" placeholder="Any additional notes"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? 'Savingâ€¦' : editingId ? 'Update Transaction' : 'Add Transaction'}
            </button>
            <button style={s.cancelBtn} onClick={() => { setShowModal(false); setForm(emptyForm); setEditingId(null); }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}




