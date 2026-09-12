type LeadMessageData = {
  name?: string
  phone?: string
  budget?: string
  moveDate?: string
  neighborhoods?: string[]
  building?: string
  buildingName?: string
  agent?: string
  source?: string
}

const hasValue = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0

function sourceLabel(source?: string) {
  if (source === 'leasing_form' || source === 'Connect with Leasing') return 'Connect with Leasing'
  if (source === 'Text Don' || source === 'text_don') return 'Text Don'
  return 'Move with Don'
}

function phoneLink(phone: string) {
  const digits = phone.replace(/[^\d+]/g, '')
  return digits ? `<tel:${digits}|${phone}>` : phone
}

function field(label: string, value: string | undefined) {
  return hasValue(value) ? { type: 'mrkdwn', text: `*${label}*\n${value}` } : null
}

export function buildLeadSlackMessage(data: LeadMessageData) {
  const name = data.name?.trim() || 'New lead'
  const building = data.building?.trim() || data.buildingName?.trim()
  const neighborhoods = data.neighborhoods?.filter(hasValue).join(', ')
  const fields = [
    field('Budget', data.budget),
    field('Move-in date', data.moveDate),
    field('Neighborhood', neighborhoods),
    field('Building', building || '_Not sure yet_'),
  ].filter((value): value is { type: 'mrkdwn'; text: string } => value !== null)

  return {
    text: `🏢 New lead — ${sourceLabel(data.source)}: ${name}`,
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: `🏢 New lead — ${sourceLabel(data.source)}` } },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*${name}*${hasValue(data.phone) ? `\n${phoneLink(data.phone)}` : ''}` },
      },
      ...(fields.length ? [{ type: 'section', fields }] : []),
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `Agent: ${hasValue(data.agent) ? data.agent : 'Unassigned'} · Submitted ${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/New_York' })}` }],
      },
    ],
  }
}
