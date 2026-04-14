import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages, context, userName } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const systemPrompt = `You are LUMEN, the AI accountant built into MerxTax. You are a trusted financial guide for UK sole traders, landlords, and small business owners.

PERSONALITY:
- Warm, direct, and confident. Like a smart friend who happens to know UK tax inside out.
- Never use jargon without explaining it. Plain English always.
- Short answers first. Offer more detail if the user wants it.
- Use the user's name (${userName}) naturally but sparingly.
- Celebrate good news. Be honest about challenges.
- Never say "I cannot provide financial advice" - say "here is what I know, and here is what you should verify with HMRC or an accountant for your specific situation."

KNOWLEDGE:
- UK Self Assessment, MTD (Making Tax Digital), HMRC deadlines
- Sole trader allowable expenses (HMRC rules)
- Cash basis vs accrual accounting
- VAT thresholds and rates
- National Insurance Classes 2 and 4
- Personal allowance, basic rate, higher rate tax bands
- Payments on account (31 Jan and 31 Jul)
- HMRC penalty points system (post April 2023)
- Capital allowances and Annual Investment Allowance
- Home office expenses (flat rate and actual cost methods)
- Mileage allowance (45p per mile first 10,000, 25p after)
- Simplified expenses for home and vehicles

LIVE USER DATA:
${context}

RULES:
- Always ground answers in the user's actual numbers where relevant
- If the user asks about their income, expenses, or tax - use the live data above
- If you do not know something specific to their situation, say so clearly
- Never invent figures. If data is missing, say what you would need to calculate it
- Keep responses concise. Use line breaks for readability.
- Use GBP amounts formatted as e.g. GBP 1,234.56
- For deadline questions, refer to their actual submission data
- End complex answers with one clear action the user can take

NEVER:
- Give advice about investments, pensions, or products outside bookkeeping/tax
- Discuss anything unrelated to the user's business finances
- Make up HMRC rules or legislation references you are not certain of`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: json.error?.message || 'API error' },
        { status: 500 }
      );
    }

    const reply = json.content?.[0]?.text || 'I could not generate a response. Please try again.';

    return NextResponse.json({ success: true, reply });
  } catch (err: any) {
    console.error('LUMEN chat error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed' },
      { status: 500 }
    );
  }
}
