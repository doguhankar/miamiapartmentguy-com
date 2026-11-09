import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'

// Matches the MAG invoice template (Kaylin Mally / Flow Wynwood, Nov 2026).
// Bank details come from server env vars so they never live in this public repo:
//   INVOICE_BANK_NAME, INVOICE_ACCOUNT_NAME, INVOICE_ACH_ROUTING, INVOICE_WIRE_ABA, INVOICE_ACCOUNT_NUMBER

export type InvoiceAgent = {
  name: string
  title: string
  license?: string | null
  phone: string
  email: string
}

export type InvoiceData = {
  invoiceNumber: string
  invoiceDate: string // YYYY-MM-DD
  dueDate: string // YYYY-MM-DD
  agent: InvoiceAgent
  billToName: string
  billToAddress?: string | null // "275 SW 6th St, Miami, FL 33130" — split on first comma onto two lines
  tenantName: string
  leaseStart: string | null
  leaseTermMonths: number | null
  unit: string
  amount: number
}

export const BROKERAGE = {
  name: '305 International Realty',
  legalName: '305 International Realty LLC',
  street: '848 Brickell Ave, Ste. 620',
  cityLine: 'Miami, FL 33131',
  oneLine: '848 Brickell Ave Ste 620, Miami FL 33131',
}

// Known agents, keyed by the email they sign in to /agent with.
// Anyone else on the allowlist falls back to their allowlist name/phone/email.
const DON: InvoiceAgent = {
  name: 'Doguhan Karahan',
  title: 'Real Estate Associate / Team Lead',
  license: 'SL3581300',
  phone: '+1 (407) 765-7306',
  email: 'Don@MiamiApartmentGuy.com',
}
export const INVOICE_AGENTS: Record<string, InvoiceAgent> = {
  'doguhankar1@gmail.com': DON, // Don's /agent login
  'don@miamiapartmentguy.com': DON,
}
export const INVOICE_AGENT = DON

export const usd = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

export function formatIsoDate(value: string | null) {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return 'Not specified'
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

// 2026-11-03 -> 11/3/2026 (the template's style)
export function shortDate(value: string | null) {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return 'Not specified'
  return `${Number(match[2])}/${Number(match[3])}/${match[1]}`
}

// Standard PDF fonts only encode Latin-1, so strip accents and replace anything else.
function safe(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7E\xA0-\xFF]/g, '?')
}

function bankDetails() {
  const env = process.env
  const ready = env.INVOICE_ACH_ROUTING && env.INVOICE_WIRE_ABA && env.INVOICE_ACCOUNT_NUMBER
  return ready
    ? {
        bank: env.INVOICE_BANK_NAME || 'Wells Fargo Bank',
        accountName: env.INVOICE_ACCOUNT_NAME || BROKERAGE.legalName,
        achRouting: env.INVOICE_ACH_ROUTING as string,
        wireAba: env.INVOICE_WIRE_ABA as string,
        account: env.INVOICE_ACCOUNT_NUMBER as string,
      }
    : null
}

