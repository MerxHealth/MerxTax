// src/app/admin/layout.tsx
// MerxTax Admin Control Panel — Layout Shell
// Sprint 7 · Slice 7A · Step 1
// Wraps every /admin/* route with sidebar, header, and admin context guard.

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

// ============ TYPES ============
interface NavItem {
  label: string;
  href: string;
  indent?: boolean;
}

interface NavSection {
  heading: string;
  items: NavItem[];
}

// ============ NAVIGATION CONFIG ============
const NAV: NavSection[] = [
  {
    heading: 'OVERVIEW',
    items: [
      { label: 'Dashboard', href: '/admin' },
    ],
  },
  {
    heading: 'MAINTENANCE',
    items: [
      { label: 'Clients', href: '/admin/maintenance/clients' },
      { label: 'Audit Log', href: '/admin/maintenance/audit-log' },
    ],
  },
  {
    heading: 'PAYMENTS',
    items: [
      { label: 'Overview', href: '/admin/payments' },
      { label: 'Subscriptions', href: '/admin/payments/subscriptions' },
      { label: 'Dunning', href: '/admin/payments/dunning' },
    ],
  },
  {
    heading: 'AGENT',
    items: [
      { label: 'Workspace', href: '/admin/agent' },
      { label: 'Authorisation', href: '/admin/agent/authorisation' },
      { label: 'Clients', href: '/admin/agent/clients' },
      { label: 'Filings', href: '/admin/agent/filings' },
    ],
  },
  {
    heading: 'INTEGRATIONS',
    items: [
      { label: 'HMRC', href: '/admin/integrations/hmrc' },
      { label: 'Stripe', href: '/admin/integrations/stripe' },
      { label: 'Cloudflare R2', href: '/admin/integrations/r2' },
      { label: 'Yapily', href: '/admin/integrations/yapily' },
    ],
  },
  {
    heading: 'SYSTEM',
    items: [
      { label: 'Settings', href: '/admin/settings' },
      { label: 'Logs', href: '/admin/logs' },
    ],
  },
];

// ============ ADMIN GUARD HOOK ============
function useAdminGuard() {
  const [status, setStatus] = useState<'loading' | 'authorised' | 'denied'>('loading');
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) {
          window.location.href = '/login?redirect=/admin';
        }
        return;
      }

      const { data: adminRow, error } = await supabase
        .from('admin_users')
        .select('user_id, role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error || !adminRow) {
        setStatus('denied');
        setTimeout(() => { window.location.href = '/dashboard'; }, 1500);
        return;
      }

      setAdminUserId(user.id);
      setAdminEmail(user.email ?? null);
      setStatus('authorised');
    }

    check();
    return () => { cancelled = true; };
  }, []);

  return { status, adminUserId, adminEmail };
}

// ============ HMRC SESSION HOOK ============
function useHmrcSession(adminUserId: string | null) {
  const [session, setSession] = useState<{
    environment: string;
    connected: boolean;
  } | null>(null);

  useEffect(() => {
    if (!adminUserId) return;

    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('hmrc_connections')
        .select('environment, revoked_at, expires_at')
        .eq('user_id', adminUserId)
        .is('revoked_at', null)
        .order('connected_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        const expired = data.expires_at ? new Date(data.expires_at) < new Date() : false;
        setSession({
          environment: data.environment ?? 'sandbox',
          connected: !expired,
        });
      } else {
        setSession({ environment: '—', connected: false });
      }
    }

    load();
  }, [adminUserId]);

  return session;
}

