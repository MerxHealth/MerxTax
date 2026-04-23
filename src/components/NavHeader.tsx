'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function NavHeader() {
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        setUserName(profile?.full_name || user.email?.split('@')[0] || 'Account');
      }
      setLoading(false);
    }
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (!session) {
        setUserName(null);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav
      style={{
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.94)',
        borderBottom: '1px solid rgba(10,46,30,0.08)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        fontFamily: 'DM Sans, sans-serif',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          maxWidth: 1160,
          margin: '0 auto',
          padding: '0 24px',
          minHeight: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        }}
      >
        <a
          href="/dashboard"
          style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}
          aria-label="MerxTax"
        >
          <img src="/logo.png" alt="MerxTax" style={{ height: '40px', width: 'auto', display: 'block' }} />
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <a href="/pricing" style={{ color: '#33584A', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
            Pricing
          </a>
          <a href="/dashboard" style={{ color: '#33584A', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
            Dashboard
          </a>
          {loading ? (
            <div style={{ width: 88, height: 38 }} />
          ) : userName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>
                {userName}
              </span>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = '/login';
                }}
                style={{
                  color: '#33584A',
                  backgroundColor: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(10,46,30,0.10)',
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                  boxShadow: '0 4px 14px rgba(10,46,30,0.04)',
                }}
              >
                Sign out
              </button>
            </div>
          ) : (
            <a
              href="/login"
              style={{
                color: '#0A2E1E',
                backgroundColor: '#D8FFF0',
                fontSize: '14px',
                fontWeight: 700,
                textDecoration: 'none',
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(1,217,141,0.22)',
                boxShadow: '0 10px 24px rgba(1,217,141,0.12)',
              }}
            >
              Sign in
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}