export async function buildInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.setTitle(`Invoice ${data.invoiceNumber}`)
  pdf.setAuthor('Miami Apartment Guy')
  const page = pdf.addPage([612, 792])
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const ink = rgb(0.07, 0.07, 0.07)
  const body = rgb(0.3, 0.32, 0.36)
  const muted = rgb(0.55, 0.57, 0.62)
  const pink = rgb(1, 0.247, 0.522) // #FF3F85
  const rule = rgb(0.89, 0.89, 0.9)
  const navy = rgb(0.04, 0.06, 0.1)
  const white = rgb(1, 1, 1)

  const L = 54
  const R = 558
  const MID = 306

  const w = (s: string, size: number, font: PDFFont) => font.widthOfTextAtSize(safe(s), size)
  const text = (p: PDFPage, s: string, x: number, y: number, size = 9, font = regular, color = body) =>
    p.drawText(safe(s), { x, y, size, font, color })
  const right = (s: string, xRight: number, y: number, size = 9, font = regular, color = body) =>
    text(page, s, xRight - w(s, size, font), y, size, font, color)
  const hline = (x1: number, x2: number, y: number, thickness = 0.75, color = rule) =>
    page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness, color })
  const label = (s: string, x: number, y: number) => {
    page.drawLine({ start: { x, y: y + 3 }, end: { x: x + 9, y: y + 3 }, thickness: 1.2, color: pink })
    text(page, s.toUpperCase(), x + 14, y, 7, regular, muted)
  }
  // "Label: **value**" on one line
  const kv = (k: string, v: string, x: number, y: number) => {
    text(page, `${k}:`, x, y, 8.5, regular, body)
    text(page, v, x + w(`${k}:`, 8.5, regular) + 3, y, 8.5, bold, ink)
  }

  // Top band
  page.drawRectangle({ x: L, y: 728, width: R - L, height: 13, color: pink })

  // Wordmark
  let x = L + 8
  for (const [part, color] of [['MIAMI', ink], ['APARTMENT', pink], ['GUY', ink]] as const) {
    text(page, part, x, 684, 17, bold, color)
    x += w(part, 17, bold)
  }
  text(page, '305 INTERNATIONAL REALTY', L + 8, 668, 6.5, regular, pink)

  // Invoice meta
  const metaL = 368
  const metaRows: [string, string, PDFFont, typeof ink, number][] = [
    ['INVOICE NUMBER', data.invoiceNumber, bold, pink, 12],
    ['INVOICE DATE', shortDate(data.invoiceDate), regular, ink, 10],
    ['DUE DATE', shortDate(data.dueDate), bold, ink, 10],
  ]
  let my = 680
  for (const [k, v, font, color, size] of metaRows) {
    text(page, k, metaL, my, 6.5, regular, muted)
    right(v, R, my - 1, size, font, color)
    hline(452, R, my - 8)
    my -= 23
  }

  // FROM / BILL TO box
  const boxTop = 600
  const boxBottom = 512
  page.drawRectangle({ x: L, y: boxBottom, width: R - L, height: boxTop - boxBottom, borderColor: rule, borderWidth: 0.75 })
  page.drawLine({ start: { x: MID, y: boxBottom }, end: { x: MID, y: boxTop }, thickness: 0.75, color: rule })

  label('From', L + 12, boxTop - 16)
  text(page, data.agent.name, L + 12, boxTop - 33, 11, bold, ink)
  const titleLine = data.agent.license ? `${data.agent.title} (${data.agent.license})` : data.agent.title
  text(page, titleLine, L + 12, boxTop - 47, 8.5)
  text(page, `C: ${data.agent.phone}`, L + 12, boxTop - 60, 8.5)
  text(page, data.agent.email, L + 12, boxTop - 73, 8.5)

  label('Bill To', MID + 12, boxTop - 16)
  text(page, data.billToName, MID + 12, boxTop - 33, 11, bold, ink)
  if (data.billToAddress) {
    const [street, ...rest] = data.billToAddress.split(',')
    text(page, street.trim(), MID + 12, boxTop - 47, 8.5)
    if (rest.length) text(page, rest.join(',').trim(), MID + 12, boxTop - 60, 8.5)
  }

  // Line items
  text(page, 'DESCRIPTION', L + 8, 482, 6.5, regular, muted)
  right('AMOUNT', R - 8, 482, 6.5, regular, muted)
  hline(L, R, 472, 2, navy)

  text(page, 'Locator Commission', L + 8, 455, 10, bold, ink)
  right(usd(data.amount), R - 8, 455, 9.5, regular, muted)
  kv('Tenant', data.tenantName, L + 8, 440)
  kv('Lease start', shortDate(data.leaseStart), L + 8, 428)
  kv('Lease Term', data.leaseTermMonths ? `${data.leaseTermMonths} Months` : 'Not specified', L + 8, 416)
  kv('Unit #', data.unit || 'Not specified', L + 8, 404)
  hline(L, R, 390)

  // Totals block
  const tL = 360
  page.drawRectangle({ x: tL, y: 270, width: R - tL, height: 98, color: navy })
  text(page, 'Subtotal', tL + 16, 340, 9, regular, rgb(0.7, 0.72, 0.76))
  right(usd(data.amount), R - 12, 340, 9, regular, white)
  page.drawLine({ start: { x: tL + 16, y: 330 }, end: { x: R - 12, y: 330 }, thickness: 0.5, color: rgb(0.25, 0.27, 0.32) })
  text(page, 'Total Due', tL + 16, 308, 11, bold, white)
  right(usd(data.amount), R - 12, 304, 17, bold, pink)

  // Terms grid
  hline(L, R, 240)
  const colL = L + 8
  const colR = MID + 12

  label('Payment Terms', colL, 222)
  text(page, 'Due in full', colL, 206, 8, bold, ink)
  text(page, ' by the Due Date above.', colL + w('Due in full', 8, bold), 206, 8)
  text(page, `Methods: Wire, ACH, or check to ${BROKERAGE.name}.`, colL, 194, 8)
  text(page, 'Reference invoice number on all payments.', colL, 182, 8)

  label('Wire / ACH', colR, 222)
  const bank = bankDetails()
  if (bank) {
    text(page, `Bank: ${bank.bank}`, colR, 206, 8)
    text(page, `Account: ${bank.accountName}`, colR, 194, 8)
    text(page, `ACH routing: ${bank.achRouting}`, colR, 182, 8)
    text(page, `Wire ABA: ${bank.wireAba}`, colR, 170, 8)
    text(page, `Account: ${bank.account}`, colR, 158, 8)
  } else {
    text(page, `Wire and ACH details available on request:`, colR, 206, 8)
    text(page, data.agent.email, colR, 194, 8, bold, ink)
  }
  text(page, `Beneficiary: ${BROKERAGE.oneLine}`, colR, 140, 8)
  text(page, '**Wire transfers add $15 incoming fee', colR, 128, 8, bold, pink)

  label('Check Payment', colL, 104)
  text(page, 'Please make checks payable to ', colL, 88, 8)
  text(page, `${BROKERAGE.legalName}.`, colL + w('Please make checks payable to ', 8, regular), 88, 8, bold, ink)
  text(page, `Mail-to Address: ${BROKERAGE.street}, ${BROKERAGE.cityLine}`, colL, 76, 8)
  text(page, 'Please write Invoice # on memo line.', colL, 64, 8)

  label('Disputes', colR, 104)
  text(page, `${data.agent.email}  ·  ${data.agent.phone}`, colR, 88, 8)

  const footer = `Miami Apartment Guy  ·  ${BROKERAGE.name}  ·  ${BROKERAGE.oneLine}`
  text(page, footer, (612 - w(footer, 7, regular)) / 2, 30, 7, regular, muted)

  return pdf.save()
}
