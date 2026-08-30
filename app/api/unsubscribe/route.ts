import { NextRequest, NextResponse } from 'next/server'
import { unsubscribeByToken } from '@/actions/subscribers'

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
    const token = req.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Missing token' },
        { status: 400, headers: corsHeaders }
      )
    }

    const result = await unsubscribeByToken(token)

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