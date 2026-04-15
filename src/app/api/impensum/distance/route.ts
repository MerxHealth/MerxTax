import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { from, to } = await request.json();

    if (!to) {
      return NextResponse.json({ error: 'Destination required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      // Fallback: estimate using Claude if no Maps key
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-5',
          max_tokens: 100,
          messages: [{
            role: 'user',
            content: `Estimate the driving distance in miles from coordinates ${from} to "${to}" in the UK. Reply with JSON only: {"miles": number, "fromName": "string"}. Round to nearest mile. Use typical UK road distances.`,
          }],
        }),
      });
      const json = await res.json();
      const raw = json.content?.[0]?.text?.replace(/```json|```/g, '').trim();
      const data = JSON.parse(raw);
      return NextResponse.json({ success: true, ...data });
    }

    // Use Google Distance Matrix API
    const origin = encodeURIComponent(from);
    const destination = encodeURIComponent(to);
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&units=imperial&key=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'OK') {
      throw new Error('Could not calculate route');
    }

    const element = data.rows?.[0]?.elements?.[0];
    if (!element || element.status !== 'OK') {
      throw new Error('Route not found');
    }

    // Convert metres to miles
    const metres = element.distance?.value || 0;
    const miles = Math.round(metres * 0.000621371);
    const fromName = data.origin_addresses?.[0] || 'Your location';

    return NextResponse.json({ success: true, miles, fromName });
  } catch (err: any) {
    console.error('Distance API error:', err);
    return NextResponse.json({ error: err.message || 'Route calculation failed' }, { status: 500 });
  }
}
