import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { bearer, canWriteLeadFor, resolveActor } from '@/lib/inbox/authz'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Body =
  | { mode: 'link'; leadId: number }
  | { mode: 'create'; name?: string; phone?: string; email?: string; notes?: string }

// Link a conversation to an existing CRM lead, or create one. A DM does not become a lead on its own.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()
  const actor = await resolveActor(admin, bearer(request))
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!actor.approved) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = (await request.json().catch(() => null)) as Body | null
  if (!body || (body.mode !== 'link' && body.mode !== 'create')) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const { data: convo } = await admin
    .from('inbox_conversations')
    .select('id,agent_id,assigned_to,lead_id,channel,contact_name,contact_handle,contact_phone')
    .eq('id', id)
    .maybeSingle()
  // not found and not visible look the same
  if (!convo || !canWriteLeadFor(actor, convo)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const leadOwner = (convo.assigned_to ?? convo.agent_id).toLowerCase()

  if (body.mode === 'link') {
    const leadId = Number(body.leadId)
    if (!Number.isInteger(leadId)) return NextResponse.json({ error: 'Pick a lead' }, { status: 400 })
    const { data: lead } = await admin.from('leads').select('id,agent_id,name').eq('id', leadId).maybeSingle()
    if (!lead || (lead.agent_id ?? '').toLowerCase() !== leadOwner) {
      return NextResponse.json({ error: 'That lead is not in this conversation owner\'s pipeline' }, { status: 403 })
    }
    const { error } = await admin.from('inbox_conversations').update({ lead_id: leadId, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) return NextResponse.json({ error: 'Could not link the lead' }, { status: 500 })
    return NextResponse.json({ leadId, name: lead.name })
  }

  if (convo.lead_id) return NextResponse.json({ error: 'This conversation is already linked to a lead' }, { status: 409 })

  const name = (body.name ?? convo.contact_name ?? convo.contact_handle ?? '').trim()
  if (!name) return NextResponse.json({ error: 'A name is required' }, { status: 400 })
  const sourceLabel: Record<string, string> = { instagram: 'Instagram DM', tiktok: 'TikTok DM', other: 'Manychat' }

  const { data: lead, error } = await admin
    .from('leads')
    .insert({
      name,
      phone: body.phone?.trim() || convo.contact_phone || null,
      email: body.email?.trim() || null,
      notes: body.notes?.trim() || null,
      agent_id: leadOwner,
      source: sourceLabel[convo.channel] ?? 'Social inbox',
    })
    .select('id,name')
    .single()
  if (error || !lead) return NextResponse.json({ error: 'Could not create the lead' }, { status: 500 })

  await admin.from('inbox_conversations').update({ lead_id: lead.id, updated_at: new Date().toISOString() }).eq('id', id)
  return NextResponse.json({ leadId: lead.id, name: lead.name, created: true })
}
