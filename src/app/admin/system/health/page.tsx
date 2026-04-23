// src/app/admin/system/health/page.tsx — System Health (SSR)
import { createClient } from '@/lib/supabase/server'

export default async function SystemHealthPage() {
  const supabase = await createClient()

  const checks: { name: string; status: 'ok' | 'error' | 'warn'; detail: string }[] = []

  // 1. Supabase DB
  const start = Date.now()
  const { error: dbErr } = await supabase.from('profiles').select('id').limit(1)
  const dbMs = Date.now() - start
  checks.push({
    name: 'Supabase Database',
    status: dbErr ? 'error' : dbMs > 1000 ? 'warn' : 'ok',
    detail: dbErr ? dbErr.message : `${dbMs}ms`,
  })

  // 2. Supabase Auth
  const { error: authErr } = await supabase.auth.getUser()
  checks.push({
    name: 'Supabase Auth',
    status: authErr && authErr.message !== 'Auth session missing!' ? 'error' : 'ok',
    detail: authErr && authErr.message !== 'Auth session missing!' ? authErr.message : 'Operational',
  })

  // 3. Environment variables
  const requiredEnv = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  ]
  const missingEnv = requiredEnv.filter(k => !process.env[k])
  checks.push({
    name: 'Environment Variables',
    status: missingEnv.length > 0 ? 'error' : 'ok',
    detail: missingEnv.length > 0 ? `Missing: ${missingEnv.join(', ')}` : 'All required vars present',
  })

  // 4. Stripe key mode
  const stripeKey = process.env.STRIPE_SECRET_KEY ?? ''
  const stripeMode = stripeKey.startsWith('sk_live') ? 'LIVE' : 'TEST'
  checks.push({
    name: 'Stripe Mode',
    status: stripeMode === 'LIVE' ? 'ok' : 'warn',
    detail: `Running in ${stripeMode} mode`,
  })

  // 5. Anthropic key
  checks.push({
    name: 'Anthropic (LUMEN)',
    status: process.env.ANTHROPIC_API_KEY ? 'ok' : 'warn',
    detail: process.env.ANTHROPIC_API_KEY ? 'API key present' : 'API key missing',
  })

  const statusStyle = (s: 'ok' | 'error' | 'warn') => {
    if (s === 'ok') return { bg: '#D1FAE5', color: '#065F46', dot: '#01D98D', label: 'OK' }
    if (s === 'error') return { bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444', label: 'ERROR' }
    return { bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B', label: 'WARN' }
  }

  const allOk = checks.every(c => c.status === 'ok')
  const hasError = checks.some(c => c.status === 'error')
  const overallStatus = hasError ? 'error' : allOk ? 'ok' : 'warn'
  const overall = statusStyle(overallStatus)

  return (
    <div>
      <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 24, marginBottom: 8, color: '#111827' }}>
        System Health
      </h1>
      <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 32, fontFamily: 'DM Sans, sans-serif' }}>
        Real-time status of all platform dependencies
      </p>

      {/* Overall status */}
      <div style={{ background: overall.bg, borderRadius: 12, padding: '20px 28px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 14, height: 14, borderRadius: '50%', background: overall.dot }} />
        <span style={{ fontWeight: 700, fontSize: 16, fontFamily: 'Montserrat, sans-serif', color: overall.color }}>
          {overallStatus === 'ok' ? 'All Systems Operational' : overallStatus === 'error' ? 'System Issues Detected' : 'Degraded Performance'}
        </span>
      </div>

      {/* Checks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {checks.map(c => {
          const s = statusStyle(c.status)
          return (
            <div key={c.name} style={{ background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', fontFamily: 'DM Sans, sans-serif' }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'DM Sans, sans-serif', marginTop: 2 }}>{c.detail}</div>
                </div>
              </div>
              <span style={{ padding: '3px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: s.bg, color: s.color }}>
                {s.label}
              </span>
            </div>
          )
        })}
      </div>

      <p style={{ marginTop: 24, fontSize: 12, color: '#9CA3AF', fontFamily: 'DM Sans, sans-serif' }}>
        Last checked: {new Date().toLocaleString('en-GB')}
      </p>
    </div>
  )
}
