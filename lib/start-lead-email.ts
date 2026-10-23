import { Resend } from 'resend'
import { formatBudget, sizeLabel } from '@/lib/start-lead'

export interface StartLeadNotification {
  leadId: number | string
  name: string
  phoneDisplay: string
  phoneDigits: string
  moveDate: string
  beds: string
  budget: number
  creditScore?: number
  neighborhood: string
  notes?: string
  source: string
}

const NOTIFY_TO = 'don@miamiapartmentguy.com'

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character)
}

function singleLine(value: string) {
  return value.replace(/[\r\n]+/g, ' ').trim()
}

export function buildStartLeadSubject(lead: StartLeadNotification) {
  return singleLine(`New Lead — ${lead.name} — ${sizeLabel(lead.beds)} — ${formatBudget(lead.budget)}/mo — via ${lead.source}`)
}

export async function sendStartLeadEmail(lead: StartLeadNotification): Promise<{ sent: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) return { sent: false, error: 'RESEND_API_KEY is not configured' }

  const smsHref = `sms:+1${lead.phoneDigits}`
  const telHref = `tel:+1${lead.phoneDigits}`
  const firstName = lead.name.split(/\s+/)[0]
  const submitted = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/New_York' })

  const rows: Array<[string, string]> = [
    ['Name', escapeHtml(lead.name)],
    ['Phone', `<a href="${telHref}" style="color:#0a8f86;">${escapeHtml(lead.phoneDisplay)}</a>`],
    ['Move-in date', escapeHtml(lead.moveDate)],
    ['Apartment size', escapeHtml(sizeLabel(lead.beds))],
    ['Budget', `${escapeHtml(formatBudget(lead.budget))}/mo`],
    ['Neighborhood', escapeHtml(lead.neighborhood)],
    ['Credit score', lead.creditScore ? String(lead.creditScore) : '<span style="color:#8a8a98;">Not provided</span>'],
    ['Notes', lead.notes ? escapeHtml(lead.notes).replace(/\n/g, '<br>') : '<span style="color:#8a8a98;">None</span>'],
    ['Source', escapeHtml(lead.source)],
    ['Lead ID', escapeHtml(String(lead.leadId))],
    ['Submitted (ET)', escapeHtml(submitted)],
  ]

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f3f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#16161c;">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e6e7ee;">
<div style="background:#16161c;padding:18px 24px;color:#ffffff;font-size:18px;font-weight:800;">MAG<span style="color:#ff1f6b;">.</span> <span style="font-weight:500;font-size:14px;color:#c9c9d4;">New /start lead</span></div>
<div style="padding:24px;">
<table role="presentation" style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.5;">
${rows.map(([label, value]) => `<tr><td style="padding:8px 12px 8px 0;color:#5c5c6b;vertical-align:top;white-space:nowrap;width:130px;">${label}</td><td style="padding:8px 0;font-weight:600;vertical-align:top;">${value}</td></tr>`).join('\n')}
</table>
<a href="${smsHref}" style="display:block;margin-top:24px;background:#ff1f6b;color:#ffffff;text-align:center;text-decoration:none;font-weight:800;font-size:17px;padding:16px;border-radius:12px;">Text ${escapeHtml(firstName)} now</a>
<a href="${telHref}" style="display:block;margin-top:10px;text-align:center;color:#0a8f86;font-weight:700;font-size:15px;padding:10px;text-decoration:none;">Or call ${escapeHtml(lead.phoneDisplay)}</a>
</div></div></body></html>`

  const text = [
    ...rows.map(([label, value]) => `${label}: ${value.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")}`),
    '',
    `Text ${firstName}: ${smsHref}`,
  ].join('\n')

  try {
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send(
      {
        from: 'Miami Apartment Guy <leads@miamiapartmentguy.com>',
        to: [NOTIFY_TO],
        subject: buildStartLeadSubject(lead),
        html,
        text,
      },
      { idempotencyKey: `start-lead/${lead.leadId}` },
    )
    if (error) return { sent: false, error: error.message }
    return { sent: true }
  } catch (error) {
    return { sent: false, error: error instanceof Error ? error.message : String(error) }
  }
}
