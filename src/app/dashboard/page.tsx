'use client'

import { useState, useEffect } from 'react'
import Logo from '@/components/Logo'

export default function DashboardPage() {
  const [vrn, setVrn] = useState('')
  const [saving, setSaving] = useState(false)
  const [connected, setConnected] = useState(false)
  const [obligations, setObligations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/vrn')
      const data = await res.json()
      if (data.vrn) setVrn(data.vrn)
      if (data.connected) setConnected(true)
    }
    load()
  }, [])

  async function saveVrn() {
    setSaving(true)
    setMessage('')
    const res = await fetch('/api/vrn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vrn })
    })
    const data = await res.json()
    setMessage(data.ok ? 'VAT number saved.' : 'Error: ' + data.error)
    setSaving(false)
  }

  async function fetchObligations() {
    setLoading(true)
    const res = await fetch('/api/vat/obligations')
    const data = await res.json()
    if (data.obligations) {
      setObligations(data.obligations)
    } else {
      setMessage(data.error || 'No obligations found.')
    }
    setLoading(false)
  }

  const statusColour = (status: string) => {
    if (status === 'F') return { bg: '#d1fae5', text: '#065f46', label: 'Filed' }
    if (status === 'O') return { bg: '#fef3c7', text: '#92400e', label: 'Open' }
    return { bg: '#f3f4f6', text: '#374151', label: status }
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
          Dashboard
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '40px', fontSize: '15px' }}>
          Welcome to MerxTax.
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
          <button onClick={() => { window.location.href = '/dashboard/reditus' }} style={{ padding: '14px 28px', backgroundColor: '#01D98D', color: '#0A2E1E', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>REDITUS · Income and Expenses →</button>
          <button onClick={() => { window.location.href = '/dashboard/vigil' }} style={{ padding: '14px 28px', backgroundColor: '#0A2E1E', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>VIGIL · Deadlines and Penalties →</button>
        </div>
        <p style={{ color: '#6b7280', marginBottom: '40px', fontSize: '15px', display: 'none' }}>hidden
        </p>

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '32px' }}>
          <div style={{
            backgroundColor: '#f9f9f9', border: '1px solid #e5e7eb',
            borderRadius: '12px', padding: '32px', flex: '1', minWidth: '280px'
          }}>
            <h2 style={{ color: '#1C1C1E', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
              HMRC Connection
            </h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
              {connected ? 'Your HMRC account is connected.' : 'Connect your HMRC account.'}
            </p>
            {connected ? (
              <span style={{
                display: 'inline-block', padding: '6px 14px',
                backgroundColor: '#d1fae5', color: '#065f46',
                borderRadius: '20px', fontSize: '13px', fontWeight: 500
              }}>Connected</span>
            ) : (
              <a href="/api/auth/hmrc" style={{
                display: 'inline-block', padding: '12px 24px',
                backgroundColor: '#01D98D', color: '#000',
                borderRadius: '8px', fontWeight: 600, fontSize: '14px',
                textDecoration: 'none'
              }}>Connect to HMRC</a>
            )}
          </div>

          <div style={{
            backgroundColor: '#f9f9f9', border: '1px solid #e5e7eb',
            borderRadius: '12px', padding: '32px', flex: '1', minWidth: '280px'
          }}>
            <h2 style={{ color: '#1C1C1E', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
              VAT Registration Number
            </h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
              Enter your 9-digit VAT number.
            </p>
            <input
              type="text"
              value={vrn}
              onChange={e => setVrn(e.target.value)}
              placeholder="123456789"
              maxLength={9}
              style={{
                width: '100%', padding: '10px 12px', backgroundColor: '#fff',
                border: '1px solid #d1d5db', borderRadius: '8px', color: '#1C1C1E',
                fontSize: '14px', outline: 'none', boxSizing: 'border-box', marginBottom: '16px'
              }}
            />
            {message && (
              <p style={{ color: '#065f46', fontSize: '13px', marginBottom: '12px' }}>{message}</p>
            )}
            <button onClick={saveVrn} disabled={saving} style={{
              padding: '10px 20px', backgroundColor: '#01D98D',
              color: '#000', border: 'none', borderRadius: '8px',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer'
            }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div style={{
          backgroundColor: '#f9f9f9', border: '1px solid #e5e7eb',
          borderRadius: '12px', padding: '32px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ color: '#1C1C1E', fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
                VAT Obligations
              </h2>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                Your upcoming and past VAT return deadlines.
              </p>
            </div>
            <button onClick={fetchObligations} disabled={loading} style={{
              padding: '10px 20px', backgroundColor: '#01D98D',
              color: '#000', border: 'none', borderRadius: '8px',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer'
            }}>
              {loading ? 'Loading...' : 'Fetch Obligations'}
            </button>
          </div>

          {obligations.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  {['Period Start', 'Period End', 'Due Date', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#6b7280', fontSize: '13px', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {obligations.map((ob: any, i: number) => {
                  const s = statusColour(ob.status)
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#1C1C1E' }}>{ob.start}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#1C1C1E' }}>{ob.end}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#1C1C1E' }}>{ob.due}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          display: 'inline-block', padding: '4px 10px',
                          backgroundColor: s.bg, color: s.text,
                          borderRadius: '12px', fontSize: '12px', fontWeight: 500
                        }}>{s.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>
              Connect HMRC and enter your VAT number, then click Fetch Obligations.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}


