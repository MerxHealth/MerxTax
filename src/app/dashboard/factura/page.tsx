'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ThemeProvider } from '@/lib/ThemeContext';
import Sidebar from '@/components/Sidebar';

type InvoiceItem = { id?: string; description: string; quantity: number; unit_price: number; total: number; };
type Invoice = { id: string; invoice_number: string; client_name: string; client_email: string; client_address: string; issue_date: string; due_date: string; subtotal: number; tax_amount: number; total: number; status: string; notes: string; items?: InvoiceItem[]; };
type InvoiceTemplate = { id: string; template_name: string; client_name: string; client_email: string; client_address: string; payment_terms: number; line_items: InvoiceItem[]; notes: string; };

function fmt(n: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2 }).format(n);
}

function statusColor(s: string) {
  if (s === 'paid') return { bg: '#F0FDF8', color: '#065F46', border: '#BBF7E4' };
  if (s === 'sent') return { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' };
  if (s === 'overdue') return { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' };
  if (s === 'cancelled') return { bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' };
  return { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' };
}

function printInvoice(invoice: Invoice, businessName: string, logoUrl: string, initials: string) {
  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" style="max-height:60px;max-width:160px;object-fit:contain;" alt="logo" />`
    : `<div style="width:52px;height:52px;border-radius:10px;background:#01D98D;display:flex;align-items:center;justify-content:center;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:800;font-size:18px;color:#0A2E1E;">${initials}</div>`;

  const itemRows = (invoice.items || []).map(i => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;">${i.description}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;text-align:center;">${i.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;text-align:right;">${fmt(i.unit_price)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #E5E7EB;text-align:right;font-weight:600;">${fmt(i.total)}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><title>Invoice ${invoice.invoice_number}</title>
  <style>
    body{font-family:'Helvetica Neue',Arial,sans-serif;color:#1C1C1E;margin:0;padding:40px;}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;}
    .inv-number{font-size:13px;color:#6B7280;text-align:right;}
    .inv-number strong{display:block;font-size:20px;color:#0A2E1E;margin-bottom:2px;}
    .parties{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-bottom:36px;}
    .label{font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#9CA3AF;margin-bottom:4px;font-weight:600;}
    .value{font-size:13px;color:#1C1C1E;line-height:1.5;}
    table{width:100%;border-collapse:collapse;margin-bottom:24px;}
    th{font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#9CA3AF;padding:8px 12px;text-align:left;border-bottom:2px solid #E5E7EB;}
    th:nth-child(2){text-align:center;}th:nth-child(3),th:nth-child(4){text-align:right;}
    .totals{margin-left:auto;width:280px;}
    .total-row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#6B7280;}
    .total-final{display:flex;justify-content:space-between;padding:12px 0;font-size:16px;font-weight:800;color:#0A2E1E;border-top:2px solid #0A2E1E;margin-top:4px;}
    .status-badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;background:#F0FDF8;color:#065F46;}
    .notes{margin-top:32px;padding:16px;background:#F9FAFB;border-radius:8px;font-size:12px;color:#6B7280;line-height:1.6;}
    .footer{margin-top:48px;padding-top:16px;border-top:1px solid #E5E7EB;font-size:11px;color:#9CA3AF;text-align:center;}
    @media print{body{padding:20px;}}
  </style></head><body>
  <div class="header">
    <div>${logoHtml}<div style="font-size:13px;color:#6B7280;margin-top:8px;">${businessName}</div></div>
    <div class="inv-number"><strong>${invoice.invoice_number}</strong>INVOICE</div>
  </div>
  <div class="parties">
    <div><div class="label">Bill to</div><div class="value"><strong>${invoice.client_name}</strong><br>${invoice.client_email || ''}<br>${(invoice.client_address || '').replace(/\n/g, '<br>')}</div></div>
    <div><div class="label">Details</div><div class="value">Issue date: ${invoice.issue_date}<br>Due date: ${invoice.due_date || '—'}<br><br><span class="status-badge">${invoice.status.toUpperCase()}</span></div></div>
  </div>
  <table><thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Total</th></tr></thead><tbody>${itemRows}</tbody></table>
  <div class="totals">
    <div class="total-row"><span>Subtotal</span><span>${fmt(invoice.subtotal)}</span></div>
    ${invoice.tax_amount > 0 ? `<div class="total-row"><span>VAT</span><span>${fmt(invoice.tax_amount)}</span></div>` : ''}
    <div class="total-final"><span>Total</span><span>${fmt(invoice.total)}</span></div>
  </div>
  ${invoice.notes ? `<div class="notes"><strong>Notes:</strong> ${invoice.notes}</div>` : ''}
  <div class="footer">Generated by MerxTax · merxtax.co.uk</div>
  </body></html>`;

  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); w.print(); }
}

export default function FacturaPage() {
  const supabase = createClient();
  const [isMobile, setIsMobile] = useState(false);
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [userName, setUserName] = useState('');
  const [plan, setPlan] = useState('SOLO');
  const [netProfit, setNetProfit] = useState(0);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [taxDue, setTaxDue] = useState(0);
  const [msg, setMsg] = useState('');

  // Template save dialog state
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [pendingSaveAsDraft, setPendingSaveAsDraft] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // Form fields
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [vatRate, setVatRate] = useState(0);
  const [items, setItems] = useState<InvoiceItem[]>([{ description: '', quantity: 1, unit_price: 0, total: 0 }]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    setUserId(user.id);

    const { data: profile } = await supabase.from('profiles').select('full_name, plan, logo_url').eq('id', user.id).single();
    setUserName(profile?.full_name || '');
    setPlan(profile?.plan?.toUpperCase() || 'SOLO');
    setLogoUrl(profile?.logo_url || '');

    const { data: biz } = await supabase.from('businesses').select('name').eq('user_id', user.id).single();
    setBusinessName(biz?.name || '');

    const { data: inv } = await supabase.from('invoices').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setInvoices(inv || []);

    // Load full invoice templates (includes line items)
    const { data: tmpl } = await supabase.from('invoice_templates').select('*').eq('user_id', user.id).order('template_name');
    setTemplates((tmpl || []).map((t: any) => ({ ...t, line_items: t.line_items || [] })));

    const today = new Date();
    const y = today.getFullYear(), m = today.getMonth() + 1, d = today.getDate();
    const after = m > 4 || (m === 4 && d >= 6);
    const taxYear = after ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`;
    const { data: txData } = await supabase.from('transactions').select('type, amount_gross, status').eq('tax_year', taxYear).eq('status', 'CONFIRMED');
    const inc = (txData || []).filter((t: any) => t.type === 'INCOME').reduce((s: number, t: any) => s + Number(t.amount_gross), 0);
    const exp = (txData || []).filter((t: any) => t.type === 'EXPENSE').reduce((s: number, t: any) => s + Number(t.amount_gross), 0);
    const net = inc - exp;
    setIncome(inc); setExpenses(exp); setNetProfit(net);
    setTaxDue(Math.max(0, (Math.min(net, 50270) - 12570) * 0.2 + Math.max(0, net - 50270) * 0.4));
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const updateItem = (idx: number, field: keyof InvoiceItem, val: string | number) => {
    const updated = [...items];
    (updated[idx] as any)[field] = val;
    updated[idx].total = Number(updated[idx].quantity) * Number(updated[idx].unit_price);
    setItems(updated);
  };

  const subtotal = items.reduce((s, i) => s + (i.total || 0), 0);
  const taxAmount = subtotal * (vatRate / 100);
  const total = subtotal + taxAmount;

  const nextInvoiceNumber = () => {
    if (invoices.length === 0) return 'INV-001';
    const nums = invoices.map(i => parseInt(i.invoice_number.replace(/\D/g, '')) || 0);
    return `INV-${String(Math.max(...nums) + 1).padStart(3, '0')}`;
  };

  const initials = businessName.trim()
    ? businessName.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : userName.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'MT';

  // Load a full template — pre-fills everything including line items
  const loadTemplate = (t: InvoiceTemplate) => {
    setClientName(t.client_name);
    setClientEmail(t.client_email || '');
    setClientAddress(t.client_address || '');
    setNotes(t.notes || '');
    setIssueDate(new Date().toISOString().split('T')[0]); // always today
    setDueDate('');
    const lineItems = t.line_items && t.line_items.length > 0
      ? t.line_items.map(li => ({ description: li.description, quantity: li.quantity, unit_price: li.unit_price, total: li.quantity * li.unit_price }))
      : [{ description: '', quantity: 1, unit_price: 0, total: 0 }];
    setItems(lineItems);
    setMsg('');
  };

  const deleteTemplate = async (id: string) => {
    await supabase.from('invoice_templates').delete().eq('id', id);
    setTemplates(templates.filter(t => t.id !== id));
  };

  const resetForm = () => {
    setClientName(''); setClientEmail(''); setClientAddress('');
    setIssueDate(new Date().toISOString().split('T')[0]);
    setDueDate(''); setNotes(''); setVatRate(0);
    setItems([{ description: '', quantity: 1, unit_price: 0, total: 0 }]);
    setTemplateName('');
    setMsg('');
  };

  const handleSaveClick = (asDraft: boolean) => {
    if (!clientName.trim()) { setMsg('Client name is required.'); return; }
    if (items.some(i => !i.description.trim())) { setMsg('All line items need a description.'); return; }
    // Pre-suggest template name from client name
    setTemplateName(clientName.trim());
    setPendingSaveAsDraft(asDraft);
    setShowTemplateDialog(true);
  };

  const handleSave = async (saveTemplate: boolean) => {
    setShowTemplateDialog(false);
    setSaving(true); setMsg('');

    // Save full invoice template if requested (includes line items)
    if (saveTemplate && templateName.trim()) {
      const exists = templates.find(t => t.template_name.toLowerCase() === templateName.trim().toLowerCase());
      if (!exists) {
        await supabase.from('invoice_templates').insert({
          user_id: userId,
          template_name: templateName.trim(),
          client_name: clientName.trim(),
          client_email: clientEmail.trim(),
          client_address: clientAddress.trim(),
          payment_terms: 30,
          line_items: items.map(i => ({ description: i.description, quantity: i.quantity, unit_price: i.unit_price, total: i.total })),
          notes: notes.trim(),
        });
      }
    }

    const invNumber = nextInvoiceNumber();
    const { data: inv, error } = await supabase.from('invoices').insert({
      user_id: userId, invoice_number: invNumber,
      client_name: clientName.trim(), client_email: clientEmail.trim(), client_address: clientAddress.trim(),
      issue_date: issueDate, due_date: dueDate || null,
      subtotal, tax_amount: taxAmount, total,
      status: pendingSaveAsDraft ? 'draft' : 'sent',
      notes: notes.trim(),
    }).select().single();

    if (error || !inv) { setMsg('Failed to save invoice.'); setSaving(false); return; }

    await supabase.from('invoice_items').insert(
      items.map(i => ({ invoice_id: inv.id, description: i.description, quantity: i.quantity, unit_price: i.unit_price, total: i.total }))
    );

    await loadData(); setView('list'); resetForm(); setSaving(false);
  };

  const handleMarkPaid = async (invoice: Invoice) => {
    await supabase.from('invoices').update({ status: 'paid' }).eq('id', invoice.id);
    const today = new Date();
    const y = today.getFullYear(), mo = today.getMonth() + 1, d = today.getDate();
    const after = mo > 4 || (mo === 4 && d >= 6);
    const taxYear = after ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`;
    const n = mo * 100 + d;
    let quarter = 'Q4';
    if (n >= 406 && n <= 705) quarter = 'Q1';
    else if (n >= 706 && n <= 1005) quarter = 'Q2';
    else if (n >= 1006 || n <= 105) quarter = 'Q3';
    await supabase.from('transactions').insert({
      user_id: userId, type: 'INCOME',
      description: `Invoice ${invoice.invoice_number} — ${invoice.client_name}`,
      amount_gross: invoice.total, status: 'CONFIRMED',
      tax_year: taxYear, quarter, date: today.toISOString().split('T')[0],
    });
    await loadData();
    setSelected(prev => prev ? { ...prev, status: 'paid' } : null);
  };

  const openDetail = async (inv: Invoice) => {
    const { data: invItems } = await supabase.from('invoice_items').select('*').eq('invoice_id', inv.id);
    setSelected({ ...inv, items: invItems || [] }); setView('detail');
  };

  const inputStyle = { width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid #E5E7EB', borderRadius: 10, outline: 'none', fontFamily: "'DM Sans', sans-serif", color: '#1C1C1E', background: '#fff' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 };

  return (
    <ThemeProvider>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#EEF1F4', fontFamily: "'DM Sans', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Montserrat:wght@600;700;800&display=swap'); * { box-sizing: border-box; }`}</style>

        {/* ── Template Save Dialog ── */}
        {showTemplateDialog && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: '32px', maxWidth: 460, width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F0FDF8', border: '1px solid #BBF7E4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>📋</div>
                <div>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: '#0A2E1E', marginBottom: 6 }}>Save as a template?</div>
                  <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>Save this invoice as a template so you can pre-fill it instantly next time — client details, line items and all.</div>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Template name</label>
                <input
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  placeholder={`e.g. ${clientName} — Monthly`}
                  style={inputStyle}
                />
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>This is just a label so you can find it quickly next time.</div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => handleSave(true)}
                  disabled={!templateName.trim()}
                  style={{ flex: 1, fontSize: 14, padding: '11px', borderRadius: 10, background: templateName.trim() ? '#01D98D' : '#E5E7EB', color: templateName.trim() ? '#0A2E1E' : '#9CA3AF', border: 'none', fontWeight: 700, cursor: templateName.trim() ? 'pointer' : 'not-allowed' }}
                >
                  Save template &amp; invoice
                </button>
                <button
                  onClick={() => handleSave(false)}
                  style={{ flex: 1, fontSize: 14, padding: '11px', borderRadius: 10, background: '#F3F4F6', color: '#6B7280', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                >
                  Just save invoice
                </button>
              </div>
            </div>
          </div>
        )}

        <Sidebar active="FACTURA" userName={userName} plan={plan} netProfit={netProfit} income={income} expenses={expenses} taxDue={taxDue} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

          {/* Top bar */}
          {!isMobile && (
            <div style={{ background: '#fff', borderBottom: '0.5px solid #E5E7EB', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 15, color: '#0A2E1E' }}>
                FACTURA <span style={{ color: '#01D98D' }}>|</span> {view === 'create' ? 'NEW INVOICE' : view === 'detail' ? 'INVOICE' : 'INVOICES'}
              </div>
              {view === 'list' && <button onClick={() => { resetForm(); setView('create'); }} style={{ fontSize: 13, padding: '8px 18px', borderRadius: 9, background: '#01D98D', color: '#0A2E1E', border: 'none', fontWeight: 700, cursor: 'pointer' }}>+ New invoice</button>}
              {view !== 'list' && <button onClick={() => setView('list')} style={{ fontSize: 13, padding: '8px 18px', borderRadius: 9, background: '#F3F4F6', color: '#0A2E1E', border: 'none', fontWeight: 600, cursor: 'pointer' }}>← Back</button>}
            </div>
          )}

          <div style={{ flex: 1, padding: isMobile ? '12px 14px 24px' : '24px 28px', overflowY: 'auto' }}>

            {isMobile && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 16, color: '#0A2E1E' }}>
                  FACTURA <span style={{ color: '#01D98D' }}>|</span> {view === 'create' ? 'New Invoice' : view === 'detail' ? 'Invoice' : 'Invoices'}
                </div>
                {view === 'list'
                  ? <button onClick={() => { resetForm(); setView('create'); }} style={{ fontSize: 12, padding: '7px 14px', borderRadius: 9, background: '#01D98D', color: '#0A2E1E', border: 'none', fontWeight: 700, cursor: 'pointer' }}>+ New</button>
                  : <button onClick={() => setView('list')} style={{ fontSize: 12, padding: '7px 14px', borderRadius: 9, background: '#F3F4F6', color: '#0A2E1E', border: 'none', fontWeight: 600, cursor: 'pointer' }}>← Back</button>
                }
              </div>
            )}

            {/* ── LIST ── */}
            {view === 'list' && (
              loading
                ? <div style={{ color: '#9CA3AF', fontSize: 14 }}>Loading invoices...</div>
                : invoices.length === 0
                  ? (
                    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '48px 24px', textAlign: 'center' }}>
                      <div style={{ fontSize: 32, marginBottom: 12 }}>🧾</div>
                      <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: '#0A2E1E', marginBottom: 8 }}>No invoices yet</div>
                      <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>Create your first invoice and get paid faster.</div>
                      <button onClick={() => { resetForm(); setView('create'); }} style={{ fontSize: 13, padding: '10px 24px', borderRadius: 10, background: '#01D98D', color: '#0A2E1E', border: 'none', fontWeight: 700, cursor: 'pointer' }}>+ Create invoice</button>
                    </div>
                  )
                  : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {invoices.map(inv => {
                        const sc = statusColor(inv.status);
                        return (
                          <div key={inv.id} onClick={() => openDetail(inv)} style={{ background: '#fff', border: '0.5px solid #E5E7EB', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 12 }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 14, color: '#0A2E1E', marginBottom: 2 }}>{inv.invoice_number}</div>
                              <div style={{ fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inv.client_name}</div>
                              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{inv.issue_date}</div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 16, color: '#0A2E1E', marginBottom: 6 }}>{fmt(inv.total)}</div>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{inv.status.toUpperCase()}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
            )}

            {/* ── CREATE ── */}
            {view === 'create' && (
              <div style={{ maxWidth: 720, margin: '0 auto' }}>
                {msg && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#991B1B', marginBottom: 16 }}>{msg}</div>}

                {/* Client details card */}
                <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '24px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 15, color: '#0A2E1E' }}>Client Details</div>
                    {templates.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#6B7280' }}>Load saved client:</span>
                        <select
                          onChange={e => { const t = templates.find(t => t.id === e.target.value); if (t) loadTemplate(t); e.target.value = ''; }}
                          style={{ fontSize: 13, padding: '7px 12px', border: '1px solid #E5E7EB', borderRadius: 9, outline: 'none', color: '#0A2E1E', background: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                        >
                          <option value="">— select client —</option>
                          {templates.map(t => <option key={t.id} value={t.id}>{t.template_name}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div><label style={labelStyle}>Client Name *</label><input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Smith Ltd" style={inputStyle} /></div>
                    <div><label style={labelStyle}>Client Email</label><input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="accounts@smithltd.com" style={inputStyle} /></div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Client Address</label>
                    <textarea value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder={"123 High Street\nLondon\nEC1A 1BB"} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                    <div><label style={labelStyle}>Issue Date</label><input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Due Date</label><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inputStyle} /></div>
                  </div>
                </div>

                {/* Line items card */}
                <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '24px', marginBottom: 16 }}>
                  <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 15, color: '#0A2E1E', marginBottom: 20 }}>Line Items</div>
                  {items.map((item, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 1fr 1fr 1fr auto', gap: 10, marginBottom: 12, alignItems: 'end' }}>
                      <div>{idx === 0 && <label style={labelStyle}>Description</label>}<input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="Service or product" style={inputStyle} /></div>
                      <div>{idx === 0 && <label style={labelStyle}>Qty</label>}<input type="number" min="0" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)} style={inputStyle} /></div>
                      <div>{idx === 0 && <label style={labelStyle}>Unit Price</label>}<input type="number" min="0" step="0.01" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)} style={inputStyle} /></div>
                      <div>{idx === 0 && <label style={labelStyle}>Total</label>}<input value={fmt(item.total)} disabled style={{ ...inputStyle, background: '#F9FAFB', color: '#6B7280', fontWeight: 700 }} /></div>
                      <div style={{ paddingBottom: 2 }}>
                        {items.length > 1 && <button onClick={() => setItems(items.filter((_, i) => i !== idx))} style={{ padding: '10px 12px', background: '#FEF2F2', color: '#EF4444', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>✕</button>}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setItems([...items, { description: '', quantity: 1, unit_price: 0, total: 0 }])} style={{ fontSize: 13, padding: '8px 16px', borderRadius: 9, background: '#F0FDF8', color: '#065F46', border: '1px solid #BBF7E4', cursor: 'pointer', fontWeight: 600, marginTop: 4 }}>+ Add line</button>
                  <div style={{ marginTop: 24, borderTop: '1px solid #E5E7EB', paddingTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>VAT %</span>
                      <input type="number" min="0" max="100" value={vatRate} onChange={e => setVatRate(parseFloat(e.target.value) || 0)} style={{ width: 80, padding: '7px 10px', fontSize: 13, border: '1px solid #E5E7EB', borderRadius: 8, outline: 'none', textAlign: 'right' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <div style={{ fontSize: 13, color: '#6B7280' }}>Subtotal: <strong>{fmt(subtotal)}</strong></div>
                      {vatRate > 0 && <div style={{ fontSize: 13, color: '#6B7280' }}>VAT ({vatRate}%): <strong>{fmt(taxAmount)}</strong></div>}
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#0A2E1E', fontFamily: "'Montserrat', sans-serif" }}>Total: {fmt(total)}</div>
                    </div>
                  </div>
                </div>

                {/* Notes card */}
                <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '24px', marginBottom: 24 }}>
                  <label style={labelStyle}>Notes (optional)</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Payment terms, bank details, thank you message..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button onClick={() => handleSaveClick(false)} disabled={saving} style={{ flex: 1, fontSize: 14, padding: '12px 24px', borderRadius: 10, background: saving ? '#a3f0d4' : '#01D98D', color: '#0A2E1E', border: 'none', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                    {saving ? 'Saving...' : 'Save & Mark as Sent'}
                  </button>
                  <button onClick={() => handleSaveClick(true)} disabled={saving} style={{ fontSize: 14, padding: '12px 24px', borderRadius: 10, background: '#F3F4F6', color: '#0A2E1E', border: 'none', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                    Save as Draft
                  </button>
                </div>
              </div>
            )}

            {/* ── DETAIL ── */}
            {view === 'detail' && selected && (
              <div style={{ maxWidth: 720, margin: '0 auto' }}>
                <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '20px 24px', marginBottom: 16, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 18, color: '#0A2E1E' }}>{selected.invoice_number}</div>
                    <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{selected.client_name} · {selected.issue_date}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button onClick={() => printInvoice(selected, businessName, logoUrl, initials)} style={{ fontSize: 12, padding: '8px 16px', borderRadius: 9, background: '#F3F4F6', color: '#0A2E1E', border: 'none', fontWeight: 600, cursor: 'pointer' }}>🖨 Print / PDF</button>
                    {selected.status !== 'paid' && selected.status !== 'cancelled' && (
                      <button onClick={() => handleMarkPaid(selected)} style={{ fontSize: 12, padding: '8px 16px', borderRadius: 9, background: '#01D98D', color: '#0A2E1E', border: 'none', fontWeight: 700, cursor: 'pointer' }}>✓ Mark as Paid</button>
                    )}
                    {selected.status === 'paid' && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '8px 16px', borderRadius: 9, background: '#F0FDF8', color: '#065F46', border: '1px solid #BBF7E4' }}>✓ PAID — added to REDITUS</span>
                    )}
                  </div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '24px', marginBottom: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 24, marginBottom: 24 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Bill to</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0A2E1E' }}>{selected.client_name}</div>
                      {selected.client_email && <div style={{ fontSize: 13, color: '#6B7280' }}>{selected.client_email}</div>}
                      {selected.client_address && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4, whiteSpace: 'pre-line' }}>{selected.client_address}</div>}
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Details</div>
                      <div style={{ fontSize: 13, color: '#6B7280' }}>Issue date: <strong style={{ color: '#0A2E1E' }}>{selected.issue_date}</strong></div>
                      {selected.due_date && <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Due date: <strong style={{ color: '#0A2E1E' }}>{selected.due_date}</strong></div>}
                    </div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                          {['Description', 'Qty', 'Unit Price', 'Total'].map(h => (
                            <th key={h} style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, padding: '8px 12px', textAlign: h === 'Description' ? 'left' : 'right' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(selected.items || []).map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                            <td style={{ padding: '10px 12px', fontSize: 13, color: '#0A2E1E' }}>{item.description}</td>
                            <td style={{ padding: '10px 12px', fontSize: 13, color: '#6B7280', textAlign: 'right' }}>{item.quantity}</td>
                            <td style={{ padding: '10px 12px', fontSize: 13, color: '#6B7280', textAlign: 'right' }}>{fmt(item.unit_price)}</td>
                            <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: '#0A2E1E', textAlign: 'right' }}>{fmt(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <div style={{ fontSize: 13, color: '#6B7280' }}>Subtotal: <strong>{fmt(selected.subtotal)}</strong></div>
                    {selected.tax_amount > 0 && <div style={{ fontSize: 13, color: '#6B7280' }}>VAT: <strong>{fmt(selected.tax_amount)}</strong></div>}
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#0A2E1E', fontFamily: "'Montserrat', sans-serif", marginTop: 4 }}>{fmt(selected.total)}</div>
                  </div>
                  {selected.notes && <div style={{ marginTop: 20, padding: '14px 16px', background: '#F9FAFB', borderRadius: 10, fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}><strong>Notes:</strong> {selected.notes}</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
