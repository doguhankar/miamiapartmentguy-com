import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { saveConnection, verifyState } from '@/lib/inbox/connect'
import { exchangeCode, fetchProfile, isProfessional, subscribeWebhooks, IG_SCOPES } from '@/lib/inbox/providers/instagram'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const back = (request: NextRequest, q: string) => NextResponse.redirect(new URL(`/agent/inbox/connections?${q}`, request.url))

// Instagram redirects here with ?code&state. Identity comes from the signed state we issued, not from the request.
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  if (sp.get('error')) return back(request, 'error=denied')

  const state = verifyState(sp.get('state'), process.env.INBOX_STATE_SECRET)
  if (!state || state.provider !== 'instagram') return back(request, 'error=state')

  const code = sp.get('code')
  const clientId = process.env.IG_APP_ID
  const clientSecret = process.env.IG_APP_SECRET
  if (!code || !clientId || !clientSecret) return back(request, 'error=config')

  const admin = createAdminClient()

  // approval is re-checked at the moment of connecting, not only when the flow started
  const { data: allowed } = await admin.from('agent_allowlist').select('email').ilike('email', state.email).eq('approved', true).limit(1)
  if (!allowed?.length) return back(request, 'error=forbidden')

  try {
    const origin = process.env.INBOX_PUBLIC_ORIGIN ?? new URL(request.url).origin
    const redirectUri = `${origin}/api/inbox/connect/instagram/callback`
    const tokens = await exchangeCode({ clientId, clientSecret, redirectUri, code })
    const profile = await fetchProfile(tokens.accessToken)

    if (!isProfessional(profile.accountType)) return back(request, 'error=not_professional')
    if (!tokens.permissions.includes('instagram_business_manage_messages')) return back(request, 'error=missing_permission')

    const webhooks = await subscribeWebhooks(tokens.accessToken)
    const saved = await saveConnection(admin, {
      provider: 'instagram',
      ownerEmail: state.email,
      externalAccountId: profile.id,
      handle: profile.username ? `@${profile.username}` : null,
      label: profile.username ? `Instagram @${profile.username}` : 'Instagram',
      scopes: tokens.permissions.length ? tokens.permissions : IG_SCOPES,
      capabilities: { webhooks },
      accessToken: tokens.accessToken,
      tokenExpiresAt: tokens.expiresInSec ? new Date(Date.now() + tokens.expiresInSec * 1000) : null,
    })
    if (!saved.ok) return back(request, 'error=owned_by_other')
    return back(request, `connected=${encodeURIComponent(profile.username ?? 'instagram')}${webhooks ? '' : '&note=webhook_manual'}`)
  } catch (e) {
    console.error('[inbox/connect/instagram] failed:', e instanceof Error ? e.message : e)
    return back(request, 'error=exchange')
  }
}
