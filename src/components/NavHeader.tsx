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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { setUserName(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav style={{
      width: '100%',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      padding: '0 32px 0 16px',
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontFamily: 'DM Sans, sans-serif',
      boxSizing: 'border-box',
    }}>

      {/* Logo — left side */}
      <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
        <img src="/logo.png" alt="MerxTax" style={{ height: '46px', width: 'auto' }} />
      </a>

      {/* Nav links — right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <a href="/pricing" style={{ color: '#0A2E1E', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
          Pricing
        </a>
        <a href="/dashboard" style={{ color: '#0A2E1E', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
          Dashboard
        </a>
        {loading ? (
          <div style={{ width: 80, height: 34 }} />
        ) : userName ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>
              {userName}
            </span>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/login';
              }}
              style={{ color: '#6B7280', backgroundColor: 'transparent', fontSize: '13px', fontWeight: 600, textDecoration: 'none', padding: '6px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <a href="/login" style={{ color: '#ffffff', backgroundColor: '#01D98D', fontSize: '14px', fontWeight: 600, textDecoration: 'none', padding: '8px 18px', borderRadius: '8px' }}>
            Sign in
          </a>
        )}
      </div>
    </nav>
  );
}
