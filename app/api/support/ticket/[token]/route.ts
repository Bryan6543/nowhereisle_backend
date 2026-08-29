import { NextRequest, NextResponse } from 'next/server'
import {
  getSupportMessages,
  getSupportTicketByToken,
} from '@/actions/support'

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
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