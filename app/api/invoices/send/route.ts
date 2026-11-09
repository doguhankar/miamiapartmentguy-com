import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendGmail, gmailConfigured } from '@/lib/gmail-send'
import { buildInvoicePdf } from '@/lib/invoice-pdf'
import { resolveInvoiceAgent, invoicePdfPath, AR_BUCKET } from '@/lib/ar-invoices'

export const runtime = 'nodejs'
export const maxDuration = 60

const W9_PATH = '_shared/w9.pdf'

// Downloads a file from Supabase Storage as a Buffer.
async function downloadFromStorage(admin: ReturnType<typeof createAdminClient>, path: string): Promise<Buffer | null> {
  const { data, error } = await admin.storage.from(AR_BUCKET).download(path)
  if (error || !data) return null
  const ab = await data.arrayBuffer()
  return Buffer.from(ab)
}

// POST /api/invoices/send
// Sends Email 1 to the AP contact with 3 attachments: Invoice PDF, W-9, Broker Reg.
// Logs the send to invoice_emails and marks the invoice as sent.
export async function POST(request: NextRequest) {
  const admin = createAdminClient()

  // --- Auth ---
  const accessToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: userData, error: userError } = await admin.auth.getUser(accessToken)
  const email = userData.user?.email?.toLowerCase()
  if (userError || !email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: allowed } = await admin.from('agent_allowlist').select('email').ilike('email', email).eq('approved', true).limit(1)
  if (!allowed?.length) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // --- Input ---
  const body = (await request.json().catch(() => null)) as { invoiceId?: number } | null
  const invoiceId = Number(body?.invoiceId)
  if (!Number.isInteger(invoiceId)) return NextResponse.json({ error: 'invoiceId required' }, { status: 400 })

  // --- Fetch invoice ---
  const { data: inv } = await admin
    .from('invoices')
    .select('id,invoice_number,agent_id,building_id,building_name,building_address,tenant_name,unit_number,lease_start,lease_term_months,amount,invoice_date,due_date,ap_email,ap_cc_emails,broker_reg_required,status,sequence_step')
    .eq('id', invoiceId)
    .maybeSingle()
  if (!inv) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  if ((inv.agent_id ?? '').toLowerCase() !== email) return NextResponse.json({ error: 'That invoice belongs to another agent' }, { status: 403 })
  if (!inv.ap_email) return NextResponse.json({ error: 'No AP email on this invoice — add one first' }, { status: 409 })
  if (inv.status !== 'draft') return NextResponse.json({ error: `Invoice already ${inv.status}` }, { status: 409 })
  if (!gmailConfigured()) return NextResponse.json({ error: 'Gmail sending not connected yet' }, { status: 503 })

  // --- Agent ---
  const agent = await resolveInvoiceAgent(admin, inv.agent_id)

  // --- Build / fetch PDF ---
  // Always regenerate from current DB data so we send the freshest PDF
  const buildingAddress = inv.building_id
    ? (await admin.from('buildings').select('address').eq('id', inv.building_id).maybeSingle()).data?.address ?? inv.building_address
    : inv.building_address

  const pdfBytes = await buildInvoicePdf({
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
  const invoicePdfBuffer = Buffer.from(pdfBytes)

  // Upload the fresh PDF so storage stays in sync
  const pdfPath = invoicePdfPath(inv.agent_id, inv.invoice_number)
  await admin.storage.from(AR_BUCKET).upload(pdfPath, invoicePdfBuffer, { contentType: 'application/pdf', upsert: true })

  // --- W-9 ---
  const w9Buffer = await downloadFromStorage(admin, W9_PATH)
  if (!w9Buffer) return NextResponse.json({ error: 'W-9 not found in storage (_shared/w9.pdf)' }, { status: 500 })

  // --- Broker Reg (if required & on file) ---
  let brokerRegBuffer: Buffer | null = null
  let brokerRegFilename = 'broker-registration.pdf'
  if (inv.broker_reg_required) {
    const { data: brAttach } = await admin
      .from('invoice_attachments')
      .select('storage_path,file_name')
      .eq('invoice_id', invoiceId)
      .eq('kind', 'broker_reg')
      .maybeSingle()
    if (brAttach?.storage_path) {
      brokerRegBuffer = await downloadFromStorage(admin, brAttach.storage_path)
      brokerRegFilename = brAttach.file_name ?? brokerRegFilename
    }
  }

  // --- Build email ---
  const tenantName = inv.tenant_name ?? 'Tenant'
  const buildingName = inv.building_name ?? 'Building'
  const invoiceNumber = inv.invoice_number

  const subject = `Invoice – ${tenantName} | ${buildingName} | ${invoiceNumber}`

  const agentTitleLine = agent.license ? `${agent.title} (${agent.license})` : agent.title
  const bodyText = [
    `Hello! Please see attached invoice for ${tenantName}, W-9, and Broker Registration Form.`,
    '',
    'Please email or call me directly for any further questions or clarification. Thank you!',
    '',
    agent.name,
    agentTitleLine,
    `C: ${agent.phone}`,
    agent.email,
  ].join('\n')

  // Build attachment list
  const attachments: { filename: string; content: Buffer; contentType: string }[] = [
    { filename: `${invoiceNumber}.pdf`, content: invoicePdfBuffer, contentType: 'application/pdf' },
    { filename: 'W-9.pdf', content: w9Buffer, contentType: 'application/pdf' },
  ]
  if (brokerRegBuffer) {
    const isImage = brokerRegFilename.match(/\.(png|jpg|jpeg|gif|webp)$/i)
    attachments.push({
      filename: brokerRegFilename,
      content: brokerRegBuffer,
      contentType: isImage ? `image/${brokerRegFilename.split('.').pop()!.toLowerCase()}` : 'application/pdf',
    })
  }

  const toList = [inv.ap_email as string]
  // Don (team lead) is CC'd on every invoice another agent sends
  const TEAM_LEAD_CC = 'don@miamiapartmentguy.com'
  const ccList: string[] = Array.isArray(inv.ap_cc_emails) ? [...(inv.ap_cc_emails as string[])] : []
  const sender = agent.email.toLowerCase()
  if (sender !== TEAM_LEAD_CC && !ccList.some(e => e.toLowerCase() === TEAM_LEAD_CC)) ccList.push(TEAM_LEAD_CC)

  // --- Send from the agent's own Gmail so it lands in Sent and threads with replies ---
  let messageId: string | null = null
  let threadId: string | null = null
  let sendError: string | null = null

  try {
    const sent = await sendGmail({
      fromName: agent.name,
      fromEmail: agent.email.toLowerCase(),
      to: toList,
      cc: ccList,
      subject,
      text: bodyText,
      attachments,
    })
    messageId = sent.id
    threadId = sent.threadId
  } catch (err) {
    sendError = err instanceof Error ? err.message : 'Gmail send failed'
  }

  // --- Log to invoice_emails ---
  await admin.from('invoice_emails').insert({
    invoice_id: invoiceId,
    step: 1,
    to_emails: toList,
    cc_emails: ccList,
    subject,
    body: bodyText,
    gmail_message_id: messageId,
    status: sendError ? 'error' : 'sent',
    error_message: sendError ?? null,
    sent_at: sendError ? null : new Date().toISOString(),
  })

  if (sendError) {
    return NextResponse.json({ error: `Email failed: ${sendError}` }, { status: 500 })
  }

  // --- Update invoice status ---
  await admin
    .from('invoices')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      sequence_step: 1,
      last_email_at: new Date().toISOString(),
      gmail_thread_id: threadId,
      building_address: buildingAddress,
    })
    .eq('id', invoiceId)

  return NextResponse.json({ ok: true, invoiceNumber, messageId, threadId })
}
