'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'

const PLANS = [
  {
    key: 'SOLO',
    name: 'SOLO',
    desc: '1 income source · MTD Income Tax · LUMEN AI',
    monthly: { price: '£14.99', priceId: process.env.NEXT_PUBLIC_PRICE_SOLO_MONTHLY },
    annual:  { price: '£149',   priceId: process.env.NEXT_PUBLIC_PRICE_SOLO_ANNUAL },
  },
  {
    key: 'PRO',
    name: 'PRO',
    desc: 'Multiple income sources · Open Banking · Priority LUMEN AI',
    monthly: { price: '£24.99', priceId: process.env.NEXT_PUBLIC_PRICE_PRO_MONTHLY },
    annual:  { price: '£249',   priceId: process.env.NEXT_PUBLIC_PRICE_PRO_ANNUAL },
    highlight: true,
  },
  {
    key: 'AGENT',
    name: 'AGENT',
    desc: 'Multi-client management · FORUM access · White-label ready',
    monthly: { price: '£59.99', priceId: process.env.NEXT_PUBLIC_PRICE_AGENT_MONTHLY },
    annual:  { price: '£599',   priceId: process.env.NEXT_PUBLIC_PRICE_AGENT_ANNUAL },
  },
]

const STATS = [
  { value: '5M+',  label: 'UK self-employed affected by MTD' },
  { value: '£100', label: 'Minimum fine per missed quarter' },
  { value: '3',    label: 'Languages supported from day one' },
  { value: '24',   label: 'HMRC MTD APIs integrated' },
]

export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (priceId: string, planKey: string) => {
    setLoading(planKey)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login?redirect=/pricing'; return }
      const res = await fetch('/api/Stripe/Checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, userId: user.id, userEmail: user.email }),
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (e) { console.error('Checkout error:', e) }
    finally { setLoading(null) }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#fff', fontFamily: 'DM Sans, sans-serif' }}>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 20px 28px' }}>
        <Logo height={80} />
      </div>

      <div style={{ background: 'linear-gradient(135deg, #01D98D 0%, #01D98D 30%, #0ACAAF 60%, #0EBDCA 100%)', padding: '20px 40px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {STATS.map((s, i) => (
          <div key={s.value} style={{ textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(10,46,30,0.15)' : 'none', padding: '0 16px' }}>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 28, color: '#0A2E1E', lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'rgba(10,46,30,0.65)', fontWeight: 500, lineHeight: 1.4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 960, textAlign: 'center', margin: '0 auto', padding: '48px 20px' }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, color: '#0A2E1E', marginBottom: 8, fontFamily: 'Montserrat, sans-serif' }}>
          Simple, transparent pricing
        </h1>
        <p style={{ color: '#555', fontSize: 16, marginBottom: 32 }}>
          Accountants charge £300–£1,200/year. MerxTax is up to 85% cheaper — and never leaves your side.
        </p>

        <div style={{ display: 'inline-flex', background: '#F9FAFB', borderRadius: 8, padding: 4, marginBottom: 48 }}>
          {(['monthly', 'annual'] as const).map(b => (
            <button key={b} onClick={() => setBilling(b)} style={{
              padding: '8px 24px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
              background: billing === b ? '#01D98D' : 'transparent', color: billing === b ? '#fff' : '#555',
            }}>
              {b === 'monthly' ? 'Monthly' : 'Annual (2 months free)'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          {PLANS.map(plan => {
            const tier = billing === 'monthly' ? plan.monthly : plan.annual
            return (
              <div key={plan.key} style={{
                width: 280, padding: 32, borderRadius: 16, textAlign: 'left',
                border: plan.highlight ? '2px solid #01D98D' : '1px solid #E5E7EB',
                background: '#fff', position: 'relative',
              }}>
                {plan.highlight && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#01D98D', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20 }}>
                    MOST POPULAR
                  </div>
                )}
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0A2E1E', marginBottom: 4, fontFamily: 'Montserrat, sans-serif' }}>{plan.name}</h2>
                <p style={{ fontSize: 13, color: '#777', marginBottom: 20 }}>{plan.desc}</p>
                <div style={{ fontSize: 36, fontWeight: 700, color: '#0A2E1E', marginBottom: 4, fontFamily: 'Montserrat, sans-serif' }}>
                  {tier.price}<span style={{ fontSize: 14, fontWeight: 400, color: '#777' }}>/{billing === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
                <button
                  onClick={() => tier.priceId && handleSubscribe(tier.priceId, plan.key)}
                  disabled={loading === plan.key}
                  style={{
                    marginTop: 24, width: '100%', padding: '12px 0', borderRadius: 8, border: 'none',
                    background: plan.highlight ? '#01D98D' : '#01D98D', color: '#0A2E1E',
                    fontWeight: 700, fontSize: 15, cursor: loading === plan.key ? 'not-allowed' : 'pointer',
                    opacity: loading === plan.key ? 0.7 : 1, fontFamily: 'DM Sans, sans-serif',
                  }}>
                  {loading === plan.key ? 'Redirecting...' : 'Get started'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
