'use client';

import { useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

type ExtractedData = {
  amount_gross: string;
  date: string;
  description: string;
  category: string;
  vat_rate: string;
  vat_amount: string;
  notes: string;
  confidence: string;
};

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const HMRC_CATEGORIES = [
  { value: 'TRADING_INCOME',    label: 'Trading income' },
  { value: 'PROPERTY_INCOME',   label: 'Property / rental income' },
  { value: 'OTHER_INCOME',      label: 'Other income' },
  { value: 'GOODS_MATERIALS',   label: 'Cost of goods / materials' },
  { value: 'TRAVEL',            label: 'Car, van and travel' },
  { value: 'WAGES',             label: 'Wages and salaries' },
  { value: 'RENT_RATES',        label: 'Rent and rates' },
  { value: 'REPAIRS',           label: 'Repairs and maintenance' },
  { value: 'ADMIN',             label: 'General admin' },
  { value: 'MARKETING',         label: 'Advertising and marketing' },
  { value: 'PROFESSIONAL_FEES', label: 'Professional fees' },
  { value: 'FINANCIAL_CHARGES', label: 'Financial charges' },
  { value: 'DEPRECIATION',      label: 'Depreciation / capital allowances' },
  { value: 'OTHER_EXPENSE',     label: 'Other expense' },
];

const VAT_RATES = [
  { value: 'NOT_REGISTERED', label: 'Not VAT Registered' },
  { value: 'EXEMPT',         label: 'Exempt' },
  { value: 'ZERO',           label: '0% Zero Rated' },
  { value: 'REDUCED',        label: '5% Reduced Rate' },
  { value: 'STANDARD',       label: '20% Standard Rate' },
];

function getTaxYear(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const after = m > 4 || (m === 4 && d >= 6);
  return after ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`;
}

function getHMRCQuarter(date: Date): 'Q1' | 'Q2' | 'Q3' | 'Q4' {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const n = m * 100 + d;
  if (n >= 406 && n <= 705) return 'Q1';
  if (n >= 706 && n <= 1005) return 'Q2';
  if (n >= 1006 || n <= 105) return 'Q3';
  return 'Q4';
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export default function ImpensumPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState('');
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [dragging, setDragging] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState('');
  const [transactionType, setTransactionType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');

  // Form state (populated after extraction)
  const [form, setForm] = useState<ExtractedData>({
    amount_gross: '',
    date: todayISO(),
    description: '',
    category: '',
    vat_rate: 'NOT_REGISTERED',
    vat_amount: '0',
    notes: '',
    confidence: '',
  });

  function handleFile(file: File) {
    setImageFile(file);
    setExtracted(null);
    setSaveStatus('idle');
    setSaveError('');
    setReadError('');
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, []);

  async function readReceipt() {
    if (!imagePreview) return;
    setReading(true);
    setReadError('');

    try {
      const base64 = imagePreview.split(',')[1];
      const mediaType = imagePreview.split(';')[0].split(':')[1];

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: base64 }
              },
              {
                type: 'text',
                text: `You are a UK bookkeeping assistant. Extract data from this receipt image and return ONLY a JSON object with no markdown, no preamble, no explanation.

Return exactly this structure:
{
  "amount_gross": "the total amount as a decimal string e.g. 24.50",
  "date": "date in YYYY-MM-DD format, use today if unclear",
  "description": "merchant or supplier name, keep it short",
  "category": "one of: GOODS_MATERIALS, TRAVEL, WAGES, RENT_RATES, REPAIRS, ADMIN, MARKETING, PROFESSIONAL_FEES, FINANCIAL_CHARGES, DEPRECIATION, OTHER_EXPENSE, TRADING_INCOME, PROPERTY_INCOME, OTHER_INCOME",
  "vat_rate": "one of: NOT_REGISTERED, EXEMPT, ZERO, REDUCED, STANDARD - infer from receipt if possible",
  "vat_amount": "VAT amount as decimal string or 0 if not shown",
  "notes": "any other useful info from the receipt, or empty string",
  "confidence": "HIGH, MEDIUM, or LOW based on image quality and data clarity"
}

Rules:
- For category, reason from merchant type. Costa/Starbucks = MARKETING, Screwfix/B&Q = GOODS_MATERIALS or REPAIRS, Tesco/Sainsburys = GOODS_MATERIALS, fuel station = TRAVEL, restaurant with clients = MARKETING, office supplies = ADMIN
- If the receipt is clearly a sales invoice to the business = TRADING_INCOME
- Return null values as empty strings, never omit fields
- Today's date is ${todayISO()}`
              }
            ]
          }]
        })
      });

      const data = await response.json();
      const text = data.content?.[0]?.text ?? '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed: ExtractedData = JSON.parse(clean);

      setExtracted(parsed);
      setForm(parsed);
      setTransactionType(
        ['TRADING_INCOME','PROPERTY_INCOME','OTHER_INCOME'].includes(parsed.category)
          ? 'INCOME'
          : 'EXPENSE'
      );
    } catch (err) {
      setReadError('Could not read this receipt. Please check the image is clear and try again, or enter the details manually.');
    }

    setReading(false);
  }

  async function saveTransaction() {
    if (!form.amount_gross || !form.category || !form.description) {
      setSaveError('Amount, category and description are required.');
      return;
    }
    setSaveStatus('saving');
    setSaveError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaveError('Not authenticated.'); setSaveStatus('error'); return; }

    const dateObj = new Date(form.date || todayISO());
    const gross = parseFloat(form.amount_gross);
    let net = gross;
    let vat = parseFloat(form.vat_amount || '0');
    if (form.vat_rate === 'STANDARD' && vat === 0) { net = gross / 1.2; vat = gross - net; }
    else if (form.vat_rate === 'REDUCED' && vat === 0) { net = gross / 1.05; vat = gross - net; }

    const row = {
      user_id: user.id,
      date: form.date || todayISO(),
      type: transactionType,
      amount_gross: gross,
      amount_net: parseFloat(net.toFixed(2)),
      vat_amount: parseFloat(vat.toFixed(2)),
      vat_rate: form.vat_rate,
      description: form.description,
      category: form.category,
      income_source: transactionType === 'INCOME' ? 'TRADING' : null,
      accounting_method: 'CASH',
      tax_year: getTaxYear(dateObj),
      quarter: getHMRCQuarter(dateObj),
      status: 'CONFIRMED',
      notes: form.notes || null,
    };

    const { error } = await supabase.from('transactions').insert(row);
    if (error) { setSaveError(error.message); setSaveStatus('error'); return; }
    setSaveStatus('saved');
  }

  function scanAnother() {
    setImageFile(null);
    setImagePreview(null);
    setExtracted(null);
    setSaveStatus('idle');
    setSaveError('');
    setReadError('');
    setForm({ amount_gross: '', date: todayISO(), description: '', category: '', vat_rate: 'NOT_REGISTERED', vat_amount: '0', notes: '', confidence: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', fontSize: 14,
    border: '1px solid #E5E7EB', borderRadius: 10, background: '#fff',
    fontFamily: "'DM Sans', sans-serif", color: '#1C1C1E', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: "'DM Sans', sans-serif", color: '#1C1C1E' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Montserrat:wght@600;700;800&display=swap');
        * { box-sizing: border-box; }
        .upload-zone:hover { border-color: #01D98D !important; background: #F0FDF8 !important; }
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
            IMPENSUM <span style={{ color: '#01D98D' }}>|</span> Receipt Capture
          </span>
        </div>
        <button onClick={() => { window.location.href = '/dashboard/reditus'; }}
          style={{ fontSize: 12, color: '#01D98D', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none', fontFamily: "'DM Sans', sans-serif" }}>
          View all transactions
        </button>
      </header>

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px 80px' }}>

        {/* Hero text */}
        {!imagePreview && (
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 28, color: '#0A2E1E', marginBottom: 8 }}>
              No more receipt piles.
            </div>
            <div style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.6 }}>
              Drop your receipt below. AI reads it. You confirm it. Done.<br />
              Every expense captured the moment it happens.
            </div>
          </div>
        )}

        {/* Upload zone */}
        {!imagePreview && (
          <div
            ref={dropRef}
            className="upload-zone"
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? '#01D98D' : '#D1D5DB'}`,
              borderRadius: 16, padding: '56px 32px',
              textAlign: 'center', cursor: 'pointer',
              background: dragging ? '#F0FDF8' : '#fff',
              transition: 'all 0.2s', marginBottom: 24,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="56" height="56" rx="14" fill="#F0FDF8"/>
                <path d="M28 36V24M28 24L23 29M28 24L33 29" stroke="#01D98D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20 38H36" stroke="#01D98D" strokeWidth="2.5" strokeLinecap="round"/>
                <rect x="16" y="16" width="24" height="28" rx="3" stroke="#0A2E1E" strokeWidth="1.5" strokeDasharray="3 2"/>
              </svg>
            </div>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 18, color: '#0A2E1E', marginBottom: 6 }}>
              Drop your receipt here
            </div>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>
              or tap to choose a photo from your device
            </div>
            <div style={{ display: 'inline-block', padding: '10px 24px', background: '#01D98D', color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: "'Montserrat', sans-serif" }}>
              Choose Photo
            </div>
            <div style={{ fontSize: 11, color: '#D1D5DB', marginTop: 16 }}>
              JPG, PNG, PDF supported
            </div>
            <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleFileInput} style={{ display: 'none' }} />
          </div>
        )}

        {/* Phase roadmap pills */}
        {!imagePreview && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 40 }}>
            {[
              { label: 'Web Upload', active: true },
              { label: 'Email Forward', active: false },
              { label: 'Mobile Camera', active: false },
              { label: 'WhatsApp', active: false },
              { label: 'Bank Feed', active: false },
              { label: 'Voice', active: false },
            ].map(p => (
              <span key={p.label} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: p.active ? '#E8F8F2' : '#F3F4F6', color: p.active ? '#01D98D' : '#9CA3AF', border: `1px solid ${p.active ? '#01D98D' : 'transparent'}` }}>
                {p.active ? 'Live: ' : 'Coming: '}{p.label}
              </span>
            ))}
          </div>
        )}

        {/* Image preview + read button */}
        {imagePreview && saveStatus !== 'saved' && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: 24, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: '#0A2E1E' }}>
                {extracted ? 'Receipt read' : 'Receipt ready'}
              </div>
              <button onClick={scanAnother}
                style={{ fontSize: 12, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                Use different photo
              </button>
            </div>
            <img src={imagePreview} alt="Receipt" style={{ width: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 10, background: '#F9FAFB', marginBottom: 16 }} />

            {!extracted && !reading && (
              <button onClick={readReceipt}
                style={{ width: '100%', padding: '14px', background: '#01D98D', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}>
                Read Receipt with AI
              </button>
            )}

            {reading && (
              <div style={{ textAlign: 'center', padding: '16px', background: '#F0FDF8', borderRadius: 12 }}>
                <div style={{ fontWeight: 600, color: '#065F46', fontSize: 14, marginBottom: 4 }}>Reading your receipt...</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>AI is extracting the details</div>
              </div>
            )}

            {readError && (
              <div style={{ background: '#FEF2F2', borderRadius: 10, padding: '12px 16px', color: '#991B1B', fontSize: 13, marginTop: 8 }}>
                {readError}
              </div>
            )}
          </div>
        )}

        {/* Extracted + editable form */}
        {extracted && saveStatus !== 'saved' && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: 24 }}>

            {/* Confidence banner */}
            <div style={{ background: extracted.confidence === 'HIGH' ? '#F0FDF8' : extracted.confidence === 'MEDIUM' ? '#FFFBEB' : '#FEF2F2', border: `1px solid ${extracted.confidence === 'HIGH' ? '#BBF7E4' : extracted.confidence === 'MEDIUM' ? '#FDE68A' : '#FECACA'}`, borderRadius: 10, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: extracted.confidence === 'HIGH' ? '#01D98D' : extracted.confidence === 'MEDIUM' ? '#F59E0B' : '#EF4444', flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: '#374151' }}>
                {extracted.confidence === 'HIGH'
                  ? 'Receipt read clearly. Check the details below and confirm.'
                  : extracted.confidence === 'MEDIUM'
                  ? 'Most details extracted. Please check the amounts carefully.'
                  : 'Image quality is low. Please review all fields before saving.'}
              </div>
            </div>

            {/* Type toggle */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Transaction Type</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setTransactionType('EXPENSE')}
                  style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 700, borderRadius: 10, border: `2px solid ${transactionType === 'EXPENSE' ? '#EF4444' : '#E5E7EB'}`, background: transactionType === 'EXPENSE' ? '#FEF2F2' : '#fff', color: transactionType === 'EXPENSE' ? '#EF4444' : '#9CA3AF', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  Expense
                </button>
                <button onClick={() => setTransactionType('INCOME')}
                  style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 700, borderRadius: 10, border: `2px solid ${transactionType === 'INCOME' ? '#01D98D' : '#E5E7EB'}`, background: transactionType === 'INCOME' ? '#E8F8F2' : '#fff', color: transactionType === 'INCOME' ? '#01D98D' : '#9CA3AF', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  Income
                </button>
              </div>
            </div>

            {/* Amount */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Amount</label>
              <input type="number" step="0.01" min="0" value={form.amount_gross}
                onChange={e => setForm(f => ({ ...f, amount_gross: e.target.value }))}
                style={{ ...inputStyle, fontSize: 24, fontWeight: 700, fontFamily: "'Montserrat', sans-serif" }} />
            </div>

            {/* Date */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Date</label>
              <input type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                style={inputStyle} />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Merchant / Description</label>
              <input type="text" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                style={inputStyle} />
            </div>

            {/* Category */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>HMRC Category</label>
              <select value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                style={inputStyle}>
                <option value="">Select category</option>
                <optgroup label="Income">
                  {HMRC_CATEGORIES.filter(c => c.value.includes('INCOME')).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </optgroup>
                <optgroup label="Expenses">
                  {HMRC_CATEGORIES.filter(c => !c.value.includes('INCOME')).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </optgroup>
              </select>
            </div>

            {/* VAT */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>VAT</label>
              <select value={form.vat_rate}
                onChange={e => setForm(f => ({ ...f, vat_rate: e.target.value }))}
                style={inputStyle}>
                {VAT_RATES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Notes</label>
              <input type="text" value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any additional notes"
                style={inputStyle} />
            </div>

            {saveError && (
              <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '10px 14px', color: '#991B1B', fontSize: 13, marginBottom: 12 }}>
                {saveError}
              </div>
            )}

            <button onClick={saveTransaction} disabled={saveStatus === 'saving'}
              style={{ width: '100%', padding: '14px', background: '#01D98D', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer', fontFamily: "'Montserrat', sans-serif", opacity: saveStatus === 'saving' ? 0.7 : 1 }}>
              {saveStatus === 'saving' ? 'Saving...' : 'Save to My Accounts'}
            </button>
          </div>
        )}

        {/* Success state */}
        {saveStatus === 'saved' && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E8F8F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M8 16L13 21L24 11" stroke="#01D98D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 22, color: '#0A2E1E', marginBottom: 8 }}>
              Saved. Your accounts are up to date.
            </div>
            <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 8 }}>
              {form.description} - {form.amount_gross ? `GBP ${parseFloat(form.amount_gross).toFixed(2)}` : ''} has been added to REDITUS.
            </div>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 32 }}>
              You are running your business properly. That is what this is about.
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={scanAnother}
                style={{ padding: '12px 28px', background: '#01D98D', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}>
                Scan another receipt
              </button>
              <button onClick={() => { window.location.href = '/dashboard/reditus'; }}
                style={{ padding: '12px 28px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                View transactions
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
