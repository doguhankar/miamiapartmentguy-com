import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendGuestCardEmail } from '@/lib/guest-card-email'

const AGENTS: Record<string, { name: string; license: string; phone: string; email: string }> = {
  seb: { name: 'Sebastian', license: 'SL0000000', phone: '+1 (305) 000-0000', email: 'seb@miamiapartmentguy.com' },
  don: { name: 'Doğuhan (Don) Karahan', license: 'SL3581300', phone: '+1 (407) 765-7306', email: 'don@miamiapartmentguy.com' },
}

export async function POST(request: NextRequest) {
  const body = await request.json() as { leadId?: string; buildingIds?: string[] }
  const leadId = Number(body.leadId)
  if (!Number.isInteger(leadId)) return NextResponse.json({ error: 'Invalid lead id' }, { status: 400 })
  const supabase = createAdminClient()
  const { data: lead, error: leadError } = await supabase.from('leads').select('id,name,email,phone,move_in_timing,beds,budget,agent_id,building_id').eq('id', leadId).maybeSingle()
  if (leadError || !lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  const ids = body.buildingIds?.length ? body.buildingIds : lead.building_id ? [lead.building_id] : []
  if (!ids.length) return NextResponse.json({ error: 'Select at least one building' }, { status: 422 })
  const { data: buildings, error: buildingError } = await supabase.from('buildings').select('id,name,contact_emails').in('id', ids).eq('is_archived', false)
  if (buildingError) return NextResponse.json({ error: 'Buildings not found' }, { status: 404 })
  const agent = AGENTS[(lead.agent_id ?? 'don').toLowerCase()] ?? AGENTS.don
  const results = await Promise.all((buildings ?? []).map(async building => {
    const recipients = Array.isArray(building.contact_emails) ? building.contact_emails.filter(Boolean) : []
    const ccRecipients = ['don@miamiapartmentguy.com']
    const { data: attempt } = await supabase.from('guest_card_sends').insert({ lead_id: lead.id, building_id: building.id, recipients, cc_recipients: ccRecipients, status: 'sending' }).select('id').single()
    if (!attempt) return { buildingId: building.id, sent: false, skipped: true }
    if (!recipients.length) { await supabase.from('guest_card_sends').update({ status: 'failed', error_message: 'No email on file', updated_at: new Date().toISOString() }).eq('id', attempt.id); return { buildingId: building.id, sent: false, skipped: true } }
    const result = await sendGuestCardEmail({ id: `${lead.id}-${building.id}`, name: lead.name ?? '', email: lead.email ?? '', phone: lead.phone ?? '', moveDate: lead.move_in_timing ?? '', budget: lead.budget === 'You tell me' ? 'Flexible' : lead.budget ?? '', agent: agent.name, agentLicense: agent.license, agentPhone: agent.phone, agentEmail: agent.email, buildingName: building.name, contactEmails: recipients })
    const now = new Date().toISOString()
    await supabase.from('guest_card_sends').update({ status: result.sent ? 'sent' : 'failed', resend_id: result.id ?? null, error_message: result.error ?? null, sent_at: result.sent ? now : null, updated_at: now }).eq('id', attempt.id)
    return { buildingId: building.id, sent: result.sent, sentAt: result.sent ? now : null, skipped: false, error: result.error }
  }))
  return NextResponse.json({ results })
}

export async function GET(request: NextRequest) {
  const leadId = Number(new URL(request.url).searchParams.get('leadId'))
  if (!Number.isInteger(leadId)) return NextResponse.json({ error: 'Invalid lead id' }, { status: 400 })
  const { data, error } = await createAdminClient()
    .from('guest_card_sends')
    .select('building_id,status,created_at,sent_at,error_message')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const latestByBuilding = new Map<string, (typeof data)[number]>()
  for (const send of data ?? []) {
    if (!latestByBuilding.has(send.building_id)) latestByBuilding.set(send.building_id, send)
  }

  return NextResponse.json({ sends: Array.from(latestByBuilding.values()) })
}
