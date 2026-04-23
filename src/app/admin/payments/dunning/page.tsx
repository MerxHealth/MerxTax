// src/app/admin/payments/dunning/page.tsx — Dunning Management (SSR)
import { createClient } from '@/lib/supabase/server'

export default async function DunningPage() {
  const supabase = await createClient()

  // Fetch users with past_due or cancelled plans
  const { data: dunning } = await supabase
    .from('profiles')
    .select('id, full_name, email, plan, stripe_customer_id, updated_at')
    .in('plan', ['past_due', 'cancelled', 'free'])
    .order('updated_at', { ascending: false })
    .limit(100)

  const rows = dunning ?? []

  const statusColor = (plan: string | null) => {
    if (plan === 'past_due') return { bg: '#FEF3C7', color: '#92400E', label: 'Past Due' }
    if (plan === 'cancelled') return { bg: '#FEE2E2', color: '#991B1B', label: 'Cancelled' }
    return { bg: '#F3F4F6', color: '#374151', label: 'Free' }
  }

  return (
    <div>
      <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 24, marginBottom: 8, color: '#111827' }}>
        Dunning
      </h1>
      <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 32, fontFamily: 'DM Sans, sans-serif' }}>
        Users with payment issues or cancelled subscriptions
      </p>

      {/* Summary widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
        {[
          { label: 'Past Due', value: rows.filter(r => r.plan === 'past_due').length, color: '#F59E0B' },
          { label: 'Cancelled', value: rows.filter(r => r.plan === 'cancelled').length, color: '#EF4444' },
          { label: 'Free (churned)', value: rows.filter(r => r.plan === 'free').length, color: '#6B7280' },
        ].map(w => (
          <div key={w.label} style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', fontFamily: 'Montserrat, sans-serif', letterSpacing: 0.5, marginBottom: 8 }}>
              {w.label.toUpperCase()}
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, color: w.color, fontFamily: 'Montserrat, sans-serif', lineHeight: 1 }}>
              {w.value}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        {rows.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#9CA3AF', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
            No dunning cases found
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Sans, sans-serif' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Name', 'Email', 'Status', 'Stripe ID', 'Last Updated'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6B7280', fontFamily: 'Montserrat, sans-serif', letterSpacing: 0.3 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const s = statusColor(r.plan)
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#111827', fontWeight: 500 }}>
                      {r.full_name ?? '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B7280' }}>
                      {r.email ?? '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace' }}>
                      {r.stripe_customer_id ?? '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#9CA3AF' }}>
                      {r.updated_at ? new Date(r.updated_at).toLocaleDateString('en-GB') : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
