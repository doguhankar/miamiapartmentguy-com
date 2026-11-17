import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

// AES-256-GCM for social-account tokens. The key lives only in the server
// environment (INBOX_CRED_KEY, base64 of 32 random bytes); the database only ever
// holds ciphertext. Format: v1.<iv>.<tag>.<ciphertext>  (all base64url)

const b64 = (b: Buffer) => b.toString('base64url')

export function loadKey(raw = process.env.INBOX_CRED_KEY): Buffer {
  if (!raw) throw new Error('INBOX_CRED_KEY is not set')
  const key = Buffer.from(raw, 'base64')
  if (key.length !== 32) throw new Error('INBOX_CRED_KEY must be base64 of exactly 32 bytes')
  return key
}

export function encryptSecret(plain: string, key: Buffer = loadKey()): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return `v1.${b64(iv)}.${b64(cipher.getAuthTag())}.${b64(ct)}`
}

export function decryptSecret(token: string, key: Buffer = loadKey()): string {
  const [v, iv, tag, ct] = token.split('.')
  if (v !== 'v1' || !iv || !tag || !ct) throw new Error('Unsupported ciphertext format')
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'))
  decipher.setAuthTag(Buffer.from(tag, 'base64url'))
  return Buffer.concat([decipher.update(Buffer.from(ct, 'base64url')), decipher.final()]).toString('utf8')
}
