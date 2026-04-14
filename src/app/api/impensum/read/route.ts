import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { base64, mediaType } = await request.json();
    if (!base64 || !mediaType) { return NextResponse.json({ error: 'Missing image data' }, { status: 400 }); }
    const today = new Date().toISOString().split('T')[0];
    const message = await client.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } }, { type: 'text', text: 'You are a UK bookkeeping assistant. Extract data from this receipt and return ONLY JSON. Structure: {amount_gross, date (YYYY-MM-DD), description, category (GOODS_MATERIALS/TRAVEL/WAGES/RENT_RATES/REPAIRS/ADMIN/MARKETING/PROFESSIONAL_FEES/FINANCIAL_CHARGES/DEPRECIATION/OTHER_EXPENSE/TRADING_INCOME/PROPERTY_INCOME/OTHER_INCOME), vat_rate (NOT_REGISTERED/EXEMPT/ZERO/REDUCED/STANDARD), vat_amount, notes, confidence (HIGH/MEDIUM/LOW)}. Today is ' + today }] }] });
    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const clean = text.replace(/\\\json|\\\/g, '').trim();
    const parsed = JSON.parse(clean);
    return NextResponse.json({ success: true, data: parsed });
  } catch (error: any) { console.error('IMPENSUM error:', error); return NextResponse.json({ error: error.message || 'Failed to read receipt' }, { status: 500 }); }
}
