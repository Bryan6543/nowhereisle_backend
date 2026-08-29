'use server'

import { createServerClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend'
import { revalidatePath } from 'next/cache'
import type { Campaign } from '@/types'
import { getActiveSubscribers } from './subscribers'

export async function getCampaigns(): Promise<Campaign[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('newsletter_campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return []
  }
  return (data as Campaign[]) || []
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('newsletter_campaigns')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Campaign
}

export async function saveCampaign(input: {
  id?: string
  subject: string
  html_content: string
  segment_tags?: string[]
  scheduled_at?: string | null
  status?: 'draft' | 'scheduled'
}) {
  const supabase = createServerClient()

  if (!input.subject.trim() || !input.html_content.trim()) {
    return { success: false, error: 'Subject and content are required' }
  }

  const payload = {
    subject: input.subject.trim(),
    html_content: input.html_content,
    segment_tags: input.segment_tags || [],
    scheduled_at: input.scheduled_at || null,
    status: input.status || 'draft',
  }

  if (input.id) {
    const { data, error } = await supabase
      .from('newsletter_campaigns')
      .update(payload)
      .eq('id', input.id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/campaigns')
    return { success: true, campaign: data as Campaign }
  }

  const { data, error } = await supabase
    .from('newsletter_campaigns')
    .insert(payload)
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/campaigns')
  return { success: true, campaign: data as Campaign }
}

export async function sendCampaignNow(campaignId: string) {
  const supabase = createServerClient()

  const { data: campaign, error } = await supabase
    .from('newsletter_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (error || !campaign) {
    return { success: false, error: 'Campaign not found' }
  }

  if (campaign.status === 'sent') {
    return { success: false, error: 'Already sent' }
  }

  // Mark as sending
  await supabase
    .from('newsletter_campaigns')
    .update({ status: 'sending' })
    .eq('id', campaignId)

  const subscribers = await getActiveSubscribers(campaign.segment_tags || [])

  if (subscribers.length === 0) {
    await supabase
      .from('newsletter_campaigns')
      .update({ status: 'failed' })
      .eq('id', campaignId)
    return { success: false, error: 'No matching active subscribers' }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  let successCount = 0

  for (const sub of subscribers) {
    const unsubscribeUrl = `${siteUrl}/unsubscribe?token=${sub.unsubscribe_token}`

    const htmlWithFooter = `
      ${campaign.html_content}
      <hr style="margin-top:40px;border:none;border-top:1px solid #eee;" />
      <p style="font-size:12px;color:#888;text-align:center;">
        You received this because you subscribed to Nowhere Isle.<br/>
        <a href="${unsubscribeUrl}" style="color:#888;">Unsubscribe</a>
      </p>
    `

    try {
      const { data, error: sendError } = await resend.emails.send({
        from: 'Nowhere Isle <onboarding@resend.dev>', // change later
        to: sub.email,
        subject: campaign.subject,
        html: htmlWithFooter,
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
        },
        tags: [
          { name: 'campaign_id', value: campaignId },
        ],
      })

      if (!sendError && data?.id) {
        successCount++
        await supabase.from('newsletter_email_events').insert({
          campaign_id: campaignId,
          email: sub.email,
          event_type: 'sent',
          resend_email_id: data.id,
        })
      }
    } catch (err) {
      console.error('Send error for', sub.email, err)
    }
  }

  await supabase
    .from('newsletter_campaigns')
    .update({
      status: successCount > 0 ? 'sent' : 'failed',
      sent_count: successCount,
      sent_at: new Date().toISOString(),
    })
    .eq('id', campaignId)

  revalidatePath('/campaigns')
  return {
    success: successCount > 0,
    sent: successCount,
    total: subscribers.length,
  }
}

// Used by cron to send scheduled campaigns
export async function processScheduledCampaigns() {
  const supabase = createServerClient()
  const now = new Date().toISOString()

  const { data: due } = await supabase
    .from('newsletter_campaigns')
    .select('id')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)

  if (!due || due.length === 0) {
    return { processed: 0 }
  }

  let processed = 0
  for (const c of due) {
    await sendCampaignNow(c.id)
    processed++
  }

  return { processed }
}