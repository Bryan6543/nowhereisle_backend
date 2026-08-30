import { NextRequest, NextResponse } from 'next/server'
import {
  getSupportMessages,
  getSupportTicketByToken,
} from '@/actions/support'

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

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const corsHeaders = getCorsHeaders(req)

  try {
    const { token } = await context.params

    const ticket = await getSupportTicketByToken(token)
    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    const messages = await getSupportMessages(ticket.id)

    return NextResponse.json(
      { success: true, ticket, messages },
      { status: 200, headers: corsHeaders }
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}