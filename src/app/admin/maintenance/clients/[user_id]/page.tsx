'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Profile { id: string; full_name: string | null; email: string | null; plan: string | null; business_name: string | null }
interface AuditLog { id: string; action_type: string; created_at: string; admin_user_id: string; details: any }
interface BillingOverride { id: string; override_type: string; reason: string; created_at: string; amount_pence: number | null; stripe_action_id: string | null }

export default function ClientEditPage() {
  const { user_id } = useParams<{ user_id: string }>()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [overrides, setOverrides] = useState<BillingOverride[]>([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch(`/api/admin/clients?search=&page=1`).then(r => r.json()).then(d => {
      const c = (d.clients ?? []).find((x: Profile) => x.id === user_id)
      if (c) setProfile(c)
    })
    fetch(`/api/admin/audit?target_user_id=${user_id}`).then(r => r.json()).then(d => setLogs(d.logs ?? []))
  }, [user_id])

  const save = async () => {
    if (!profile) return
    setSaving(true)
    const supabase = (await import('@/lib/supabase/client')).createClient()
    const { error } = await supabase.from('profiles').update({ full_name: profile.full_name, business_name: profile.business_name }).eq('id', user_id)
    setMsg(error ? `Error: ${error.message}` : 'Saved successfully')
    setSaving(false)
  }

  if (!profile) return <div style={{ padding: 32, fontFamily: 'DM Sans, sans-serif', color: '#6B7280' }}>Loading...</div>

  return (
    <div style={{ maxWidth: 800 }}>
      <button onClick={() => router.back()} style={{ fontSize: 13, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16, padding: 0 }}>← Back to clients</button>
      <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 22, marginBottom: 24 }}>{profile.full_name ?? profile.email}</h1>

      {/* Edit form */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Profile Details</h2>
        {[
          { label: 'Full Name', key: 'full_name' },
          { label: 'Business Name', key: 'business_name' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{f.label}</label>
            <input
              value={(profile as any)[f.key] ?? ''}
              onChange={e => setProfile({ ...profile, [f.key]: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 14, fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box' }}
            />
          </div>
        ))}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Email</label>
          <input value={profile.email ?? ''} disabled style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 14, background: '#F9FAFB', color: '#9CA3AF', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={save} disabled={saving} style={{ padding: '8px 20px', background: '#01D98D', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {msg && <span style={{ fontSize: 13, color: msg.startsWith('Error') ? '#EF4444' : '#01D98D' }}>{msg}</span>}
        </div>
      </div>

      {/* Billing Actions */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Billing Actions</h2>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>Use <a href="/admin/payments" style={{ color: '#01D98D' }}>Subscriptions page</a> to manage billing for this user.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={`/admin/payments?user=${user_id}`} style={{ padding: '8px 16px', background: '#F3F4F6', color: '#374151', borderRadius: 6, fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>View Subscription →</a>
        </div>
      </div>

      {/* Audit Log */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #E5E7EB', fontWeight: 700, fontSize: 14, fontFamily: 'Montserrat, sans-serif' }}>Admin Actions on this User</div>
        {logs.length === 0 ? (
          <div style={{ padding: 20, color: '#9CA3AF', fontSize: 13 }}>No actions recorded</div>
        ) : logs.map(l => (
          <div key={l.id} style={{ padding: '10px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: '#374151' }}>{l.action_type}</span>
            <span style={{ color: '#9CA3AF' }}>{new Date(l.created_at).toLocaleString('en-GB')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
