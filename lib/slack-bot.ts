const SLACK_API = 'https://slack.com/api'

type SlackResponse = { ok: boolean; error?: string; [key: string]: unknown }

function token() {
  const value = process.env.SLACK_BOT_TOKEN
  if (!value) throw new Error('SLACK_BOT_TOKEN is not set')
  return value
}

async function slackJson(method: string, body: Record<string, unknown>): Promise<SlackResponse> {
  const response = await fetch(`${SLACK_API}/${method}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  })
  const payload = (await response.json()) as SlackResponse
  if (!payload.ok) throw new Error(`Slack ${method} failed: ${payload.error ?? response.status}`)
  return payload
}

async function slackForm(method: string, params: Record<string, string>): Promise<SlackResponse> {
  const response = await fetch(`${SLACK_API}/${method}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  })
  const payload = (await response.json()) as SlackResponse
  if (!payload.ok) throw new Error(`Slack ${method} failed: ${payload.error ?? response.status}`)
  return payload
}

export function slackEscape(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const channelIdCache = new Map<string, string>()

// completeUploadExternal needs a channel ID, so resolve #name to an ID. An env override
// (e.g. SLACK_INVOICES_CHANNEL_ID) skips the lookup and the need for the channels:read scope.
export async function resolveChannelId(name: string, envOverride?: string): Promise<string> {
  if (envOverride) return envOverride
  const cached = channelIdCache.get(name)
  if (cached) return cached
  let cursor = ''
  do {
    const params: Record<string, string> = { types: 'public_channel,private_channel', exclude_archived: 'true', limit: '200' }
    if (cursor) params.cursor = cursor
    const result = await slackForm('conversations.list', params)
    const channels = (result.channels ?? []) as { id: string; name: string }[]
    const match = channels.find(channel => channel.name === name)
    if (match) {
      channelIdCache.set(name, match.id)
      return match.id
    }
    cursor = ((result.response_metadata as { next_cursor?: string } | undefined)?.next_cursor) ?? ''
  } while (cursor)
  throw new Error(`Slack channel #${name} not found (is the bot invited to it?)`)
}

export async function postMessage(channel: string, text: string) {
  await slackJson('chat.postMessage', { channel, text, unfurl_links: false })
}

// files.upload was retired by Slack; this is its replacement (get URL, upload bytes, complete).
export async function uploadFile(opts: { channelId: string; filename: string; title: string; bytes: Uint8Array; comment: string }) {
  const slot = await slackForm('files.getUploadURLExternal', { filename: opts.filename, length: String(opts.bytes.byteLength) })
  const uploadUrl = slot.upload_url as string
  const fileId = slot.file_id as string
  const upload = await fetch(uploadUrl, { method: 'POST', body: opts.bytes as unknown as BodyInit })
  if (!upload.ok) throw new Error(`Slack file upload failed: HTTP ${upload.status}`)
  await slackJson('files.completeUploadExternal', {
    files: [{ id: fileId, title: opts.title }],
    channel_id: opts.channelId,
    initial_comment: opts.comment,
  })
  return fileId
}
