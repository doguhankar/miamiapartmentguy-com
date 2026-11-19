import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/mag/sync
//
// Two modes, determined by the body shape:
//
// Mode A — single AI analysis (existing, from analyze.py --write-crm):
//   { phone, imessage_analysis, imessage_stage, imessage_last_seen }
//   Updates the iMessage columns on the matching leads row by phone.
//
// Mode B — bulk scanner contacts (new, from sync_contacts.py):
//   { contacts: [{ handle, name, tier, last_seen, ... }] }
//   For each contact, updates imessage_stage + imessage_last_seen on the
//   matching leads row (by phone). Contacts without a CRM row are skipped
//   until a mag_contacts table is available. Never creates duplicate leads.
//
// Auth: Authorization: Bearer <MAG_SYNC_SECRET>

function auth(req: NextRequest): boolean {
  const secret = process.env.MAG_SYNC_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

export async function POST(req: NextRequest) {
  if (!process.env.MAG_SYNC_SECRET) {
    return NextResponse.json({ error: 'Sync endpoint not configured' }, { status: 503 })
  }
  if (!auth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Mode B: bulk contacts
  if (body && typeof body === 'object' && 'contacts' in (body as object)) {
    const { contacts } = body as { contacts: unknown[] }
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: 'contacts must be a non-empty array' }, { status: 400 })
    }

    let updated = 0
    let skipped = 0
    const errors: string[] = []

    for (const c of contacts) {
      const contact = c as any
      const phone: string | undefined = contact.handle
      if (!phone || typeof phone !== 'string') { skipped++; continue }

      const payload: Record<string, unknown> = {
        imessage_stage: contact.tier ?? null,
        imessage_last_seen: contact.last_seen ?? null,
      }

      const { error, count } = await supabase
        .from('leads')
        .update(payload)
        .eq('phone', phone)
        .select('id', { count: 'exact', head: true })

      if (error) {
        errors.push(`${phone}: ${error.message}`)
      } else if ((count ?? 0) === 0) {
        skipped++ // no matching CRM lead for this phone
      } else {
        updated++
      }
    }

    return NextResponse.json({
      ok: true,
      mode: 'bulk',
      updated,
      skipped,
      total: contacts.length,
      errors: errors.length ? errors.slice(0, 10) : undefined,
    })
  }

  // Mode A: single AI analysis
  const { phone, imessage_analysis, imessage_stage, imessage_last_seen } = body as any
  if (!phone || typeof phone !== 'string') {
    return NextResponse.json({ error: 'phone is required' }, { status: 400 })
  }

  const payload: Record<string, unknown> = {}
  if (imessage_analysis !== undefined) payload.imessage_analysis = imessage_analysis
  if (imessage_stage !== undefined) payload.imessage_stage = imessage_stage
  if (imessage_last_seen !== undefined) payload.imessage_last_seen = imessage_last_seen

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const { error } = await supabase
    .from('leads')
    .update(payload)
    .eq('phone', phone)

  if (error) {
    console.error('[mag/sync] Supabase error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, mode: 'single', phone })
}

export async function GET() {
  return NextResponse.json({ status: 'MAG sync endpoint ready', version: 2 })
}
