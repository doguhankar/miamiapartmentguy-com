import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export type InvoiceData = {
  invoiceNumber: string
  issuedOn: Date
  leadName: string
  buildingName: string
  unit: string
  leaseStart: string | null
  leaseTermMonths: number | null
  leaseRent: number
  commissionOwed: number
  notes?: string | null
}

export const INVOICE_AGENT = {
  name: 'Doguhan (Don) Karahan',
  license: 'SL3581300',
  email: 'don@miamiapartmentguy.com',
  phone: '+1 407-765-7306',
}

export const usd = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

export function formatIsoDate(value: string | null) {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return 'Not specified'
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

// Standard PDF fonts only encode Latin-1, so strip accents and replace anything else.
function safe(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '?')
}

export async function buildInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([612, 792])
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const ink = rgb(0.07, 0.07, 0.07)
  const muted = rgb(0.45, 0.45, 0.45)
  const accent = rgb(0.878, 0.267, 0.482)
  const rule = rgb(0.88, 0.88, 0.88)
  const left = 56
  const right = 556

  const text = (value: string, x: number, y: number, size = 11, font = regular, color = ink) =>
    page.drawText(safe(value), { x, y, size, font, color })
  const textRight = (value: string, y: number, size = 11, font = regular, color = ink) =>
    page.drawText(safe(value), { x: right - font.widthOfTextAtSize(safe(value), size), y, size, font, color })
  const line = (y: number) => page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 0.75, color: rule })

  page.drawRectangle({ x: 0, y: 760, width: 612, height: 32, color: accent })
  text('Miami Apartment Guy', left, 745, 11, bold, muted)
  text('COMMISSION INVOICE', left, 710, 24, bold)
  textRight(data.invoiceNumber, 714, 12, bold)
  textRight(`Issued ${data.issuedOn.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })}`, 698, 10, regular, muted)
  line(676)

  text('FROM', left, 652, 9, bold, muted)
  text(INVOICE_AGENT.name, left, 634, 12, bold)
  text(`Licensed Real Estate Sales Associate`, left, 618, 10, regular, muted)
  text(`License # ${INVOICE_AGENT.license}`, left, 604, 10)
  text(INVOICE_AGENT.email, left, 590, 10)
  text(INVOICE_AGENT.phone, left, 576, 10)

  text('BILL TO', 330, 652, 9, bold, muted)
  text(data.buildingName, 330, 634, 12, bold)
  text('Leasing / Property Management', 330, 618, 10, regular, muted)

  line(548)
  text('DEAL DETAILS', left, 526, 9, bold, muted)

  const rows: [string, string][] = [
    ['Building', data.buildingName],
    ['Unit', data.unit || 'Not specified'],
    ['Tenant', data.leadName],
    ['Lease start', formatIsoDate(data.leaseStart)],
    ['Lease term', data.leaseTermMonths ? `${data.leaseTermMonths} months` : 'Not specified'],
    ['Monthly lease rent', usd(data.leaseRent)],
  ]
  let y = 502
  for (const [label, value] of rows) {
    text(label, left, y, 11, regular, muted)
    textRight(value, y, 11, bold)
    y -= 18
    line(y + 8)
  }

  y -= 20
  page.drawRectangle({ x: left, y: y - 22, width: right - left, height: 48, color: rgb(0.97, 0.95, 0.96) })
  text('COMMISSION OWED', left + 16, y + 2, 10, bold, muted)
  textRight(usd(data.commissionOwed), y - 12, 20, bold, accent)

  const notes = safe((data.notes ?? '').replace(/\s+/g, ' ').trim())
  if (notes) {
    y -= 56
    text('NOTES', left, y, 9, bold, muted)
    const maxWidth = right - left
    const lines: string[] = []
    let current = ''
    for (const word of notes.split(' ')) {
      const next = current ? `${current} ${word}` : word
      if (regular.widthOfTextAtSize(next, 10) > maxWidth && current) {
        lines.push(current)
        current = word
      } else {
        current = next
      }
    }
    if (current) lines.push(current)
    for (const noteLine of lines.slice(0, 6)) {
      y -= 15
      page.drawText(noteLine, { x: left, y, size: 10, font: regular, color: ink })
    }
  }

  text('Please remit payment to Miami Apartment Guy. Questions: ' + INVOICE_AGENT.email + ' or ' + INVOICE_AGENT.phone + '.', left, 72, 9, regular, muted)

  return pdf.save()
}
