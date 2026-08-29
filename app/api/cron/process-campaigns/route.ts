import { NextResponse } from 'next/server'
import { processScheduledCampaigns } from '@/actions/campaigns'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET

  // If CRON_SECRET is set, require it
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await processScheduledCampaigns()
    return NextResponse.json({
      ok: true,
      processed: result.processed,
      time: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Cron error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed' },
      { status: 500 }
    )
  }
}