import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { base64, mediaType } = await request.json();
    if (!base64 || !mediaType) return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY || '', 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-opus-4-5', max_tokens: 1000, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } }, { type: 'text', text: 'Extract receipt data and return ONLY JSON with these fields: amount_gross (decimal string), date (YYYY-MM-DD), description (merchant name), category (one of: GOODS_MATERIALS/TRAVEL/WAGES/RENT_RATES/REPAIRS/ADMIN/MARKETING/PROFESSIONAL_FEES/FINANCIAL_CHARGES/DEPRECIATION/OTHER_EXPENSE), vat_rate (NOT_REGISTERED/EXEMPT/ZERO/REDUCED/STANDARD), vat_amount (decimal string), notes (string), confidence (HIGH/MEDIUM/LOW). Today is ' + today + '. No markdown, no explanation, just JSON.' }] }] })
    });
    const json = await res.json();
    if (!res.ok) return NextResponse.json({ error: json.error?.message || 'API error' }, { status: 500 });
    const text = json.content?.[0]?.text || '';
    const parsed = JSON.parse(text.replace(/\\\json|\\\/g, '').trim());
    return NextResponse.json({ success: true, data: parsed });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}
