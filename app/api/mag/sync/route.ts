import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/mag/sync
//
// Two modes, determined by the body shape:
//
// Mode A — single AI analysis (from analyze.py --write-crm):
//   { phone, imessage_analysis, imessage_stage, imessage_last_seen }
//   Updates iMessage columns on the matching leads row AND upserts mag_contacts.
//
// Mode B — bulk scanner contacts (from sync_contacts.py):
//   { contacts: [{ handle, name, tier, last_seen, ... }] }
//   UPSERTs every contact into mag_contacts (primary source).
//   Also updates imessage_stage + imessage_last_seen on matching leads rows.
//   Contacts without a CRM row are written to mag_contacts and visible in Today.
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

  // Mode B: bulk contacts — primary path
  if (body && typeof body === 'object' && 'contacts' in (body as object)) {
    const { contacts } = body as { contacts: unknown[] }
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: 'contacts must be a non-empty array' }, { status: 400 })
    }

    let mag_upserted = 0
    let crm_updated = 0
    const errors: string[] = []
    const now = new Date().toISOString()

    for (const c of contacts) {
      const contact = c as any
      const phone: string | undefined = contact.handle
      if (!phone || typeof phone !== 'string') continue

      // 1. UPSERT into mag_contacts — every approved contact, regardless of CRM presence
      const { error: upsertErr } = await supabase
        .from('mag_contacts')
        .upsert({
          phone,
          display_name: contact.name || null,
          is_casa: contact.is_casa ?? false,
          tier: contact.tier ?? null,
          last_seen: contact.last_seen ?? null,
          first_seen: contact.first_seen ?? null,
          days_since_last: contact.days_since_last ?? null,
          unanswered_inbound: contact.unanswered_inbound ?? false,
          business_signals: contact.business_signals ?? 0,
          total_messages: contact.total_messages ?? 0,
          from_them: contact.from_them ?? 0,
          from_me: contact.from_me ?? 0,
          // Truncate preview to 200 chars; never store full content
          last_message_preview: contact.last_message
            ? String(contact.last_message).slice(0, 200)
            : null,
          synced_at: now,
        }, { onConflict: 'phone' })

      if (upsertErr) {
        errors.push(`mag_contacts ${phone}: ${upsertErr.message}`)
      } else {
        mag_upserted++
      }

      // 2. Also mirror tier/recency onto leads if a CRM row exists for this phone
      const { count } = await supabase
        .from('leads')
        .update({
          imessage_stage: contact.tier ?? null,
          imessage_last_seen: contact.last_seen ?? null,
        })
        .eq('phone', phone)
        .select('id', { count: 'exact', head: true })

      if ((count ?? 0) > 0) crm_updated++
    }

    return NextResponse.json({
      ok: true,
      mode: 'bulk',
      mag_upserted,
      crm_updated,
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

  // Also keep mag_contacts in sync if tier or recency changed
  if (imessage_stage || imessage_last_seen) {
    await supabase
      .from('mag_contacts')
      .update({
        ...(imessage_stage ? { tier: imessage_stage } : {}),
        ...(imessage_last_seen ? { last_seen: imessage_last_seen } : {}),
        synced_at: new Date().toISOString(),
      })
      .eq('phone', phone)
  }

  if (error) {
    console.error('[mag/sync] Supabase error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, mode: 'single', phone })
}

export async function GET() {
  return NextResponse.json({ status: 'MAG sync endpoint ready', version: 3 })
}
