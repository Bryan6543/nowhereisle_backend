'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import EmailEditor from '@/components/EmailEditor'
import {
  getCampaign,
  saveCampaign,
  sendCampaignNow,
} from '@/actions/campaigns'
import type { Campaign } from '@/types'

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string)

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Editable fields
  const [subject, setSubject] = useState('')
  const [html, setHtml] = useState('')
  const [tags, setTags] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')

  const isEditable =
    campaign?.status === 'draft' || campaign?.status === 'scheduled'

  useEffect(() => {
    async function load() {
      try {
        const data = await getCampaign(id)
        if (!data) {
          setError('Campaign not found')
          return
        }

        setCampaign(data)
        setSubject(data.subject || '')
        setHtml(data.html_content || '')
        setTags((data.segment_tags || []).join(', '))

        if (data.scheduled_at) {
          // datetime-local needs: YYYY-MM-DDTHH:mm
          const d = new Date(data.scheduled_at)
          const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16)
          setScheduledAt(local)
        } else {
          setScheduledAt('')
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load campaign')
      } finally {
        setLoading(false)
      }
    }

    if (id) load()
  }, [id])

  const segmentTags = tags
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)

  const handleSaveDraft = async () => {
    if (!campaign) return
    setSaving(true)
    setMessage('')

    const result = await saveCampaign({
      id: campaign.id,
      subject,
      html_content: html,
      segment_tags: segmentTags,
      scheduled_at: null,
      status: 'draft',
    })

    setSaving(false)

    if (!result.success) {
      setMessage(result.error || 'Failed to save')
      return
    }

    setCampaign(result.campaign || campaign)
    setMessage('Draft saved')
  }

  const handleSchedule = async () => {
    if (!campaign) return
    if (!scheduledAt) {
      alert('Pick a date and time to schedule')
      return
    }

    setSaving(true)
    setMessage('')

    const result = await saveCampaign({
      id: campaign.id,
      subject,
      html_content: html,
      segment_tags: segmentTags,
      scheduled_at: new Date(scheduledAt).toISOString(),
      status: 'scheduled',
    })

    setSaving(false)

    if (!result.success) {
      setMessage(result.error || 'Failed to schedule')
      return
    }

    setCampaign(result.campaign || campaign)
    setMessage('Campaign scheduled')
  }

  const handleSendNow = async () => {
    if (!campaign) return
    if (!confirm('Send this campaign to matching subscribers now?')) return

    setSaving(true)
    setMessage('Saving and sending...')

    // Save latest edits first
    const saved = await saveCampaign({
      id: campaign.id,
      subject,
      html_content: html,
      segment_tags: segmentTags,
      scheduled_at: null,
      status: 'draft',
    })

    if (!saved.success || !saved.campaign) {
      setSaving(false)
      setMessage(saved.error || 'Failed to save before send')
      return
    }

    const sent = await sendCampaignNow(saved.campaign.id)
    setSaving(false)

    if (!sent.success) {
      setMessage(sent.error || 'Send failed')
      return
    }

    setMessage(`Sent to ${sent.sent}/${sent.total} subscribers`)
    router.push('/campaigns')
  }

  if (loading) return <div className="p-8">Loading campaign...</div>

  if (error || !campaign) {
    return (
      <div className="p-8">
        <p className="text-red-400 mb-4">{error || 'Campaign not found'}</p>
        <Link href="/campaigns" className="text-sm underline">
          ← Back to campaigns
        </Link>
      </div>
    )
  }

  // =========================
  // READ-ONLY for sent/failed
  // =========================
  if (!isEditable) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-8">
        <div>
          <Link href="/campaigns" className="text-sm text-zinc-400 hover:text-white">
            ← Back to campaigns
          </Link>
          <h1 className="text-3xl font-bold mt-2">{campaign.subject}</h1>
          <p className="text-zinc-400 mt-1 capitalize">Status: {campaign.status}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-sm text-zinc-400">Sent</p>
            <p className="text-2xl font-semibold mt-1">{campaign.sent_count || 0}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-sm text-zinc-400">Opens</p>
            <p className="text-2xl font-semibold mt-1">{campaign.open_count || 0}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-sm text-zinc-400">Clicks</p>
            <p className="text-2xl font-semibold mt-1">{campaign.click_count || 0}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-sm text-zinc-400">Open rate</p>
            <p className="text-2xl font-semibold mt-1">
              {campaign.sent_count
                ? Math.round(((campaign.open_count || 0) / campaign.sent_count) * 100)
                : 0}
              %
            </p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-2 text-sm">
          <p>
            <span className="text-zinc-400">Created:</span>{' '}
            {new Date(campaign.created_at).toLocaleString()}
          </p>
          {campaign.scheduled_at && (
            <p>
              <span className="text-zinc-400">Scheduled:</span>{' '}
              {new Date(campaign.scheduled_at).toLocaleString()}
            </p>
          )}
          {campaign.sent_at && (
            <p>
              <span className="text-zinc-400">Sent at:</span>{' '}
              {new Date(campaign.sent_at).toLocaleString()}
            </p>
          )}
          {campaign.segment_tags?.length > 0 && (
            <p>
              <span className="text-zinc-400">Segment tags:</span>{' '}
              {campaign.segment_tags.join(', ')}
            </p>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Email preview</h2>
          <div
            className="bg-white text-black rounded-2xl p-6 min-h-[200px] border border-zinc-700"
            dangerouslySetInnerHTML={{ __html: campaign.html_content }}
          />
        </div>
      </div>
    )
  }

  // =========================
  // EDITABLE for draft/scheduled
  // =========================
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/campaigns" className="text-sm text-zinc-400 hover:text-white">
          ← Back to campaigns
        </Link>
        <h1 className="text-3xl font-bold mt-2">Edit Campaign</h1>
        <p className="text-zinc-400 mt-1 capitalize">Status: {campaign.status}</p>
      </div>

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
          Segment tags (optional, comma separated)
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
        <button
          onClick={handleSaveDraft}
          disabled={saving}
          className="px-5 py-3 border border-zinc-600 rounded-xl disabled:opacity-50"
        >
          Save Draft
        </button>

        <button
          onClick={handleSchedule}
          disabled={saving}
          className="px-5 py-3 bg-zinc-100 text-black rounded-xl disabled:opacity-50"
        >
          Schedule
        </button>

        <button
          onClick={handleSendNow}
          disabled={saving}
          className="px-5 py-3 bg-white text-black rounded-xl font-medium disabled:opacity-50"
        >
          Send Now
        </button>
      </div>

      {message && <p className="text-sm text-zinc-400">{message}</p>}
    </div>
  )
}

export const dynamic = 'force-dynamic'