// ============ MAIN LAYOUT ============
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { status, adminUserId, adminEmail } = useAdminGuard();
  const hmrcSession = useHmrcSession(adminUserId);

  if (status === 'loading') {
    return (
      <div style={loadingWrap}>
        <div style={loadingText}>Verifying admin access…</div>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div style={loadingWrap}>
        <div style={{ ...loadingText, color: '#991B1B' }}>
          Access denied. Redirecting to dashboard…
        </div>
      </div>
    );
  }

  const adminIdShort = adminUserId ? adminUserId.slice(0, 8) : '';

  return (
    <div style={shell}>
      <aside style={sidebar}>
        <div style={sidebarLogoWrap}>
          <Image
            src="/logo.png"
            alt="MerxTax"
            width={160}
            height={160}
            priority
            style={{ height: 160, width: 'auto', objectFit: 'contain' }}
          />
        </div>

        <div style={sidebarBadge}>
          ADMIN CONTROL PANEL
        </div>

        <nav style={nav}>
          {NAV.map((section) => (
            <div key={section.heading} style={navSection}>
              <div style={navHeading}>{section.heading}</div>
              {section.items.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  style={navLink}
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = item.href;
                  }}
                  onMouseOver={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = '#F3F4F6';
                    (e.currentTarget as HTMLAnchorElement).style.color = '#0A2E1E';
                  }}
                  onMouseOut={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                    (e.currentTarget as HTMLAnchorElement).style.color = '#1C1C1E';
                  }}
                >
                  {item.label}
                </a>
              ))}
            </div>
          ))}
        </nav>

        <div style={sidebarFooter}>
          <a
            href="/dashboard"
            style={exitLink}
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/dashboard';
            }}
          >
            ← Exit Admin
          </a>
        </div>
      </aside>

      <div style={mainColumn}>
        <header style={topbar}>
          <div style={topbarLeft}>
            <span style={adminPill}>
              ADMIN · {adminIdShort}
            </span>
            {adminEmail && (
              <span style={adminEmailText}>{adminEmail}</span>
            )}
          </div>

          <div style={topbarRight}>
            {hmrcSession && (
              <span
                style={{
                  ...hmrcPill,
                  background: hmrcSession.connected ? '#D1FAE5' : '#F3F4F6',
                  color: hmrcSession.connected ? '#065F46' : '#6B7280',
                  border: hmrcSession.connected
                    ? '1px solid #10B981'
                    : '1px solid #D1D5DB',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background: hmrcSession.connected ? '#10B981' : '#9CA3AF',
                  }}
                />
                HMRC · {hmrcSession.environment.toUpperCase()}
                {hmrcSession.connected ? ' · Connected' : ' · Disconnected'}
              </span>
            )}
          </div>
        </header>

        <main style={content}>
          {children}
        </main>
      </div>
    </div>
  );
}

// ============ STYLES ============
const loadingWrap: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#F9FAFB',
};

const loadingText: React.CSSProperties = {
  fontFamily: 'DM Sans, sans-serif',
  fontSize: 16,
  color: '#6B7280',
};

const shell: React.CSSProperties = {
  display: 'flex',
  minHeight: '100vh',
  background: '#FFFFFF',
  fontFamily: 'DM Sans, sans-serif',
};

const sidebar: React.CSSProperties = {
  width: 260,
  minWidth: 260,
  background: '#FFFFFF',
  borderRight: '1px solid #E5E7EB',
  display: 'flex',
  flexDirection: 'column',
  padding: '24px 0',
};

const sidebarLogoWrap: React.CSSProperties = {
  padding: '0 24px 16px 24px',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
};

const sidebarBadge: React.CSSProperties = {
  margin: '0 24px 24px 24px',
  padding: '6px 10px',
  background: '#FEE2E2',
  color: '#991B1B',
  fontFamily: 'Montserrat, sans-serif',
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: '0.05em',
  borderRadius: 6,
  textAlign: 'center',
};

const nav: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '0 16px',
};

const navSection: React.CSSProperties = {
  marginBottom: 20,
};

const navHeading: React.CSSProperties = {
  fontFamily: 'Montserrat, sans-serif',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  color: '#6B7280',
  padding: '0 12px 8px 12px',
};

const navLink: React.CSSProperties = {
  display: 'block',
  padding: '8px 12px',
  fontSize: 14,
  color: '#1C1C1E',
  textDecoration: 'none',
  borderRadius: 6,
  transition: 'background 0.15s, color 0.15s',
  cursor: 'pointer',
};

const sidebarFooter: React.CSSProperties = {
  padding: '16px 24px 0 24px',
  borderTop: '1px solid #E5E7EB',
  marginTop: 16,
};

const exitLink: React.CSSProperties = {
  fontSize: 13,
  color: '#6B7280',
  textDecoration: 'none',
  fontWeight: 500,
};

const mainColumn: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  background: '#F9FAFB',
};

const topbar: React.CSSProperties = {
  height: 64,
  background: '#FFFFFF',
  borderBottom: '1px solid #E5E7EB',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 32px',
};

const topbarLeft: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
};

const topbarRight: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
};

const adminPill: React.CSSProperties = {
  background: '#D92D20',
  color: '#FFFFFF',
  padding: '6px 12px',
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 700,
  fontFamily: 'Montserrat, sans-serif',
  letterSpacing: '0.05em',
};

const adminEmailText: React.CSSProperties = {
  fontSize: 13,
  color: '#6B7280',
};

const hmrcPill: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 600,
  fontFamily: 'DM Sans, sans-serif',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

const content: React.CSSProperties = {
  flex: 1,
  padding: '32px',
  overflowY: 'auto',
};
