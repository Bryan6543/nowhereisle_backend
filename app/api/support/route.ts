import { NextRequest, NextResponse } from 'next/server'
import { createSupportTicket } from '@/actions/support'

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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

    const result = await createSupportTicket({
      report_type: body.report_type,
      game_report_type: body.game_report_type,
      subject: body.subject,
      description: body.description,
      email: body.email,
    })

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
      headers: corsHeaders,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}