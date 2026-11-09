import { createSign } from 'crypto'

// Sends mail through the agent's real Gmail (Google Workspace) mailbox, so every invoice
// shows in their Sent folder and replies thread normally.
//
// Auth: a Google Cloud service account with domain-wide delegation, scope
// https://www.googleapis.com/auth/gmail.send, impersonating the agent (sub = agent email).
// Credentials live ONLY in the Vercel env var GOOGLE_SERVICE_ACCOUNT_JSON (repo is public).

const SCOPE = 'https://www.googleapis.com/auth/gmail.send'

type ServiceAccount = { client_email: string; private_key: string; token_uri?: string }

export function gmailConfigured() {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
}

function serviceAccount(): ServiceAccount {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not set')
  const sa = JSON.parse(raw) as ServiceAccount
  sa.private_key = sa.private_key.replace(/\\n/g, '\n')
  return sa
}

const b64url = (input: Buffer | string) =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

async function accessTokenFor(userEmail: string): Promise<string> {
  const sa = serviceAccount()
  const tokenUri = sa.token_uri || 'https://oauth2.googleapis.com/token'
  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = b64url(JSON.stringify({ iss: sa.client_email, sub: userEmail, scope: SCOPE, aud: tokenUri, iat: now, exp: now + 3600 }))
  const signer = createSign('RSA-SHA256')
  signer.update(`${header}.${claims}`)
  const jwt = `${header}.${claims}.${b64url(signer.sign(sa.private_key))}`

  const res = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  })
  const json = (await res.json()) as { access_token?: string; error?: string; error_description?: string }
  if (!res.ok || !json.access_token) throw new Error(`Google auth failed for ${userEmail}: ${json.error_description || json.error || res.status}`)
  return json.access_token
}

// RFC 2047 so subjects/names with "–" or accents survive
const encodeHeader = (value: string) => (/^[\x20-\x7E]*$/.test(value) ? value : `=?UTF-8?B?${Buffer.from(value).toString('base64')}?=`)
const wrap76 = (s: string) => s.replace(/.{1,76}/g, '$&\r\n')

export type GmailAttachment = { filename: string; content: Buffer; contentType: string }

export type GmailMessage = {
  fromName: string
  fromEmail: string
  to: string[]
  cc?: string[]
  subject: string
  text: string
  attachments?: GmailAttachment[]
  threadId?: string | null // reply inside an existing thread (Emails 2–5)
  inReplyTo?: string | null // RFC Message-ID of the message being replied to
}

export async function sendGmail(msg: GmailMessage): Promise<{ id: string; threadId: string }> {
  const boundary = `mag_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`
  const headers = [
    `From: ${encodeHeader(msg.fromName)} <${msg.fromEmail}>`,
    `To: ${msg.to.join(', ')}`,
    msg.cc?.length ? `Cc: ${msg.cc.join(', ')}` : null,
    `Subject: ${encodeHeader(msg.subject)}`,
    msg.inReplyTo ? `In-Reply-To: ${msg.inReplyTo}` : null,
    msg.inReplyTo ? `References: ${msg.inReplyTo}` : null,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
  ].filter(Boolean)

  const parts = [
    `--${boundary}\r\nContent-Type: text/plain; charset="UTF-8"\r\nContent-Transfer-Encoding: base64\r\n\r\n${wrap76(Buffer.from(msg.text).toString('base64'))}`,
    ...(msg.attachments ?? []).map(a =>
      `--${boundary}\r\nContent-Type: ${a.contentType}; name="${a.filename}"\r\nContent-Disposition: attachment; filename="${a.filename}"\r\nContent-Transfer-Encoding: base64\r\n\r\n${wrap76(a.content.toString('base64'))}`
    ),
  ]
  const mime = `${headers.join('\r\n')}\r\n\r\n${parts.join('\r\n')}\r\n--${boundary}--`

  const token = await accessTokenFor(msg.fromEmail)
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: b64url(mime), ...(msg.threadId ? { threadId: msg.threadId } : {}) }),
  })
  const json = (await res.json()) as { id?: string; threadId?: string; error?: { message?: string } }
  if (!res.ok || !json.id || !json.threadId) throw new Error(`Gmail send failed: ${json.error?.message || res.status}`)
  return { id: json.id, threadId: json.threadId }
}
