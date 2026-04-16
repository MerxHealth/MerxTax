'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (!password) { setError('Please enter your password.'); return; }
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) { setError(err.message); setLoading(false); return; }
    window.location.href = '/dashboard';
  };

  const inp: React.CSSProperties = {
    width: '100%', padding: '12px 16px', fontSize: 14, borderRadius: 10,
    border: '1.5px solid #E5E7EB', outline: 'none', fontFamily: "'DM Sans', sans-serif",
    color: '#0A2E1E', background: '#fff', boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#EEF1F4', fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Montserrat:wght@700;800&display=swap');
        * { box-sizing: border-box; }
        input:focus { border-color: #01D98D !important; box-shadow: 0 0 0 3px rgba(1,217,141,0.12); }
      `}</style>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Card */}
          <div style={{ background: '#fff', borderRadius: 20, border: '0.5px solid #E5E7EB', padding: '36px 40px' }}>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 22, color: '#0A2E1E', marginBottom: 6 }}>Sign in</div>
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>Welcome back. Access your MerxTax account.</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="you@example.com"
                style={inp}
                autoComplete="email"
              />
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
                <a href="/forgot-password" style={{ fontSize: 12, color: '#01D98D', fontWeight: 600, textDecoration: 'none' }}>Forgot password?</a>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                style={inp}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#991B1B', marginBottom: 16, marginTop: 8 }}>
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: loading ? '#a3f0d4' : '#01D98D', color: '#0A2E1E', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Montserrat', sans-serif", marginTop: error ? 0 : 20 }}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#9CA3AF' }}>
              No account?{' '}
              <a href="/signup" style={{ color: '#01D98D', fontWeight: 700, textDecoration: 'none' }}>Sign up free</a>
            </div>
          </div>

          {/* Footer note */}
          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 11, color: '#9CA3AF', lineHeight: 1.6 }}>
            By signing in you agree to our{' '}
            <a href="/terms" style={{ color: '#9CA3AF', textDecoration: 'underline' }}>Terms</a>{' '}
            and{' '}
            <a href="/privacy" style={{ color: '#9CA3AF', textDecoration: 'underline' }}>Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
}
