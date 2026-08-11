import { createAdminClient } from '@/lib/supabase/admin'

export type SaveUser = { id: string; first_name: string; last_name: string; phone: string; share_slug: string }

export function normalizePhone(value: string) {
  return value.replace(/[^0-9+]/g, '').trim()
}

export function slugify(value: string) {
  const base = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'list'
  return base
}

export async function getOrCreateUser(input: { firstName: string; lastName: string; phone: string }) {
  const supabase = createAdminClient()
  const phone = normalizePhone(input.phone)
  if (!input.firstName.trim() || !input.lastName.trim() || phone.length < 7) throw new Error('Please provide a name and valid phone number.')
  const existing = await supabase.from('saved_users').select('*').eq('phone', phone).maybeSingle()
  if (existing.error) throw existing.error
  if (existing.data) return existing.data as SaveUser
  const base = slugify(input.firstName)
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt ? `${base}-${attempt + 1}` : base
    const created = await supabase.from('saved_users').insert({ first_name: input.firstName.trim(), last_name: input.lastName.trim(), phone, share_slug: slug }).select('*').single()
    if (!created.error) return created.data as SaveUser
    if (!created.error.message.includes('duplicate')) throw created.error
  }
  throw new Error('Could not create your share link.')
}

export function safeError(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.'
}
