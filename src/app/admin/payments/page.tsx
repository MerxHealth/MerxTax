'use client'
import { useEffect, useState } from 'react'

interface Client { id: string; full_name: string | null; email: string | null; plan: string | null; created_at: string }

const STATUS_FILTERS = ['All', 'solo', 'pro', 'agent', 'free']

export default function PaymentsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (search) params.set('search', search)
    if (filter !== 'All') params.set('plan', filter)
    fetch(`/api/admin/clients?${params}`)
      .then(r => r.json())
      .then(d => { setClients(d.clients ?? []); setTotal(d.total ?? 0) })
      .finally(() => setLoading(false))
  }, [page, search, filter])

  const totalPages = Math.ceil(total / 20)
  const planColor = (p: string | null) => {
    if (p === 'pro') return { bg: '#DBEAFE', color: '#1D4ED8' }
    if (p === 'agent') return { bg: '#D1FAE5', color: '#065F46' }
    if (p === 'solo') return { bg: '#FEF3C7', color: '#92400E' }
    return { bg: '#F3F4F6', color: '#374151' }
  }

  return (
    <div>
      <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 24, marginBottom: 24 }}>Subscriptions</h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search name or email..."
          style={{ flex: 1, minWidth: 200, padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 14 }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          {STATUS_FILTERS.map(f => (
            <button key={f} onClick={() => { setFilter(f); setPage(1) }}
              style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid', fontSize: 13, cursor: 'pointer', fontWeight: filter === f ? 700 : 400, background: filter === f ? '#111827' : '#fff', color: filter === f ? '#fff' : '#374151', borderColor: filter === f ? '#111827' : '#E5E7EB' }}>
              {f === 'All' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Sans, sans-serif' }}>
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              {['Name', 'Email', 'Plan', 'Joined', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6B7280' }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#9CA3AF' }}>Loading...</td></tr>
            ) : clients.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#9CA3AF' }}>No results</td></tr>
            ) : clients.map(c => {
              const { bg, color } = planColor(c.plan)
              return (
                <tr key={c.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: '#111827' }}>{c.full_name ?? '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: '#374151' }}>{c.email ?? '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: bg, color }}>{c.plan ?? 'free'}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B7280' }}>{new Date(c.created_at).toLocaleDateString('en-GB')}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <a href={`/admin/maintenance/clients/${c.id}`} style={{ fontSize: 13, color: '#01D98D', textDecoration: 'none', fontWeight: 600 }}>Manage →</a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #E5E7EB', cursor: 'pointer', background: '#fff' }}>← Prev</button>
          <span style={{ padding: '6px 12px', fontSize: 14, color: '#6B7280' }}>Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #E5E7EB', cursor: 'pointer', background: '#fff' }}>Next →</button>
        </div>
      )}
    </div>
  )
}
