'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  async function handleSignup() {
    setLoading(true)
    setError('')
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })
      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            full_name: fullName.trim(),
            email: email.trim(),
          })
        if (profileError) {
          console.error('Profile update error:', profileError.message)
        }
      }
      window.location.href = '/dashboard'
    } catch (e) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: 'DM Sans, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>

        <div style={{ marginBottom: '48px', textAlign: 'center' }}>
          <Logo height={220} />
        </div>

        <h1 style={{
          color: '#1C1C1E',
          fontSize: '22px',
          fontWeight: 600,
          marginBottom: '24px',
          textAlign: 'center',
          fontFamily: 'Montserrat, sans-serif',
        }}>
          Create account
        </h1>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#555', marginBottom: '6px' }}>
            Full name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Jane Smith"
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: '14px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#555', marginBottom: '6px' }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: '14px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#555', marginBottom: '6px' }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: '14px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {error && (
          <p style={{
            color: '#dc2626',
            fontSize: '13px',
            marginBottom: '16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '10px 14px',
          }}>
            {error}
          </p>
        )}

        <button
          onClick={handleSignup}
          disabled={loading}
          style={{
            width: '100%',
            backgroundColor: loading ? '#a3f0d4' : '#01D98D',
            color: '#0A2E1E',
            fontWeight: 700,
            fontSize: '15px',
            padding: '12px',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#888', marginTop: '24px' }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: '#01D98D', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </a>
        </p>

      </div>
    </div>
  )
}
