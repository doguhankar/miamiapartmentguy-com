import { Resend } from 'resend'

export interface GuestCardLead {
  id?: string | number
  name: string
  phone: string
  email?: string
  moveDate: string
  budget: string
  agent: string
  agentLicense?: string
  agentPhone?: string
  agentEmail?: string
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

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0]
}

function displayBudget(budget: string) {
  return budget.trim().toLowerCase() === 'you tell me' ? 'Flexible' : budget
}

export function renderGuestCardHtml(lead: GuestCardLead) {
  const buildingName = escapeHtml(lead.buildingName)
  const clientFullName = escapeHtml(lead.name)
  const clientFirst = escapeHtml(firstName(lead.name))
  const phone = escapeHtml(lead.phone)
  const email = lead.email?.trim()
    ? escapeHtml(lead.email)
    : '<span style="color:#999; font-style:italic; font-weight:400;">No email on file yet — client info is a phone call away though!</span>'
  const moveDate = escapeHtml(lead.moveDate)
  const budget = escapeHtml(displayBudget(lead.budget))
  const agent = escapeHtml(lead.agent)
  const agentLicense = escapeHtml(lead.agentLicense ?? 'SL3581300')
  const agentPhone = escapeHtml(lead.agentPhone ?? '+1 (407) 765-7306')
  const agentEmail = escapeHtml(lead.agentEmail ?? 'don@miamiapartmentguy.com')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Guest Card</title>
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
    max-width: 620px;
    background: #FFFFFF;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }
  .header { background: #111; padding: 24px 40px; display: flex; align-items: center; gap: 10px; }
  .logo-text { color: #FFF; font-size: 16px; font-weight: 800; }
  .logo-text span { color: #E0447B; }
  .body-content { padding: 36px 40px 8px; }
  .greeting { font-size: 19px; font-weight: 700; color: #111; margin-bottom: 24px; line-height: 1.4; }
  .lead-card { background: #FAFAF9; border: 1px solid #ECECE9; border-radius: 14px; padding: 18px 20px; margin-bottom: 20px; }
  .lead-name { font-size: 17px; font-weight: 800; color: #111; margin-bottom: 12px; }
  .lead-row-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px 16px; }
  .lead-row { display: flex; flex-direction: column; gap: 2px; font-size: 13.5px; color: #333; }
  .lead-row-label { font-size: 10.5px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 0.03em; }
  .primary-ask { background: #FFF6F9; border: 1px solid #F8D6E4; border-radius: 14px; padding: 18px 20px; margin-bottom: 20px; font-size: 14.5px; line-height: 1.6; color: #111; }
  .primary-ask b { color: #E0447B; }
  .info-card { background: #FAFAF9; border: 1px solid #ECECE9; border-radius: 14px; padding: 16px 20px; margin-bottom: 20px; }
  .info-card-accent { border-top: 3px solid #0F6E56; }
  .info-label { font-size: 10.5px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 6px; }
  .agent-name { font-size: 15px; font-weight: 700; color: #111; margin-bottom: 4px; }
  .agent-meta { font-size: 13px; color: #555; line-height: 1.6; }
  .secondary-line { font-size: 13.5px; color: #666; line-height: 1.6; margin-bottom: 16px; }
  .cc-note { background: #F5F5F3; border-radius: 10px; padding: 12px 16px; font-size: 13px; font-weight: 600; color: #333; margin-bottom: 24px; }
  .signoff { border-top: 1px solid #ECECE9; padding-top: 18px; margin-top: 4px; }
  .signoff-line { font-size: 15px; font-weight: 700; color: #111; margin-bottom: 4px; }
  .signoff-sub { font-size: 13px; color: #999; }
  .footer { background: #FAFAF9; border-top: 1px solid #ECECE9; padding: 20px 40px; font-size: 12px; color: #999; text-align: center; }
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
      <div class="lead-name">${clientFullName}</div>
      <div class="lead-row-grid">
        <div class="lead-row"><span class="lead-row-label">Phone</span> ${phone}</div>
        <div class="lead-row"><span class="lead-row-label">Budget</span> ${budget}</div>
        <div class="lead-row"><span class="lead-row-label">Move-in</span> ${moveDate}</div>
      </div>
      <div class="lead-row" style="margin-top:12px;"><span class="lead-row-label">Email</span> ${email}</div>
    </div>
    <div class="primary-ask">Please register <b>${clientFirst}</b> under Miami Apartment Guy — our team will be assisting with the application process from here through move-in. We&apos;ll be reaching out shortly to schedule a tour.</div>
    <div class="info-card info-card-accent">
      <div class="info-label">Your Agent</div>
      <div class="agent-name">${agent}</div>
      <div class="agent-meta">License # ${agentLicense}<br>${agentPhone} · ${agentEmail}</div>
    </div>
    <div class="secondary-line">While we&apos;re prepping for our tour, could you share any promotions or concessions? If there&apos;s any issue registering ${clientFirst} under Miami Apartment Guy, just let us know — otherwise we&apos;ll assume it&apos;s all set.</div>
    <div class="cc-note">📋 Please keep leads@miamiapartmentguy.com CC&apos;d on all communications with this client for full visibility and cooperation.</div>
    <div class="signoff">
      <div class="signoff-line">Happy leasing! 🌴</div>
      <div class="signoff-sub">Thank you for your continued partnership.</div>
    </div>
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
    subject: `Someone's interested in ${lead.buildingName} 👀`,
    html: renderGuestCardHtml(lead),
  }, { idempotencyKey: `guest-card/${lead.id ?? lead.buildingName}/${lead.name}/${lead.phone}` })
  if (error) return { sent: false, skipped: false, error: error.message }
  return { sent: true, skipped: false, id: data?.id }
}
