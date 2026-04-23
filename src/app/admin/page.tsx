// src/app/admin/page.tsx — Admin Overview Dashboard (SSR)
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export default async function AdminOverviewPage() {
  // User auth via SSR client (cookie-based)
  const supabase = await createClient()
  // Data queries via service role client (bypasses RLS — sees all rows)
  const adminDb = createAdminClient()

  const [profilesRes, auditRes] = await Promise.all([
    adminDb.from('profiles').select('id, plan', { count: 'exact' }),
    adminDb.from('admin_audit_log').select('id, action_type, created_at, admin_user_id').order('created_at', { ascending: false }).limit(10),
  ])

  const profiles = profilesRes.data ?? []
  const totalUsers = profilesRes.count ?? 0
  const recentActions = auditRes.data ?? []

  const planCounts = profiles.reduce((acc: Record<string, number>, p) => {
    const plan = p.plan ?? 'free'
    acc[plan] = (acc[plan] ?? 0) + 1
    return acc
  }, {})

  const widgets = [
    { label: 'Total Users', value: totalUsers, sub: 'registered accounts', color: '#01D98D' },
    { label: 'Solo Plan', value: planCounts['solo'] ?? 0, sub: 'active subscribers', color: '#3B82F6' },
    { label: 'Pro Plan', value: planCounts['pro'] ?? 0, sub: 'active subscribers', color: '#8B5CF6' },
    { label: 'Agent Plan', value: planCounts['agent'] ?? 0, sub: 'active subscribers', color: '#F59E0B' },
  ]

  return (
    <div>
      <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 24, marginBottom: 8, color: '#111827' }}>Admin Overview</h1>
      <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 32, fontFamily: 'DM Sans, sans-serif' }}>Platform health at a glance</p>
      {/* Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 40 }}>
        {widgets.map(w => (
          <div key={w.label} style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#6B7280', fontFamily: 'Montserrat, sans-serif', letterSpacing: 0.3, marginBottom: 8 }}>{w.label.toUpperCase()}</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: w.color, fontFamily: 'Montserrat, sans-serif', lineHeight: 1 }}>{w.value}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'DM Sans, sans-serif', marginTop: 4 }}>{w.sub}</div>
          </div>
        ))}
      </div>
      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
        {[
          { href: '/admin/maintenance/clients', label: 'Manage Clients', desc: 'View, edit and impersonate users' },
          { href: '/admin/payments', label: 'Subscriptions', desc: 'Billing overrides and refunds' },
          { href: '/admin/maintenance/audit-log', label: 'Audit Log', desc: 'All admin actions recorded' },
        ].map(l => (
          <Link key={l.href} href={l.href} style={{ textDecoration: 'none', background: '#fff', borderRadius: 10, padding: '20px 24px', border: '1px solid #E5E7EB', display: 'block' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', fontFamily: 'Montserrat, sans-serif', marginBottom: 4 }}>{l.label} →</div>
            <div style={{ fontSize: 13, color: '#6B7280', fontFamily: 'DM Sans, sans-serif' }}>{l.desc}</div>
          </Link>
        ))}
      </div>
      {/* Recent Actions */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #E5E7EB', fontWeight: 700, fontSize: 14, fontFamily: 'Montserrat, sans-serif', color: '#111827' }}>Recent Admin Actions</div>
        {recentActions.length === 0 ? (
          <div style={{ padding: 24, color: '#9CA3AF', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>No actions yet</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Sans, sans-serif' }}>
            <tbody>
              {recentActions.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '10px 24px', fontSize: 13, color: '#374151' }}>{a.action_type}</td>
                  <td style={{ padding: '10px 24px', fontSize: 12, color: '#9CA3AF' }}>{a.admin_user_id?.slice(0, 8)}</td>
                  <td style={{ padding: '10px 24px', fontSize: 12, color: '#9CA3AF', textAlign: 'right' }}>{new Date(a.created_at).toLocaleString('en-GB')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
