'use client'

import { useEffect, useState } from 'react'
import { getSubscribers } from '@/actions/subscribers'
import { sendTestEmail } from '@/actions/newsletter'   // ← add this
import SubscribersTable from './SubscribersTable'
import type { Subscriber } from '@/types'

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testStatus, setTestStatus] = useState('')      // ← add this

  useEffect(() => {
    async function load() {
      try {
        setError(null)
        const { subscribers, count } = await getSubscribers()
        setSubscribers(subscribers)
        setCount(count)
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'Failed to load subscribers')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  // ---------- TEST EMAIL FUNCTION ----------
  const handleSendTest = async () => {
    const email = prompt('Enter the email address to send the test to:')
    if (!email) return

    setTestStatus('Sending...')
    const result = await sendTestEmail(email)

    if (result.success) {
      setTestStatus('✅ Test email sent successfully! Check your inbox.')
    } else {
      setTestStatus('❌ Failed: ' + (result.error || 'Unknown error'))
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading subscribers...</div>
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-400">
        Error: {error}
        <br />
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-red-600 rounded-lg hover:bg-red-500"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Newsletter Subscribers</h1>
          <p className="text-zinc-400 mt-2">
            Total Subscribers:{' '}
            <span className="text-white font-semibold">{count}</span>
          </p>
        </div>

        {/* Temporary Test Button */}
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={handleSendTest}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium"
          >
            Send Test Email
          </button>
          {testStatus && (
            <p className="text-sm text-zinc-400">{testStatus}</p>
          )}
        </div>
      </div>

      <SubscribersTable
        initialSubscribers={subscribers}
        totalCount={count}
      />
    </div>
  )
}