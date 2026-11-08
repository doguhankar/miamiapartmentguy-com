import type { SupabaseClient } from '@supabase/supabase-js'
import { buildInvoicePdf, INVOICE_AGENTS, type InvoiceAgent } from '@/lib/invoice-pdf'

// Accounts receivable helpers shared by lead close-notify and the /agent/invoices API.
// Nothing in here sends email. Follow-ups are a separate step, switched on later.

export const AR_BUCKET = 'invoices'
export const PAYMENT_TERMS_DAYS = 30

export function todayEastern(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date())
}

export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return dt.toISOString().slice(0, 10)
}

export async function resolveInvoiceAgent(admin: SupabaseClient, agentEmail: string | null): Promise<InvoiceAgent> {
  const key = (agentEmail ?? '').toLowerCase()
  if (INVOICE_AGENTS[key]) return INVOICE_AGENTS[key]
  const { data } = await admin
    .from('agent_allowlist')
    .select('display_name,phone,email')
    .ilike('email', key || 'none')
    .maybeSingle()
  return {
    name: data?.display_name || key.split('@')[0] || 'Miami Apartment Guy',
    title: 'Real Estate Associate',
    license: null,
    phone: data?.phone || '',
    email: data?.email || key,
  }
}

export function invoicePdfPath(agentEmail: string, invoiceNumber: string) {
  return `${agentEmail.toLowerCase()}/${invoiceNumber}/${invoiceNumber}.pdf`
}

type ClosedLead = {
  id: number
  name: string | null
  agent_id: string | null
  building_id: string | null
  building_name: string | null
  unit: string | null
  lease_start: string | null
  lease_term_months: number | null
  commission_actual: number | string | null
}

export type CreatedInvoice = { id: number; invoiceNumber: string; pdf: Uint8Array }

// Creates the AR invoice (status "draft") for a closed lead, renders the PDF and stores it.
// Returns the existing invoice if this lead already has one.
export async function createInvoiceFromLead(admin: SupabaseClient, lead: ClosedLead): Promise<CreatedInvoice> {
  const amount = lead.commission_actual != null ? Number(lead.commission_actual) : NaN
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Lead has no commission amount')
  if (!lead.agent_id) throw new Error('Lead has no agent')

  const { data: existing } = await admin
    .from('invoices')
    .select('id,invoice_number')
    .eq('lead_id', lead.id)
    .neq('status', 'void')
    .maybeSingle()

  const [{ data: building }, { data: ap }] = await Promise.all([
    lead.building_id
      ? admin.from('buildings').select('name,address').eq('id', lead.building_id).maybeSingle()
      : Promise.resolve({ data: null }),
    lead.building_id
      ? admin.from('building_ap_contacts').select('ap_email,ap_cc_emails').eq('building_id', lead.building_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const invoiceDate = todayEastern()
  const dueDate = addDays(invoiceDate, PAYMENT_TERMS_DAYS)
  const agent = await resolveInvoiceAgent(admin, lead.agent_id)

  let invoiceNumber = existing?.invoice_number as string | undefined
  if (!invoiceNumber) {
    const { data: next, error } = await admin.rpc('next_invoice_number', { p_date: invoiceDate })
    if (error || !next) throw new Error(`Invoice number failed: ${error?.message ?? 'empty'}`)
    invoiceNumber = next as string
  }

  const billToName = building?.name || lead.building_name || 'Leasing Office'
  const pdf = await buildInvoicePdf({
    invoiceNumber,
    invoiceDate,
    dueDate,
    agent,
    billToName,
    billToAddress: building?.address ?? null,
    tenantName: lead.name ?? 'Tenant',
    leaseStart: lead.lease_start,
    leaseTermMonths: lead.lease_term_months,
    unit: lead.unit ?? '',
    amount,
  })

  const path = invoicePdfPath(lead.agent_id, invoiceNumber)
  const { error: uploadError } = await admin.storage
    .from(AR_BUCKET)
    .upload(path, pdf, { contentType: 'application/pdf', upsert: true })
  if (uploadError) throw new Error(`PDF upload failed: ${uploadError.message}`)

  if (existing) {
    return { id: existing.id as number, invoiceNumber, pdf }
  }

  const { data: inserted, error: insertError } = await admin
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      agent_id: lead.agent_id.toLowerCase(),
      lead_id: lead.id,
      building_id: lead.building_id,
      building_name: billToName,
      building_address: building?.address ?? null,
      tenant_name: lead.name ?? 'Tenant',
      unit_number: lead.unit || 'n/a',
      lease_start: lead.lease_start ?? invoiceDate,
      lease_term_months: lead.lease_term_months ?? 12,
      amount,
      invoice_date: invoiceDate,
      due_date: dueDate,
      ap_email: ap?.ap_email ?? null,
      ap_cc_emails: ap?.ap_cc_emails ?? [],
      status: 'draft',
    })
    .select('id')
    .single()
  if (insertError || !inserted) throw new Error(`Invoice insert failed: ${insertError?.message ?? 'no row'}`)

  await admin.from('invoice_attachments').insert({
    invoice_id: inserted.id,
    kind: 'invoice_pdf',
    storage_path: path,
    file_name: `${invoiceNumber}.pdf`,
    uploaded_by: 'system',
  })

  return { id: inserted.id as number, invoiceNumber, pdf }
}
