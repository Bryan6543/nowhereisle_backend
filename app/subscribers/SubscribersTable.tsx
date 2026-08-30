'use client'

import { useState } from 'react'
import {
  updateSubscriberNote,
  deleteSubscriber,
} from '@/actions/subscribers'
import type { Subscriber } from '@/types'

export default function SubscribersTable({
  initialSubscribers,
  totalCount,
}: {
  initialSubscribers: Subscriber[]
  totalCount: number
}) {
  const [subscribers, setSubscribers] = useState(initialSubscribers)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editNote, setEditNote] = useState('')
  const [search, setSearch] = useState('')

  const filtered = subscribers.filter((s) =>
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  // Update note
  const handleUpdateNote = async (id: number) => {
    const result = await updateSubscriberNote(id, editNote)

    if (result.success) {
      setSubscribers((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, note: editNote.trim() || null } : s
        )
      )
      setEditingId(null)
      setEditNote('')
    } else {
      alert(result.error || 'Failed to update note')
    }
  }

  // Delete subscriber
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this subscriber?')) return

    const result = await deleteSubscriber(id)

    if (result.success) {
      setSubscribers((prev) => prev.filter((s) => s.id !== id))
    } else {
      alert(result.error || 'Failed to delete')
    }
  }

  // Export emails (one per line)
  const exportEmails = () => {
    const emails = subscribers
      .filter((s) => !s.unsubscribed_at)
      .map((s) => s.email)
      .join('\n')

    const blob = new Blob([emails], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `active_subscribers_${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
      <div className="p-5 border-b border-zinc-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <input
          type="text"
          placeholder="Search emails..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 w-full sm:w-80 focus:outline-none focus:border-zinc-600"
        />

        <button
          onClick={exportEmails}
          className="bg-green-600 hover:bg-green-500 px-6 py-3 rounded-xl font-medium transition flex items-center gap-2"
        >
          📧 Export Emails
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-sm text-zinc-400">
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Note</th>
              <th className="px-6 py-4">Subscribed On</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filtered.map((sub) => (
              <tr key={sub.id} className="hover:bg-zinc-800/50 transition">
                <td className="px-6 py-5 font-medium">{sub.email}</td>
                <td className="px-6 py-5">
                  {sub.unsubscribed_at ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-red-900/40 text-red-300">
                      Unsubscribed
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-900/40 text-green-300">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-6 py-5">
                  {editingId === sub.id ? (
                    <input
                      type="text"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      className="bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-1 w-full text-sm"
                      placeholder="Add note..."
                      autoFocus
                    />
                  ) : (
                    <span className="text-zinc-400 text-sm">
                      {sub.note || (
                        <span className="italic opacity-50">No note</span>
                      )}
                    </span>
                  )}
                </td>

                <td className="px-6 py-5 text-sm text-zinc-400">
                  {new Date(sub.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-5 text-center">
                  {editingId === sub.id ? (
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleUpdateNote(sub.id)}
                        className="text-green-400 hover:text-green-500 text-sm font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-zinc-400 hover:text-zinc-300 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={() => {
                          setEditingId(sub.id)
                          setEditNote(sub.note || '')
                        }}
                        className="text-blue-400 hover:text-blue-500"
                      >
                        Edit Note
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id)}
                        className="text-red-400 hover:text-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="text-center py-12 text-zinc-500">No subscribers found.</p>
      )}
    </div>
  )
}

export const dynamic = 'force-dynamic'
