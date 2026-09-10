import { Resend } from 'resend'

export interface GuestCardLead {
  id?: string | number
  name: string
  phone: string
  email?: string
  moveDate: string
  budget: string
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

export function renderGuestCardHtml(lead: GuestCardLead) {
  const buildingName = escapeHtml(lead.buildingName)
  const clientName = escapeHtml(lead.name)
  const phone = escapeHtml(lead.phone)
  const email = lead.email?.trim()
    ? escapeHtml(lead.email)
    : '<span style="color:#999; font-style:italic;">No email on file yet — client info is a phone call away though!</span>'
  const moveDate = escapeHtml(lead.moveDate)
  const budget = escapeHtml(lead.budget)
  const agent = escapeHtml(lead.agent)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Guest Card Email Mockup</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    background: #F2F2F0;
    display: flex;
    justify-content: center;
    padding: 40px 16px;
  }
  .email-shell {
    width: 100%;
    max-width: 560px;
    background: #FFFFFF;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }
  .header {
    background: #111;
    padding: 20px 28px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .logo-text { color: #FFF; font-size: 16px; font-weight: 800; }
  .logo-text span { color: #E0447B; }
  .body-content { padding: 32px 28px 8px; }
  .greeting { font-size: 19px; font-weight: 700; color: #111; margin-bottom: 24px; line-height: 1.4; }
  .lead-card { background: #FAFAF9; border: 1px solid #ECECE9; border-radius: 14px; padding: 18px 20px; margin-bottom: 20px; }
  .lead-name { font-size: 17px; font-weight: 800; color: #111; margin-bottom: 12px; }
  .lead-row { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #333; padding: 5px 0; }
  .lead-icon { font-size: 15px; width: 20px; text-align: center; flex-shrink: 0; }
  .cta-line { font-size: 14.5px; color: #111; line-height: 1.6; margin-bottom: 20px; }
  .cta-line b { color: #E0447B; }
  .agent-card { border-left: 3px solid #0F6E56; background: #F3FAF8; padding: 14px 18px; border-radius: 0 10px 10px 0; margin-bottom: 20px; }
  .agent-name { font-size: 15px; font-weight: 700; color: #111; margin-bottom: 4px; }
  .agent-meta { font-size: 13px; color: #555; line-height: 1.6; }
  .closing-line { font-size: 14.5px; color: #333; line-height: 1.6; margin-bottom: 28px; }
  .footer { background: #FAFAF9; border-top: 1px solid #ECECE9; padding: 18px 28px; font-size: 12px; color: #999; text-align: center; }
</style>
</head>
<body>
<div class="email-shell">
  <div class="header">
    <div class="logo-text">MIAMI APARTMENT <span>GUY</span></div>
  </div>
  <div class="body-content">
    <div class="greeting">Hey ${buildingName}, someone&apos;s interested!</div>
    <div class="lead-card">
      <div class="lead-name">${clientName}</div>
      <div class="lead-row"><span class="lead-icon">📞</span> ${phone}</div>
      <div class="lead-row"><span class="lead-icon">📧</span> ${email}</div>
      <div class="lead-row"><span class="lead-icon">🗓️</span> Move-in: ${moveDate}</div>
      <div class="lead-row"><span class="lead-icon">💰</span> Budget: ${budget}</div>
    </div>
    <div class="cta-line">Please register <b>${clientName}</b> under Miami Apartment Guy — our team will be handling the application process with them from here through move-in. We&apos;ll be reaching out to ${clientName} shortly to schedule a tour.</div>
    <div class="cta-line">If you&apos;ve got units and any current concessions that&apos;d be a good fit, send them our way — we&apos;ll pass it straight to the client.</div>
    <div class="agent-card">
      <div class="agent-name">Doğuhan (Don) Karahan</div>
      <div class="agent-meta">License # SL3581300<br>+1 (407) 765-7306 · don@miamiapartmentguy.com</div>
    </div>
    <div class="closing-line"><i>If ${clientName} is already in your system, just let us know — otherwise we&apos;ll take it from here.</i><br><br><b>Please keep leads@miamiapartmentguy.com CC&apos;d on all communications with this client for full visibility and cooperation.</b></div>
  </div>
  <div class="footer">
    On the date shown on this email, ${buildingName} was introduced to this client by Miami Apartment Guy. By entering this client into your system, ${buildingName} acknowledges Miami Apartment Guy as the procuring cause of this lead.
    <br><br>
    Miami Apartment Guy · miamiapartmentguy.com
  </div>
</div>
</body>
</html>`
}

export async function sendGuestCardEmail(lead: GuestCardLead): Promise<GuestCardResult> {
  const recipients = lead.contactEmails.filter(Boolean)
  const cc = ['don@miamiapartmentguy.com']
  if (!process.env.RESEND_API_KEY || recipients.length === 0) return { sent: false, skipped: true }
  const { data, error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: 'Miami Apartment Guy <leads@miamiapartmentguy.com>',
    to: recipients,
    cc,
    subject: `Guest card: ${lead.name} — ${lead.buildingName}`,
    html: renderGuestCardHtml(lead),
  }, { idempotencyKey: `guest-card/${lead.id ?? lead.buildingName}/${lead.name}/${lead.phone}` })
  if (error) return { sent: false, skipped: false, error: error.message }
  return { sent: true, skipped: false, id: data?.id }
}
