import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const stripe = getStripe()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { priceId, userId, userEmail } = await req.json()

  if (!priceId || !userId || !userEmail) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('stripe_customers')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single()

  let customerId = existing?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({ email: userEmail })
    customerId = customer.id
    await supabase.from('stripe_customers').insert({
      user_id: userId,
      stripe_customer_id: customerId,
    })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: baseUrl + '/dashboard?success=true',
    cancel_url: baseUrl + '/pricing?cancelled=true',
    metadata: { userId },
  })

  return NextResponse.json({ url: session.url })
}