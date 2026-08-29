import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const type = payload?.type as string | undefined
    const data = payload?.data

    if (!type || !data) {
      return NextResponse.json({ ok: true })
    }

    let eventType: string | null = null
    if (type === 'email.opened') eventType = 'opened'
    if (type === 'email.clicked') eventType = 'clicked'
    if (type === 'email.delivered') eventType = 'delivered'
    if (type === 'email.bounced') eventType = 'bounced'
    if (type === 'email.complained') eventType = 'complained'

    if (!eventType) {
      return NextResponse.json({ ok: true })
    }

    const supabase = createServerClient()
    const emailId = data.email_id || data.id
    const toEmail = Array.isArray(data.to) ? data.to[0] : data.to

    // Try to find the campaign from a previous "sent" event
    const { data: existing } = await supabase
      .from('newsletter_email_events')
      .select('campaign_id')
      .eq('resend_email_id', emailId)
      .not('campaign_id', 'is', null)
      .limit(1)
      .maybeSingle()

    const campaignId = existing?.campaign_id || null

    await supabase.from('newsletter_email_events').insert({
      campaign_id: campaignId,
      email: toEmail || 'unknown',
      event_type: eventType,
      resend_email_id: emailId,
    })

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
  } catch (error: any) {
    console.error('Resend webhook error:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}