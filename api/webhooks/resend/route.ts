import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const payload = await req.json()

  // Resend event shapes vary slightly; adjust as needed
  const type = payload?.type as string
  const data = payload?.data

  if (!type || !data) {
    return NextResponse.json({ ok: true })
  }

  const supabase = createServerClient()

  const emailId = data.email_id || data.id
  const toEmail = Array.isArray(data.to) ? data.to[0] : data.to

  // Map Resend events
  let eventType: string | null = null
  if (type === 'email.opened') eventType = 'opened'
  if (type === 'email.clicked') eventType = 'clicked'
  if (type === 'email.delivered') eventType = 'delivered'
  if (type === 'email.bounced') eventType = 'bounced'
  if (type === 'email.complained') eventType = 'complained'

  if (!eventType) {
    return NextResponse.json({ ok: true })
  }

  // Find campaign via previously stored resend_email_id
  const { data: existing } = await supabase
    .from('newsletter_email_events')
    .select('campaign_id')
    .eq('resend_email_id', emailId)
    .limit(1)
    .maybeSingle()

  const campaignId = existing?.campaign_id

  await supabase.from('newsletter_email_events').insert({
    campaign_id: campaignId || null,
    email: toEmail || 'unknown',
    event_type: eventType,
    resend_email_id: emailId,
  })

  if (campaignId && (eventType === 'opened' || eventType === 'clicked')) {
    if (eventType === 'opened') {
      await supabase.rpc('increment_campaign_open', { campaign_id: campaignId })
      // or manual update:
      // fetch current open_count then +1
    }
    if (eventType === 'clicked') {
      // same for click_count
    }
  }

  // Simple manual increment without RPC:
  if (campaignId && eventType === 'opened') {
    const { data: camp } = await supabase
      .from('newsletter_campaigns')
      .select('open_count')
      .eq('id', campaignId)
      .single()
    if (camp) {
      await supabase
        .from('newsletter_campaigns')
        .update({ open_count: (camp.open_count || 0) + 1 })
        .eq('id', campaignId)
    }
  }

  if (campaignId && eventType === 'clicked') {
    const { data: camp } = await supabase
      .from('newsletter_campaigns')
      .select('click_count')
      .eq('id', campaignId)
      .single()
    if (camp) {
      await supabase
        .from('newsletter_campaigns')
        .update({ click_count: (camp.click_count || 0) + 1 })
        .eq('id', campaignId)
    }
  }

  return NextResponse.json({ ok: true })
}