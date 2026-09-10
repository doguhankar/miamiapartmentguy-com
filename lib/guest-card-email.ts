import { Resend } from 'resend'

export interface GuestCardLead {
  name: string
  phone: string
  moveDate: string
  apartmentSize: string
  budget: string
  creditScore: string
  agent: string
  buildingName: string
  contactEmails: string[]
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character)
}

export async function sendGuestCardEmail(lead: GuestCardLead) {
  if (!process.env.RESEND_API_KEY || lead.contactEmails.length === 0) {
    return { sent: false, skipped: true }
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const safe = Object.fromEntries(Object.entries(lead).map(([key, value]) => [
    key,
    Array.isArray(value) ? value.map(item => escapeHtml(item)) : escapeHtml(String(value)),
  ])) as Record<string, string | string[]>

  const rows = [
    ['Name', safe.name],
    ['Phone', safe.phone],
    ['Move-in', safe.moveDate],
    ['Home size', safe.apartmentSize],
    ['Budget', safe.budget],
    ['Credit', safe.creditScore],
    ['Agent', safe.agent],
  ].map(([label, value]) => `<tr><td style="padding:10px 0;color:#6b6b68;font-size:13px;border-bottom:1px solid #ecece9;width:38%">${label}</td><td style="padding:10px 0;color:#111;font-size:14px;border-bottom:1px solid #ecece9;font-weight:600">${value}</td></tr>`).join('')

  const { data, error } = await resend.emails.send({
    from: 'Miami Apartment Guy <leads@miamiapartmentguy.com>',
    to: lead.contactEmails,
    subject: `Guest card: ${lead.name} — ${lead.buildingName}`,
    html: `<!doctype html><html><body style="margin:0;background:#f5f5f3;font-family:Arial,sans-serif;color:#111"><div style="max-width:560px;margin:32px auto;background:#fff;border:1px solid #ecece9"><div style="padding:28px 32px;border-bottom:1px solid #ecece9"><div style="color:#e0447b;font-size:11px;font-weight:700;letter-spacing:1.5px">MIAMI APARTMENT GUY</div><h1 style="margin:14px 0 4px;font-size:25px;line-height:1.2">New guest card</h1><p style="margin:0;color:#6b6b68;font-size:14px">${safe.buildingName} · A new renter is interested.</p></div><div style="padding:24px 32px"><table style="width:100%;border-collapse:collapse">${rows}</table><p style="margin:24px 0 0;color:#6b6b68;font-size:12px;line-height:1.5">Please follow up with this lead directly. This guest card was sent by Miami Apartment Guy.</p></div></div></body></html>`,
  }, { idempotencyKey: `guest-card/${lead.buildingName}/${lead.name}/${lead.phone}` })

  if (error) {
    console.error('[guest-card] Resend error:', error.message)
    return { sent: false, skipped: false, error: error.message }
  }

  return { sent: true, skipped: false, id: data?.id }
}
