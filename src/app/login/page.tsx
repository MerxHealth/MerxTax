'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#ffffff',
      fontFamily: 'DM Sans, sans-serif', padding: '48px'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ marginBottom: '48px', marginLeft: '-12px' }}>
          <Logo height={220} />
        </div>
        <h1 style={{ color: '#1C1C1E', fontSize: '28px', fontWeight: 600, marginBottom: '8px' }}>
          Sign in
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '40px', fontSize: '15px' }}>
          Welcome back. Sign in to your MerxTax account.
        </p>
        <div style={{
          backgroundColor: '#f9f9f9', border: '1px solid #e5e7eb',
          borderRadius: '12px', padding: '32px', maxWidth: '480px'
        }}>
          {error && (
            <div style={{
              backgroundColor: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '8px', padding: '12px', marginBottom: '16px',
              color: '#dc2626', fontSize: '14px'
            }}>
              {error}
            </div>
          )}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ color: '#374151', fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: '100%', padding: '10px 12px', backgroundColor: '#fff',
                border: '1px solid #d1d5db', borderRadius: '8px', color: '#1C1C1E',
                fontSize: '14px', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ color: '#374151', fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="password"
              style={{
                width: '100%', padding: '10px 12px', backgroundColor: '#fff',
                border: '1px solid #d1d5db', borderRadius: '8px', color: '#1C1C1E',
                fontSize: '14px', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%', padding: '11px', backgroundColor: '#01D98D',
              color: '#000', border: 'none', borderRadius: '8px',
              fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          <p style={{ textAlign: 'center', marginTop: '20px', color: '#6b7280', fontSize: '14px' }}>
            No account?{' '}
            <a href="/signup" style={{ color: '#01D98D', textDecoration: 'none', fontWeight: 500 }}>
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}