import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendGuestCardEmail } from '@/lib/guest-card-email'

export async function POST(request: NextRequest) {
  const body = await request.json() as { leadId?: string }
  const leadId = Number(body.leadId)
  if (!Number.isInteger(leadId)) return NextResponse.json({ error: 'Invalid lead id' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: lead, error: leadError } = await supabase.from('leads').select('id,name,email,phone,move_in_timing,beds,budget,credit_range,agent_id,building_id').eq('id', leadId).maybeSingle()
  if (leadError || !lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (!lead.building_id) return NextResponse.json({ error: 'This lead has no selected building' }, { status: 422 })

  const { data: building, error: buildingError } = await supabase.from('buildings').select('id,name,contact_emails').eq('id', lead.building_id).maybeSingle()
  if (buildingError || !building) return NextResponse.json({ error: 'Building not found' }, { status: 404 })
  const recipients = Array.isArray(building.contact_emails) ? building.contact_emails : []
  const ccRecipients = ['don@miamiapartmentguy.com']
  const { data: attempt, error: logError } = await supabase.from('guest_card_sends').insert({ lead_id: lead.id, building_id: building.id, recipients, cc_recipients: ccRecipients, status: 'sending' }).select('id,created_at').single()
  if (logError || !attempt) return NextResponse.json({ error: 'Could not create send log' }, { status: 500 })

  const result = await sendGuestCardEmail({ id: lead.id, name: lead.name ?? '', email: lead.email ?? '', phone: lead.phone ?? '', moveDate: lead.move_in_timing ?? '', apartmentSize: lead.beds ?? '', budget: lead.budget ?? '', creditScore: lead.credit_range ?? '', agent: lead.agent_id ?? 'Miami Apartment Guy', buildingName: building.name, contactEmails: recipients })
  const now = new Date().toISOString()
  await supabase.from('guest_card_sends').update({ status: result.sent ? 'sent' : 'failed', resend_id: result.id ?? null, error_message: result.error ?? null, sent_at: result.sent ? now : null, updated_at: now }).eq('id', attempt.id)
  if (!result.sent) return NextResponse.json({ error: result.error || 'Guest card could not be sent', attemptId: attempt.id }, { status: 502 })
  return NextResponse.json({ success: true, attemptId: attempt.id, sentAt: now, resendId: result.id })
}

export async function GET(request: NextRequest) {
  const leadId = Number(new URL(request.url).searchParams.get('leadId'))
  if (!Number.isInteger(leadId)) return NextResponse.json({ error: 'Invalid lead id' }, { status: 400 })
  const { data, error } = await createAdminClient().from('guest_card_sends').select('id,status,created_at,sent_at,error_message').eq('lead_id', leadId).order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ send: data })
}
