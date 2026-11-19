import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Called by the local Mac scanner (analyze.py with --write-crm) through a
// server-side API route so the service role key never reaches the browser.
// Requires MAG_SYNC_SECRET in env to authenticate.

export async function POST(req: NextRequest) {
  const secret = process.env.MAG_SYNC_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Sync endpoint not configured' }, { status: 503 })
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { phone, imessage_analysis, imessage_stage, imessage_last_seen } = body as any

  if (!phone || typeof phone !== 'string') {
    return NextResponse.json({ error: 'phone is required' }, { status: 400 })
  }

  // Only update the iMessage columns — never touch manual stage/notes/etc.
  const payload: Record<string, unknown> = {}
  if (imessage_analysis !== undefined) payload.imessage_analysis = imessage_analysis
  if (imessage_stage !== undefined) payload.imessage_stage = imessage_stage
  if (imessage_last_seen !== undefined) payload.imessage_last_seen = imessage_last_seen

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('leads')
    .update(payload)
    .eq('phone', phone)

  if (error) {
    console.error('[mag/sync] Supabase error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, phone })
}

export async function GET() {
  return NextResponse.json({ status: 'MAG sync endpoint ready' })
}
