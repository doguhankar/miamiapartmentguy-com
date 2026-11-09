import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildInvoicePdf, INVOICE_AGENTS } from '@/lib/invoice-pdf'
import { resolveInvoiceAgent, invoicePdfPath, AR_BUCKET } from '@/lib/ar-invoices'

export const runtime = 'nodejs'
export const maxDuration = 30

// Regenerates the PDF for an existing invoice using current DB data.
// Overwrites the file in storage and updates the attachment record.
export async function POST(request: NextRequest) {
  const admin = createAdminClient()

  const accessToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: userData, error: userError } = await admin.auth.getUser(accessToken)
  const email = userData.user?.email?.toLowerCase()
  if (userError || !email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: allowed } = await admin.from('agent_allowlist').select('email').ilike('email', email).eq('approved', true).limit(1)
  if (!allowed?.length) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = (await request.json().catch(() => null)) as { invoiceId?: number } | null
  const invoiceId = Number(body?.invoiceId)
  if (!Number.isInteger(invoiceId)) return NextResponse.json({ error: 'invoiceId required' }, { status: 400 })

  const { data: inv } = await admin
    .from('invoices')
    .select('id,invoice_number,agent_id,building_id,building_name,building_address,tenant_name,unit_number,lease_start,lease_term_months,amount,invoice_date,due_date')
    .eq('id', invoiceId)
    .maybeSingle()
  if (!inv) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  if ((inv.agent_id ?? '').toLowerCase() !== email) return NextResponse.json({ error: 'That invoice belongs to another agent' }, { status: 403 })

  // Pull latest building address in case it was updated
  const buildingAddress = inv.building_id
    ? (await admin.from('buildings').select('address').eq('id', inv.building_id).maybeSingle()).data?.address ?? inv.building_address
    : inv.building_address

  const agent = await resolveInvoiceAgent(admin, inv.agent_id)

  try {
    const pdf = await buildInvoicePdf({
      invoiceNumber: inv.invoice_number,
      invoiceDate: inv.invoice_date,
      dueDate: inv.due_date,
      agent,
      billToName: inv.building_name ?? 'Leasing Office',
      billToAddress: buildingAddress ?? null,
      tenantName: inv.tenant_name ?? 'Tenant',
      leaseStart: inv.lease_start,
      leaseTermMonths: inv.lease_term_months,
      unit: inv.unit_number ?? '',
      amount: Number(inv.amount),
    })

    const path = invoicePdfPath(inv.agent_id, inv.invoice_number)
    const { error: uploadError } = await admin.storage
      .from(AR_BUCKET)
      .upload(path, pdf, { contentType: 'application/pdf', upsert: true })
    if (uploadError) throw new Error(`PDF upload failed: ${uploadError.message}`)

    // Update building_address on the invoice row too
    await admin.from('invoices').update({ building_address: buildingAddress }).eq('id', invoiceId)

    return NextResponse.json({ ok: true, invoiceNumber: inv.invoice_number, path })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PDF regeneration failed'
    console.error(`[invoices/regenerate-pdf] invoice ${invoiceId}:`, message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
