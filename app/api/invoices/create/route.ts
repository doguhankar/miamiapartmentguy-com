import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createInvoiceFromLead } from '@/lib/ar-invoices'

export const runtime = 'nodejs'
export const maxDuration = 30

// Creates a draft AR invoice from a Closed Won lead. Sends nothing.
export async function POST(request: NextRequest) {
  const admin = createAdminClient()

  const accessToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: userData, error: userError } = await admin.auth.getUser(accessToken)
  const email = userData.user?.email?.toLowerCase()
  if (userError || !email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: allowed } = await admin.from('agent_allowlist').select('email').ilike('email', email).eq('approved', true).limit(1)
  if (!allowed?.length) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = (await request.json().catch(() => null)) as { leadId?: number | string } | null
  const leadId = Number(body?.leadId)
  if (!Number.isInteger(leadId)) return NextResponse.json({ error: 'Pick a closed deal' }, { status: 400 })

  const { data: lead } = await admin
    .from('leads')
    .select('id,name,agent_id,stage,building_id,building_name,unit,lease_start,lease_term_months,commission_actual')
    .eq('id', leadId)
    .maybeSingle()
  if (!lead) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
  if ((lead.agent_id ?? '').toLowerCase() !== email) return NextResponse.json({ error: 'That deal belongs to another agent' }, { status: 403 })
  if (lead.stage !== 'Closed Won') return NextResponse.json({ error: 'Deal is not Closed Won yet' }, { status: 409 })
  if (lead.commission_actual == null) return NextResponse.json({ error: 'Add the commission amount on the deal first' }, { status: 409 })

  try {
    const { id, invoiceNumber } = await createInvoiceFromLead(admin, lead)
    await admin.from('leads').update({ invoice_number: invoiceNumber }).eq('id', leadId)
    return NextResponse.json({ id, invoiceNumber })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invoice could not be created'
    console.error(`[invoices/create] lead ${leadId}:`, message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
