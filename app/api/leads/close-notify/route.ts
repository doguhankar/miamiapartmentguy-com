import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { postMessage, resolveChannelId, slackEscape, uploadFile } from '@/lib/slack-bot'
import { buildInvoicePdf, formatIsoDate, usd } from '@/lib/invoice-pdf'

export const runtime = 'nodejs'
export const maxDuration = 30

type Step = { ok: boolean; error?: string; skipped?: string }

const failure = (label: string, leadId: number, error: unknown): Step => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[close-notify] ${label} failed for lead ${leadId}:`, message)
  return { ok: false, error: message }
}

export async function POST(request: NextRequest) {
  const admin = createAdminClient()

  const accessToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: userData, error: userError } = await admin.auth.getUser(accessToken)
  const email = userData.user?.email
  if (userError || !email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: allowed } = await admin.from('agent_allowlist').select('email').ilike('email', email).limit(1)
  if (!allowed?.length) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = (await request.json().catch(() => null)) as { leadId?: number | string } | null
  const leadId = Number(body?.leadId)
  if (!Number.isInteger(leadId)) return NextResponse.json({ error: 'Invalid lead id' }, { status: 400 })

  const { data: lead, error: leadError } = await admin
    .from('leads')
    .select('id,name,agent_id,stage,building_name,unit,lease_start,lease_term_months,lease_rent,commission_actual,closed_at,invoice_number,invoice_sent_at,close_notes')
    .eq('id', leadId)
    .maybeSingle()
  if (leadError || !lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (lead.stage !== 'Closed Won') return NextResponse.json({ error: 'Lead is not Closed Won' }, { status: 409 })
  if (lead.invoice_sent_at) return NextResponse.json({ closes: { ok: true, skipped: 'already processed' }, invoice: { ok: true, skipped: 'already sent' } })

  const name = lead.name ?? 'Unknown'
  const building = lead.building_name ?? 'Unknown building'
  const unit = lead.unit || 'n/a'
  const rent = lead.lease_rent != null ? Number(lead.lease_rent) : null
  const commission = lead.commission_actual != null ? Number(lead.commission_actual) : null
  const agent = lead.agent_id ?? 'unassigned'
  const closeNotes = lead.close_notes?.trim() || null

  let closes: Step
  try {
    const channel = await resolveChannelId('closes', process.env.SLACK_CLOSES_CHANNEL_ID).catch(() => '#closes')
    await postMessage(channel, [
      `*Lead closed: ${slackEscape(name)}*`,
      `Building: ${slackEscape(building)}  |  Unit: ${slackEscape(unit)}`,
      `Lease rent: ${rent != null ? usd(rent) : 'n/a'}/mo  |  Commission: ${commission != null ? usd(commission) : 'not calculated'}`,
      `Closed by: ${slackEscape(agent)}`,
      ...(closeNotes ? [`Close notes: ${slackEscape(closeNotes)}`] : []),
    ].join('\n'))
    closes = { ok: true }
  } catch (error) {
    closes = failure('#closes post', leadId, error)
  }

  let invoice: Step
  if (commission == null || rent == null) {
    invoice = { ok: false, skipped: 'no commission amount to invoice' }
    console.error(`[close-notify] invoice skipped for lead ${leadId}: commission_actual or lease_rent is empty`)
  } else {
    try {
      const closedAt = lead.closed_at ? new Date(lead.closed_at) : new Date()
      const invoiceNumber = lead.invoice_number || `MAG-${closedAt.toISOString().slice(0, 7).replace('-', '')}-${String(lead.id).padStart(4, '0')}`
      const pdf = await buildInvoicePdf({
        invoiceNumber,
        issuedOn: new Date(),
        leadName: name,
        buildingName: building,
        unit: lead.unit ?? '',
        leaseStart: lead.lease_start,
        leaseTermMonths: lead.lease_term_months,
        leaseRent: rent,
        commissionOwed: commission,
        notes: closeNotes,
      })
      if (!lead.invoice_number) await admin.from('leads').update({ invoice_number: invoiceNumber }).eq('id', leadId)

      const channelId = await resolveChannelId('invoices', process.env.SLACK_INVOICES_CHANNEL_ID)
      await uploadFile({
        channelId,
        filename: `${invoiceNumber}.pdf`,
        title: `Invoice ${invoiceNumber}`,
        bytes: pdf,
        comment: [
          `*Invoice ${invoiceNumber}*`,
          `Building: ${slackEscape(building)}  |  Unit: ${slackEscape(unit)}`,
          `Tenant: ${slackEscape(name)}  |  Lease start: ${formatIsoDate(lead.lease_start)}`,
          `Lease rent: ${usd(rent)}/mo  |  Commission owed: ${usd(commission)}`,
          ...(closeNotes ? [`Close notes: ${slackEscape(closeNotes)}`] : []),
        ].join('\n'),
      })
      const { error: stampError } = await admin.from('leads').update({ invoice_sent_at: new Date().toISOString() }).eq('id', leadId)
      if (stampError) console.error(`[close-notify] invoice_sent_at not saved for lead ${leadId}:`, stampError.message)
      invoice = { ok: true }
    } catch (error) {
      invoice = failure('invoice PDF/upload', leadId, error)
    }
  }

  return NextResponse.json({ closes, invoice })
}
