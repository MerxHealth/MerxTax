'use client'
// src/components/ImpersonationBannerClient.tsx
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  sessionId: string
  targetEmail: string
  targetName: string
  expiresAt: string
}

export default function ImpersonationBannerClient({ sessionId, targetEmail, targetName, expiresAt }: Props) {
  const router = useRouter()
  const [secondsLeft, setSecondsLeft] = useState(() => {
    return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
  })
  const [notified, setNotified] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const s = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
      setSecondsLeft(s)
      if (s <= 300 && !notified) {
        setNotified(true)
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('MerxTax Admin', { body: 'Impersonation session expires in 5 minutes.' })
        }
      }
      if (s === 0) {
        clearInterval(interval)
        endSession('timeout')
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [expiresAt, notified])

  const endSession = useCallback(async (reason: string = 'manual') => {
    await fetch('/api/admin/impersonation/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, reason }),
    })
    router.push('/admin')
    router.refresh()
  }, [sessionId, router])

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const isWarning = secondsLeft <= 300
  const bg = isWarning ? '#EF4444' : '#F59E0B'
  const label = targetName ? `${targetName} (${targetEmail})` : targetEmail

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: bg, color: '#fff', padding: '10px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600,
    }}>
      <span>👁 Viewing as: <strong>{label}</strong></span>
      <span style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <span>{String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')} remaining</span>
        <button
          onClick={() => window.open('/dashboard', '_blank')}
          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
        >
          ↗ Open dashboard
        </button>
        <button
          onClick={() => endSession('manual')}
          style={{ background: 'rgba(255,255,255,0.3)', border: 'none', color: '#fff', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
        >
          ✕ Exit
        </button>
      </span>
    </div>
  )
}
