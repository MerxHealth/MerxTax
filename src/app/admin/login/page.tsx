'use client';

import { useState, useEffect } from 'react';
import Logo from '@/components/Logo';

const ADMIN_USER = 'admin@merxtax.co.uk';
const ADMIN_PASS = 'MerxAdmin2026!'; // change this — or move to NEXT_PUBLIC_ADMIN_PASS env var
const ADMIN_TOKEN = 'mt_admin_authenticated';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(ADMIN_TOKEN) === 'true') {
      window.location.href = '/admin';
    }
  }, []);

  const handleLogin = () => {
    if (!email || !password) { setError('Please enter email and password.'); return; }
    setLoading(true); setError('');
    setTimeout(() => {
      if (email.trim().toLowerCase() === ADMIN_USER && password === ADMIN_PASS) {
        localStorage.setItem(ADMIN_TOKEN, 'true');
        window.location.href = '/admin';
      } else {
        setError('Invalid credentials.');
        setLoading(false);
      }
    }, 600);
  };

  const inp: React.CSSProperties = {
    width: '100%', padding: '12px 16px', fontSize: 14, borderRadius: 10,
    border: '1.5px solid #E5E7EB', outline: 'none', background: '#fff',
    color: '#0A2E1E', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0A2E1E', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Montserrat:wght@700;800&display=swap');
        * { box-sizing: border-box; }
        input:focus { border-color: #01D98D !important; }
      `}</style>

      <div style={{ width: '100%', maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ filter: 'brightness(0) invert(1)', display: 'inline-block' }}>
            <Logo height={160} />
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 8 }}>
            Admin Portal
          </div>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '32px 28px' }}>
          <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 18, color: '#0A2E1E', marginBottom: 4 }}>
            Admin Sign in
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 24 }}>
            Restricted access. Authorised personnel only.
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="admin@merxtax.co.uk"
              style={inp}
              autoComplete="off"
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              style={inp}
              autoComplete="off"
            />
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#FCA5A5', marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: loading ? 'rgba(1,217,141,0.5)' : '#01D98D', color: '#0A2E1E', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Montserrat', sans-serif" }}>
            {loading ? 'Verifying...' : 'Sign in to Admin'}
          </button>
        </div>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
          This portal is monitored. Unauthorised access is prohibited.
        </div>
      </div>
    </div>
  );
}
