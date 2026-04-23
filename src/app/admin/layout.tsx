import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

// ===== SUPERADMIN WHITELIST =====
// Only these two UUIDs can access /admin — no DB query, no RLS dependency
const SUPERADMIN_UUIDS = new Set([
  'f27981eb-7ed8-43af-a1ea-6b86942b3099', // mark.dyas@merxdigital.co.uk
  '9eaed686-96b6-4a59-9c5a-551e77bebebf', // contato@lirolla.com — update UUID if needed
])

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // 1. Session check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?redirect=/admin')
  }

  // 2. Hardcoded whitelist check — no table query, no RLS
  if (!SUPERADMIN_UUIDS.has(user.id)) {
    redirect('/dashboard?error=admin_access_denied')
  }

  // 3. Fetch active HMRC session (for header pill)
  const { data: hmrcSession } = await supabase
    .from('hmrc_connections')
    .select('environment, agent_code, connected_at, revoked_at')
    .eq('user_id', user.id)
    .is('revoked_at', null)
    .order('connected_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const adminIdPrefix = user.id.slice(0, 8)
  const hmrcConnected = !!hmrcSession
  const hmrcEnvironment = hmrcSession?.environment as 'sandbox' | 'production' | undefined

  const hmrcPillBg = hmrcConnected ? '#D1FAE5' : '#FEE2E2'
  const hmrcPillColor = hmrcConnected ? '#065F46' : '#991B1B'
  const hmrcPillDot = hmrcConnected ? '#01D98D' : '#EF4444'
  const hmrcPillText = hmrcConnected
    ? `HMRC · ${hmrcEnvironment?.toUpperCase()} · Connected`
    : 'HMRC · Disconnected'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F9FAFB' }}>
      <aside style={{
        width: 280,
        background: '#FFFFFF',
        borderRight: '1px solid #E5E7EB',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        overflowY: 'auto',
        zIndex: 10,
      }}>
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid #E5E7EB' }}>
          <Link href="/admin" style={{ display: 'block' }}>
            <Image
              src="/logo.png"
              alt="MerxTax"
              width={160}
              height={160}
              style={{ height: 'auto', width: 160 }}
              priority
            />
          </Link>
          <div style={{
            marginTop: 12,
            padding: '6px 12px',
            background: '#FEE2E2',
            color: '#991B1B',
            fontSize: 11,
            fontWeight: 700,
            fontFamily: 'Montserrat, sans-serif',
            letterSpacing: 0.5,
            textAlign: 'center',
            borderRadius: 4,
          }}>
            ADMIN CONTROL PANEL
          </div>
        </div>
        <nav style={{ padding: '16px 0' }}>
          <NavSection title="OVERVIEW">
            <NavLink href="/admin" label="Dashboard" />
          </NavSection>
          <NavSection title="MAINTENANCE">
            <NavLink href="/admin/maintenance/clients" label="Clients" />
            <NavLink href="/admin/maintenance/audit-log" label="Audit Log" />
          </NavSection>
          <NavSection title="PAYMENTS">
            <NavLink href="/admin/payments" label="Subscriptions" />
            <NavLink href="/admin/payments/dunning" label="Dunning" />
          </NavSection>
          <NavSection title="AGENT">
            <NavLink href="/admin/agent/authorisation" label="Authorisations" />
          </NavSection>
          <NavSection title="INTEGRATIONS">
            <NavLink href="/admin/integrations/hmrc" label="HMRC" />
            <NavLink href="/admin/integrations/stripe" label="Stripe" />
          </NavSection>
          <NavSection title="SYSTEM">
            <NavLink href="/admin/system/health" label="Health" />
            <NavLink href="/admin/system/settings" label="Settings" />
          </NavSection>
        </nav>
        <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB' }}>
          <Link href="/dashboard" style={{
            fontSize: 13,
            color: '#6B7280',
            fontFamily: 'DM Sans, sans-serif',
            textDecoration: 'none',
          }}>
            ← Back to app
          </Link>
        </div>
      </aside>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: 280 }}>
        <header style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          padding: '16px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: 72,
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            background: '#FEE2E2',
            color: '#991B1B',
            fontSize: 12,
            fontWeight: 700,
            fontFamily: 'Montserrat, sans-serif',
            borderRadius: 999,
            letterSpacing: 0.3,
          }}>
            ADMIN · {adminIdPrefix}
          </div>
          <Link href="/admin/integrations/hmrc" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              background: hmrcPillBg,
              color: hmrcPillColor,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'DM Sans, sans-serif',
              borderRadius: 999,
            }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: hmrcPillDot,
                display: 'inline-block',
              }} />
              {hmrcPillText}
            </div>
          </Link>
        </header>
        <main style={{ flex: 1, padding: '32px 40px', maxWidth: 1400, width: '100%' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

function NavSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        padding: '0 24px 8px',
        fontSize: 11,
        fontWeight: 700,
        color: '#6B7280',
        fontFamily: 'Montserrat, sans-serif',
        letterSpacing: 0.8,
      }}>
        {title}
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {children}
      </ul>
    </div>
  )
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        style={{
          display: 'block',
          padding: '8px 24px',
          fontSize: 14,
          color: '#1C1C1E',
          fontFamily: 'DM Sans, sans-serif',
          textDecoration: 'none',
          transition: 'background 0.15s',
        }}
      >
        {label}
      </Link>
    </li>
  )
}
