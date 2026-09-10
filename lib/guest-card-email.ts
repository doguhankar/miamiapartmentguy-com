import { Resend } from 'resend'

export interface GuestCardLead {
  id?: string | number
  name: string
  phone: string
  email?: string
  moveDate: string
  apartmentSize: string
  budget: string
  creditScore: string
  agent: string
  buildingName: string
  contactEmails: string[]
}

export interface GuestCardResult {
  sent: boolean
  skipped: boolean
  id?: string
  error?: string
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

export async function sendGuestCardEmail(lead: GuestCardLead): Promise<GuestCardResult> {
  const recipients = lead.contactEmails.filter(Boolean)
  const cc = ['don@miamiapartmentguy.com']
  if (!process.env.RESEND_API_KEY || recipients.length === 0) return { sent: false, skipped: true }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const safe = Object.fromEntries(Object.entries(lead).map(([key, value]) => [
    key,
    Array.isArray(value) ? value.map(item => escapeHtml(String(item))) : escapeHtml(String(value ?? '')),
  ])) as Record<string, string | string[]>
  const rows = [
    ['Name', safe.name], ['Phone', safe.phone], ['Move-in', safe.moveDate],
    ['Home size', safe.apartmentSize], ['Budget', safe.budget], ['Credit', safe.creditScore], ['Agent', safe.agent],
  ].map(([label, value]) => `<tr><td style="padding:10px 0;color:#6b6b68;font-size:13px;border-bottom:1px solid #ecece9;width:38%">${label}</td><td style="padding:10px 0;color:#111;font-size:14px;border-bottom:1px solid #ecece9;font-weight:600">${value}</td></tr>`).join('')

  const html = `<!doctype html><html><body style="margin:0;background:#f3f4f2;font-family:Arial,sans-serif;color:#111"><div style="max-width:600px;margin:32px auto;background:#fff;border:1px solid #dedfdb"><div style="padding:25px 32px;background:#0b1220;color:#fff"><div style="font-size:13px;font-weight:900;letter-spacing:1.2px">MIAMI APARTMENT <span style="color:#e0447b">GUY</span></div><div style="margin-top:22px;font-size:27px;font-weight:800">New guest card</div><div style="margin-top:6px;color:#b8c1d1;font-size:14px">${safe.buildingName} · A new renter is interested.</div></div><div style="padding:26px 32px"><table style="width:100%;border-collapse:collapse">${rows}</table><div style="margin-top:26px;padding:18px;background:#f8f8f6;border:1px solid #ecece9"><p style="margin:0 0 10px;font-size:14px;font-weight:700">Registration & tour</p><p style="margin:0;color:#5f625e;font-size:13px;line-height:1.55">Please register this renter and coordinate a tour or next available leasing appointment.</p></div><div style="margin-top:14px;padding:18px;background:#fff8fb;border:1px solid #f2c4d5"><p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#111">Concessions</p><p style="margin:0;color:#5f625e;font-size:13px;line-height:1.55">Please share any current specials, concessions, or move-in incentives available for this guest.</p></div><div style="margin-top:26px;padding-top:18px;border-top:1px solid #ecece9;color:#5f625e;font-size:13px;line-height:1.6"><strong style="color:#111">Miami Apartment Guy</strong><br/>Don Karahan · don@miamiapartmentguy.com<br/>Leasing coordination and renter representation</div><p style="margin:24px 0 0;color:#111;font-size:14px;line-height:1.6"><strong><em>Thank you for your quick follow-up.</em></strong><br/><em><strong>We look forward to working together.</strong></em></p></div><div style="padding:16px 32px;background:#f8f8f6;border-top:1px solid #ecece9;color:#888b86;font-size:11px;line-height:1.45">This guest card is sent for registration and procuring-cause tracking by Miami Apartment Guy. Please retain it for your records.</div></div></body></html>`

  const { data, error } = await resend.emails.send({
    from: 'Miami Apartment Guy <leads@miamiapartmentguy.com>',
    to: recipients,
    cc,
    subject: `Guest card: ${lead.name} — ${lead.buildingName}`,
    html,
  }, { idempotencyKey: `guest-card/${lead.id ?? lead.buildingName}/${lead.name}/${lead.phone}` })

  if (error) return { sent: false, skipped: false, error: error.message }
  return { sent: true, skipped: false, id: data?.id }
}
