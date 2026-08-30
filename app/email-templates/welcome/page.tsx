'use client'

import { useEffect, useState } from 'react'
import EmailEditor from '@/components/EmailEditor'
import {
  getEmailTemplate,
  saveEmailTemplate,
  sendTestWelcomeEmail,
} from '@/actions/email-templates'

export default function WelcomeEmailTemplatePage() {
  const [subject, setSubject] = useState('')
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    async function load() {
      const template = await getEmailTemplate('welcome')
      if (template) {
        setSubject(template.subject)
        setHtml(template.html_content)
      } else {
        setSubject('Welcome to Nowhere Isle')
        setHtml('<h1>Welcome!</h1><p>Thanks for subscribing.</p>')
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    const result = await saveEmailTemplate({
      id: 'welcome',
      subject,
      html_content: html,
    })

    setSaving(false)
    setMessage(result.success ? 'Template saved' : result.error || 'Save failed')
  }

  const handleTest = async () => {
    const email = prompt('Send test welcome email to:')
    if (!email) return

    setMessage('Sending test...')
    const result = await sendTestWelcomeEmail(email)
    setMessage(result.success ? 'Test email sent' : result.error || 'Test failed')
  }

  if (loading) return <div className="p-8">Loading template...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Welcome Email</h1>
        <p className="text-zinc-400 mt-2">
          This email is sent automatically when someone subscribes.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm text-zinc-400">
        Available variables:
        <code className="mx-1 text-zinc-200">{'{{email}}'}</code>,
        <code className="mx-1 text-zinc-200">{'{{site_url}}'}</code>
      </div>

      <div>
        <label className="block text-sm mb-2">Subject</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setPreview(false)}
          className={`px-4 py-2 rounded-xl ${!preview ? 'bg-white text-black' : 'bg-zinc-800'}`}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setPreview(true)}
          className={`px-4 py-2 rounded-xl ${preview ? 'bg-white text-black' : 'bg-zinc-800'}`}
        >
          Preview
        </button>
      </div>

      {preview ? (
        <div
          className="bg-white text-black rounded-2xl p-6 min-h-[300px]"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <EmailEditor content={html} onChange={setHtml} />
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-white text-black rounded-2xl font-medium disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Template'}
        </button>

        <button
          onClick={handleTest}
          className="px-6 py-3 border border-zinc-600 rounded-2xl"
        >
          Send Test Email
        </button>
      </div>

      {message && <p className="text-sm text-zinc-400">{message}</p>}
    </div>
  )
}

export const dynamic = 'force-dynamic'
