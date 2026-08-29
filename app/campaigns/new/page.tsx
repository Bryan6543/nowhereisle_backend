'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import EmailEditor from '@/components/EmailEditor'
import { saveCampaign, sendCampaignNow } from '@/actions/campaigns'

export default function NewCampaignPage() {
  const router = useRouter()
  const [subject, setSubject] = useState('')
  const [html, setHtml] = useState('<p>Write your email here...</p>')
  const [tags, setTags] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const segmentTags = tags
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)

  const handleSaveDraft = async () => {
    setLoading(true)
    const result = await saveCampaign({
      subject,
      html_content: html,
      segment_tags: segmentTags,
      status: 'draft',
    })
    setLoading(false)
    if (result.success) {
      setMessage('Draft saved')
      router.push('/campaigns')
    } else {
      setMessage(result.error || 'Failed')
    }
  }

  const handleSchedule = async () => {
    if (!scheduledAt) {
      alert('Pick a date and time')
      return
    }
    setLoading(true)
    const result = await saveCampaign({
      subject,
      html_content: html,
      segment_tags: segmentTags,
      scheduled_at: new Date(scheduledAt).toISOString(),
      status: 'scheduled',
    })
    setLoading(false)
    if (result.success) {
      setMessage('Campaign scheduled')
      router.push('/campaigns')
    } else {
      setMessage(result.error || 'Failed')
    }
  }

  const handleSendNow = async () => {
    if (!confirm('Send to matching subscribers now?')) return
    setLoading(true)

    const created = await saveCampaign({
      subject,
      html_content: html,
      segment_tags: segmentTags,
      status: 'draft',
    })

    if (!created.success || !created.campaign) {
      setMessage(created.error || 'Failed to create')
      setLoading(false)
      return
    }

    const sent = await sendCampaignNow(created.campaign.id)
    setLoading(false)

    if (sent.success) {
      setMessage(`Sent to ${sent.sent}/${sent.total}`)
      router.push('/campaigns')
    } else {
      setMessage(sent.error || 'Send failed')
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-4xl font-bold">New Campaign</h1>
      

      <div>
        <label className="block text-sm mb-2">Subject</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl"
        />
      </div>

      <div>
        <label className="block text-sm mb-2">
          Segment tags (optional, comma separated). Empty = all subscribers
        </label>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="vip, early-access"
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl"
        />
      </div>

      <div>
        <label className="block text-sm mb-2">Email body</label>
        <EmailEditor content={html} onChange={setHtml} />
      </div>

      <div>
        <label className="block text-sm mb-2">Schedule (optional)</label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={handleSaveDraft} disabled={loading} className="px-5 py-3 border border-zinc-600 rounded-xl">
          Save Draft
        </button>
        <button onClick={handleSchedule} disabled={loading} className="px-5 py-3 bg-zinc-100 text-black rounded-xl">
          Schedule
        </button>
        <button onClick={handleSendNow} disabled={loading} className="px-5 py-3 bg-white text-black rounded-xl font-medium">
          Send Now
        </button>
      </div>

      {message && <p className="text-sm text-zinc-400">{message}</p>}
    </div>
  )
}