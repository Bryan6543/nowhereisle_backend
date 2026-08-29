'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  getSupportMessages,
  getSupportTicketById,
  replyAsAdmin,
  updateSupportStatus,
} from '@/actions/support'
import type { SupportMessage, SupportStatus, SupportTicket } from '@/types'

export default function SupportTicketDetailPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string)

  const [ticket, setTicket] = useState<SupportTicket | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  async function load() {
    setLoading(true)
    const t = await getSupportTicketById(id)
    const m = t ? await getSupportMessages(t.id) : []
    setTicket(t)
    setMessages(m)
    setLoading(false)
  }

  useEffect(() => {
    if (id) load()
  }, [id])

  const handleStatus = async (status: SupportStatus) => {
    if (!ticket) return
    const result = await updateSupportStatus(ticket.id, status)
    if (result.success) load()
    else alert(result.error)
  }

  const handleReply = async () => {
    if (!ticket || !reply.trim()) return
    setSending(true)
    const result = await replyAsAdmin(ticket.id, reply)
    setSending(false)
    if (!result.success) {
      alert(result.error)
      return
    }
    setReply('')
    load()
  }

  if (loading) return <div className="p-8">Loading...</div>
  if (!ticket) return <div className="p-8">Ticket not found</div>

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <Link href="/support" className="text-sm text-zinc-400">← Back</Link>

      <div>
        <h1 className="text-3xl font-bold">{ticket.ticket_number}</h1>
        <p className="text-zinc-400 mt-1">{ticket.subject}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 text-sm">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-zinc-400">Status</p>
          <select
            value={ticket.status}
            onChange={(e) => handleStatus(e.target.value as SupportStatus)}
            className="mt-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 w-full"
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_on_customer">Waiting on customer</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-zinc-400">Email</p>
          <p className="mt-2">{ticket.email || 'No email'}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-zinc-400">Type</p>
          <p className="mt-2 capitalize">
            {ticket.report_type}
            {ticket.game_report_type ? ` / ${ticket.game_report_type}` : ''}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {messages.map((m) => (
          <div key={m.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <p className="text-xs text-zinc-500 mb-2">
              {m.sender_type === 'admin' ? 'Admin' : 'Customer'} · {new Date(m.created_at).toLocaleString()}
            </p>
            <p className="whitespace-pre-wrap">{m.message}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={5}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-4"
          placeholder="Write a reply to the customer..."
        />
        <button
          onClick={handleReply}
          disabled={sending}
          className="px-6 py-3 bg-white text-black rounded-2xl font-medium disabled:opacity-60"
        >
          {sending ? 'Sending...' : 'Send Reply + Email Customer'}
        </button>
      </div>
    </div>
  )
}