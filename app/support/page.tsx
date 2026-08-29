'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupportTickets } from '@/actions/support'
import type { SupportTicket } from '@/types'

export default function SupportAdminPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    getSupportTickets().then((data) => {
      setTickets(data)
      setLoading(false)
    })
  }, [])

  const filtered = tickets
    .filter((t) => (filter === 'all' ? true : t.status === filter))
    .filter(
      (t) =>
        t.subject.toLowerCase().includes(search.toLowerCase()) ||
        t.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
        (t.email || '').toLowerCase().includes(search.toLowerCase())
    )

  if (loading) return <div className="p-8">Loading tickets...</div>

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">Support Tickets</h1>
      <p className="text-zinc-400 mb-8">Manage and reply to customer requests</p>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ticket, subject, email..."
          className="bg-zinc-900 border border-zinc-700 rounded-xl px-5 py-3 flex-1"
        />
        <div className="flex gap-2 flex-wrap">
          {['all', 'open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm ${
                filter === s ? 'bg-red-600' : 'bg-zinc-900 border border-zinc-700'
              }`}
            >
              {s.replaceAll('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-zinc-400 border-b border-zinc-800">
              <th className="px-6 py-4">Ticket</th>
              <th className="px-6 py-4">Subject</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-zinc-800/40">
                <td className="px-6 py-4 font-medium">{t.ticket_number}</td>
                <td className="px-6 py-4">{t.subject}</td>
                <td className="px-6 py-4 text-zinc-400">{t.email || '—'}</td>
                <td className="px-6 py-4 capitalize">{t.status.replaceAll('_', ' ')}</td>
                <td className="px-6 py-4 text-zinc-400">
                  {new Date(t.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <Link href={`/support/${t.id}`} className="text-blue-400 hover:text-blue-300">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}