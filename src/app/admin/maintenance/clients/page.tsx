'use client'
// src/app/admin/maintenance/clients/page.tsx
import { useEffect, useState, useCallback } from 'react'

interface Client {
  id: string
  full_name: string | null
  email: string | null
  plan: string | null
  created_at: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [plan, setPlan] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  // Impersonation modal
  const [showModal, setShowModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [reason, setReason] = useState('')
  const [starting, setStarting] = useState(false)

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteClient, setDeleteClient] = useState<Client | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (search) params.set('search', search)
    if (plan) params.set('plan', plan)
    const res = await fetch(`/api/admin/clients?${params}`)
    const data = await res.json()
    setClients(data.clients ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [page, search, plan])

  useEffect(() => { fetchClients() }, [fetchClients])

  const openViewAs = (client: Client) => {
    setSelectedClient(client)
    setReason('')
    setShowModal(true)
  }

  const openDelete = (client: Client) => {
    setDeleteClient(client)
    setShowDeleteModal(true)
  }

  const startImpersonation = async () => {
    if (!selectedClient || reason.length < 10) return
    setStarting(true)
    const res = await fetch('/api/admin/impersonation/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_user_id: selectedClient.id, reason }),
    })
    if (res.ok) {
      setShowModal(false)
      window.location.href = '/dashboard'
    } else {
      alert('Failed to start impersonation')
      setStarting(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteClient) return
    setDeleting(true)
    const res = await fetch('/api/admin/clients/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: deleteClient.id }),
    })
    if (res.ok) {
      setShowDeleteModal(false)
      setDeleteClient(null)
      fetchClients()
    } else {
      const data = await res.json()
      alert(`Error: ${data.error ?? 'Failed to delete user'}`)
    }
    setDeleting(false)
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div>
      <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 24, marginBottom: 24 }}>Clients</h1>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search name or email..."
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}
        />
        <select
          value={plan}
          onChange={e => { setPlan(e.target.value); setPage(1) }}
          style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 14, fontFamily: 'DM Sans, sans-serif', background: '#fff' }}
        >
          <option value="">All plans</option>
          <option value="solo">Solo</option>
          <option value="pro">Pro</option>
          <option value="agent">Agent</option>
          <option value="free">Free</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Sans, sans-serif' }}>
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              {['Name', 'Email', 'Plan', 'Joined', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6B7280', letterSpacing: 0.5 }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#9CA3AF' }}>Loading...</td></tr>
            ) : clients.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#9CA3AF' }}>No clients found</td></tr>
            ) : clients.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '12px 16px', fontSize: 14, color: '#111827' }}>{c.full_name ?? '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: 14, color: '#374151' }}>{c.email ?? '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: c.plan === 'pro' ? '#DBEAFE' : c.plan === 'agent' ? '#D1FAE5' : '#F3F4F6', color: c.plan === 'pro' ? '#1D4ED8' : c.plan === 'agent' ? '#065F46' : '#374151' }}>
                    {c.plan ?? 'free'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B7280' }}>{new Date(c.created_at).toLocaleDateString('en-GB')}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a href={`/admin/maintenance/clients/${c.id}`} style={{ fontSize: 13, color: '#6B7280', textDecoration: 'none', padding: '4px 10px', border: '1px solid #E5E7EB', borderRadius: 4 }}>Edit</a>
                    <button onClick={() => openViewAs(c)} style={{ fontSize: 13, color: '#fff', background: '#01D98D', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>View as</button>
                    <button onClick={() => openDelete(c)} style={{ fontSize: 13, color: '#fff', background: '#EF4444', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #E5E7EB', cursor: 'pointer', background: '#fff' }}>← Prev</button>
          <span style={{ padding: '6px 12px', fontSize: 14, color: '#6B7280' }}>Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #E5E7EB', cursor: 'pointer', background: '#fff' }}>Next →</button>
        </div>
      )}

      {/* Impersonation Modal */}
      {showModal && selectedClient && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, width: 480, maxWidth: '90vw' }}>
            <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>View as {selectedClient.full_name ?? selectedClient.email}</h2>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 20 }}>This action will be logged. Session lasts 30 minutes.</p>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Reason (min 10 characters) *</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Support request #1234 — client cannot see invoices"
              rows={3}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 14, fontFamily: 'DM Sans, sans-serif', resize: 'vertical', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
              <button
                onClick={startImpersonation}
                disabled={reason.length < 10 || starting}
                style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: reason.length >= 10 ? '#01D98D' : '#D1D5DB', color: '#fff', cursor: reason.length >= 10 ? 'pointer' : 'not-allowed', fontSize: 14, fontWeight: 600 }}
              >
                {starting ? 'Starting...' : 'Start Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteClient && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, width: 440, maxWidth: '90vw' }}>
            <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 18, marginBottom: 8, color: '#111827' }}>Delete Account</h2>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 8 }}>
              You are about to permanently delete:
            </p>
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#991B1B' }}>{deleteClient.full_name ?? '—'}</div>
              <div style={{ fontSize: 13, color: '#B91C1C' }}>{deleteClient.email ?? '—'}</div>
            </div>
            <p style={{ fontSize: 13, color: '#EF4444', marginBottom: 20, fontWeight: 600 }}>
              ⚠ This action is irreversible. All user data will be permanently deleted.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteClient(null) }}
                style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 14 }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#EF4444', color: '#fff', cursor: deleting ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600 }}
              >
                {deleting ? 'Deleting...' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
