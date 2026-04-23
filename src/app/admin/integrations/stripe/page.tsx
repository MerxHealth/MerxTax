// src/app/admin/integrations/stripe/page.tsx — Stripe Integration Status (SSR)
import { createClient } from '@/lib/supabase/server'

export default async function StripeIntegrationPage() {
  const supabase = await createClient()

  // Count users with stripe_customer_id
  const { count: withStripe } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .not('stripe_customer_id', 'is', null)

  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })

  const { data: planBreakdown } = await supabase
    .from('profiles')
    .select('plan')

  const plans = planBreakdown ?? []
  const planCounts = plans.reduce((acc: Record<string, number>, p) => {
    const plan = p.plan ?? 'free'
    acc[plan] = (acc[plan] ?? 0) + 1
    return acc
  }, {})

  const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''
  const stripeMode = stripePublishableKey.startsWith('pk_live') ? 'LIVE' : 'TEST'
  const stripeModeBg = stripeMode === 'LIVE' ? '#D1FAE5' : '#FEF3C7'
  const stipeModColor = stripeMode === 'LIVE' ? '#065F46' : '#92400E'

  return (
    <div>
      <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 24, marginBottom: 8, color: '#111827' }}>
        Stripe Integration
      </h1>
      <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 32, fontFamily: 'DM Sans, sans-serif' }}>
        Stripe connection status and billing overview
      </p>

      {/* Status card */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 28, marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#01D98D' }} />
          <span style={{ fontWeight: 700, fontSize: 16, fontFamily: 'Montserrat, sans-serif', color: '#111827' }}>
            Stripe Connected
          </span>
          <span style={{ padding: '3px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: stripeModeBg, color: stipeModColor }}>
            {stripeMode} MODE
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            { label: 'Total Users', value: totalUsers ?? 0, color: '#111827' },
            { label: 'With Stripe ID', value: withStripe ?? 0, color: '#01D98D' },
            { label: 'Not Linked', value: (totalUsers ?? 0) - (withStripe ?? 0), color: '#9CA3AF' },
          ].map(w => (
            <div key={w.label} style={{ textAlign: 'center', padding: 16, background: '#F9FAFB', borderRadius: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: w.color, fontFamily: 'Montserrat, sans-serif' }}>{w.value}</div>
              <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'DM Sans, sans-serif', marginTop: 4 }}>{w.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Plan breakdown */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #E5E7EB', fontWeight: 700, fontSize: 14, fontFamily: 'Montserrat, sans-serif', color: '#111827' }}>
          Plan Breakdown
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Sans, sans-serif' }}>
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              {['Plan', 'Users', '% of Total'].map(h => (
                <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6B7280', fontFamily: 'Montserrat, sans-serif' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(planCounts).sort((a, b) => b[1] - a[1]).map(([plan, count]) => {
              const pct = totalUsers ? ((count / totalUsers) * 100).toFixed(1) : '0'
              const colors: Record<string, { bg: string; color: string }> = {
                solo: { bg: '#FEF3C7', color: '#92400E' },
                pro: { bg: '#DBEAFE', color: '#1D4ED8' },
                agent: { bg: '#D1FAE5', color: '#065F46' },
                free: { bg: '#F3F4F6', color: '#374151' },
                past_due: { bg: '#FEF3C7', color: '#92400E' },
                cancelled: { bg: '#FEE2E2', color: '#991B1B' },
              }
              const c = colors[plan] ?? { bg: '#F3F4F6', color: '#374151' }
              return (
                <tr key={plan} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '12px 24px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: c.bg, color: c.color }}>
                      {plan}
                    </span>
                  </td>
                  <td style={{ padding: '12px 24px', fontSize: 14, color: '#111827', fontWeight: 600 }}>{count}</td>
                  <td style={{ padding: '12px 24px', fontSize: 13, color: '#6B7280' }}>{pct}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
