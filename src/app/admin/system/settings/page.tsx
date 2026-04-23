// src/app/admin/system/settings/page.tsx — System Settings (SSR)
import { createClient } from '@/lib/supabase/server'

export default async function SystemSettingsPage() {
  const supabase = await createClient()

  // Fetch current admin users
  const { data: admins } = await supabase
    .from('admin_users')
    .select('user_id, role, created_at')
    .order('created_at', { ascending: true })

  // Fetch their emails from profiles
  const adminIds = (admins ?? []).map(a => a.user_id)
  const { data: profiles } = adminIds.length > 0
    ? await supabase.from('profiles').select('id, email, full_name').in('id', adminIds)
    : { data: [] }

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

  const stripeKey = process.env.STRIPE_SECRET_KEY ?? ''
  const stripeMode = stripeKey.startsWith('sk_live') ? 'LIVE' : 'TEST'
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseProject = supabaseUrl.replace('https://', '').replace('.supabase.co', '')

  return (
    <div>
      <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 24, marginBottom: 8, color: '#111827' }}>
        System Settings
      </h1>
      <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 32, fontFamily: 'DM Sans, sans-serif' }}>
        Platform configuration and admin access
      </p>

      {/* Platform config */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden', marginBottom: 28 }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #E5E7EB', fontWeight: 700, fontSize: 14, fontFamily: 'Montserrat, sans-serif', color: '#111827' }}>
          Platform Configuration
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { label: 'Supabase Project', value: supabaseProject, mono: true },
            { label: 'Stripe Mode', value: stripeMode, mono: false },
            { label: 'Node Environment', value: process.env.NODE_ENV ?? 'production', mono: false },
            { label: 'Next.js App', value: 'MerxTax v0.1.0', mono: false },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ fontSize: 14, color: '#374151', fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}>{row.label}</span>
              <span style={{ fontSize: 13, color: '#6B7280', fontFamily: row.mono ? 'monospace' : 'DM Sans, sans-serif', background: '#F9FAFB', padding: '4px 10px', borderRadius: 6 }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Admin users */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #E5E7EB', fontWeight: 700, fontSize: 14, fontFamily: 'Montserrat, sans-serif', color: '#111827' }}>
          Admin Users
        </div>
        {(admins ?? []).length === 0 ? (
          <div style={{ padding: 24, color: '#9CA3AF', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>No admin users found</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Sans, sans-serif' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Email', 'Name', 'Role', 'UUID', 'Added'].map(h => (
                  <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6B7280', fontFamily: 'Montserrat, sans-serif', letterSpacing: 0.3 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(admins ?? []).map(a => {
                const p = profileMap[a.user_id]
                return (
                  <tr key={a.user_id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '12px 24px', fontSize: 14, color: '#111827', fontWeight: 500 }}>
                      {p?.email ?? '—'}
                    </td>
                    <td style={{ padding: '12px 24px', fontSize: 13, color: '#6B7280' }}>
                      {p?.full_name ?? '—'}
                    </td>
                    <td style={{ padding: '12px 24px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: '#FEE2E2', color: '#991B1B' }}>
                        {a.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 24px', fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace' }}>
                      {a.user_id.slice(0, 8)}…
                    </td>
                    <td style={{ padding: '12px 24px', fontSize: 12, color: '#9CA3AF' }}>
                      {a.created_at ? new Date(a.created_at).toLocaleDateString('en-GB') : '—'}
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
