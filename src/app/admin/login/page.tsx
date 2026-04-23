'use client';

import { useState, useEffect } from 'react';
import Logo from '@/components/Logo';

const ADMIN_USER = 'admin@merxtax.co.uk';
const ADMIN_PASS = 'MerxAdmin2026!';
const ADMIN_TOKEN = 'mt_admin_authenticated';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(ADMIN_TOKEN) === 'true') window.location.href = '/admin';
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

  return (
    <div style={{ minHeight: '100vh', background: '#EEF1F4', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Montserrat:wght@700;800&display=swap'); * { box-sizing: border-box; } input:focus { border-color: #01D98D !important; outline: none; box-shadow: 0 0 0 3px rgba(1,217,141,0.12); }`}</style>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <Logo height={160} />
            <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Admin Portal</div>
          </div>

          <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #E5E7EB', padding: '36px' }}>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 20, color: '#0A2E1E', marginBottom: 4 }}>Admin Sign in</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 28 }}>Restricted access. Authorised personnel only.</div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="admin@merxtax.co.uk"
                style={{ width: '100%', padding: '11px 14px', fontSize: 14, border: '1.5px solid #E5E7EB', borderRadius: 9, fontFamily: "'DM Sans', sans-serif", color: '#0A2E1E', background: '#fff' }} />
            </div>

            <div style={{ marginBottom: 4 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="••••••••"
                style={{ width: '100%', padding: '11px 14px', fontSize: 14, border: '1.5px solid #E5E7EB', borderRadius: 9, fontFamily: "'DM Sans', sans-serif", color: '#0A2E1E', background: '#fff' }} />
            </div>

            {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#991B1B', margin: '12px 0' }}>{error}</div>}

            <button onClick={handleLogin} disabled={loading}
              style={{ width: '100%', padding: '13px', marginTop: 20, borderRadius: 10, border: 'none', background: '#01D98D', color: '#0A2E1E', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: "'Montserrat', sans-serif" }}>
              {loading ? 'Verifying...' : 'Sign in'}
            </button>
          </div>

          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 11, color: '#9CA3AF' }}>
            This portal is monitored. Unauthorised access is prohibited.
          </div>
        </div>
      </div>
    </div>
  );
}
