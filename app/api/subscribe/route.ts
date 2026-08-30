import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/actions/email-templates'

const allowedOrigins = [
  'https://www.nowhereisle.com',
  'https://nowhereisle.com',
  'http://localhost:3000',
]

function getCorsHeaders(req: NextRequest) {
  const origin = req.headers.get('origin') || ''
  const allow = allowedOrigins.includes(origin) ? origin : allowedOrigins[0]

  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(req),
  })
}

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req)

  try {
    const body = await req.json()
    const email = (body.email || '').toLowerCase().trim()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400, headers: corsHeaders }
      )
    }

    const supabase = createServerClient()

    // 1) Check if subscriber already exists
    const { data: existing, error: findError } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, unsubscribed_at, unsubscribe_token')
      .eq('email', email)
      .maybeSingle()

    if (findError) {
      console.error('Find subscriber error:', findError)
      return NextResponse.json(
        { success: false, error: findError.message },
        { status: 400, headers: corsHeaders }
      )
    }

    // 2) Already active subscriber
    if (existing && !existing.unsubscribed_at) {
      return NextResponse.json(
        {
          success: true,
          alreadySubscribed: true,
          message: "You're already subscribed!",
        },
        { status: 200, headers: corsHeaders }
      )
    }

    // 3) Previously unsubscribed -> resubscribe
    if (existing && existing.unsubscribed_at) {
      const { error: updateError } = await supabase
        .from('newsletter_subscribers')
        .update({
          unsubscribed_at: null,
          unsubscribe_token: crypto.randomUUID(),
        })
        .eq('id', existing.id)

      if (updateError) {
        console.error('Resubscribe error:', updateError)
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 400, headers: corsHeaders }
        )
      }

      await sendWelcomeEmail(email)

      return NextResponse.json(
        {
          success: true,
          resubscribed: true,
          message: 'Welcome back! You have been resubscribed.',
        },
        { status: 200, headers: corsHeaders }
      )
    }

    // 4) Brand new subscriber
    const { error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert({ email })

    if (insertError) {
      console.error('Subscribe insert error:', insertError)
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 400, headers: corsHeaders }
      )
    }

    await sendWelcomeEmail(email)

    return NextResponse.json(
      {
        success: true,
        alreadySubscribed: false,
        message: "Thank you! You've joined the mist.",
      },
      { status: 200, headers: corsHeaders }
    )
  } catch (err: any) {
    console.error(err)
    return NextResponse.json(
      { success: false, error: err.message || 'Server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}