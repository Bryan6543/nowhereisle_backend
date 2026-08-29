'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getCampaigns } from '@/actions/campaigns'
import type { Campaign } from '@/types'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCampaigns().then((data) => {
      setCampaigns(data)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">Campaigns</h1>
          <p className="text-zinc-400 mt-2">Drafts, scheduled, and sent emails</p>
        </div>
        <Link href="/campaigns/new" className="px-6 py-3 bg-white text-black rounded-2xl font-medium">
          + New Campaign
        </Link>
      </div>

      <div className="space-y-4">
        {campaigns.map((c) => (
          <Link
            key={c.id}
            href={`/campaigns/${c.id}`}
            className="block bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-600 transition"
          >
            <div className="flex justify-between items-start gap-4">
              <div>
                <h2 className="text-xl font-semibold">{c.subject}</h2>
                <p className="text-sm text-zinc-400 mt-1">
                  {c.status === 'sent' && `Sent to ${c.sent_count} · Opens ${c.open_count} · Clicks ${c.click_count}`}
                  {c.status === 'scheduled' && `Scheduled for ${new Date(c.scheduled_at!).toLocaleString()}`}
                  {c.status === 'draft' && `Draft · ${new Date(c.created_at).toLocaleDateString()}`}
                  {c.status === 'sending' && 'Sending...'}
                  {c.status === 'failed' && 'Failed'}
                </p>
                {c.segment_tags?.length > 0 && (
                  <p className="text-xs text-zinc-500 mt-2">
                    Segment: {c.segment_tags.join(', ')}
                  </p>
                )}
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-zinc-800 uppercase">
                {c.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}