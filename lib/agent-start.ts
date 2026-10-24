import { createAdminClient } from '@/lib/supabase/admin'

export type AgentStartConfig = {
  slug: string
  email: string
  displayName: string
  phone: string | null
}

function normalizeSlug(value: string) {
  return value.trim().toLowerCase()
}

export async function resolveAgentStart(slug: string | undefined): Promise<AgentStartConfig | null> {
  const normalized = slug ? normalizeSlug(slug) : ''
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(normalized)) return null

  const { data, error } = await createAdminClient()
    .from('agent_allowlist')
    .select('email, display_name, phone, approved')
    .eq('approved', true)

  if (error) {
    console.error('[agent-start] allowlist lookup failed:', error.message)
    return null
  }

  const match = (data ?? []).find(row => {
    const email = typeof row.email === 'string' ? row.email.trim().toLowerCase() : ''
    return email.split('@')[0] === normalized && Boolean(row.approved)
  })

  if (!match || typeof match.email !== 'string') return null

  return {
    slug: normalized,
    email: match.email.trim(),
    displayName: typeof match.display_name === 'string' && match.display_name.trim() ? match.display_name.trim() : normalized,
    phone: typeof match.phone === 'string' && match.phone.trim() ? match.phone.trim() : null,
  }
}
