import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { saveConnection, verifyState } from '@/lib/inbox/connect'
import { exchangeCode, fetchClientBusinessId, fetchSharedAccounts, subscribeWebhooks } from '@/lib/inbox/providers/instagram'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const back = (request: NextRequest, q: string) => NextResponse.redirect(new URL(`/agent/inbox/connections?${q}`, request.url))

// Meta redirects here with ?code&state. Identity comes from the signed state we issued, not from the request.
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  if (sp.get('error')) return back(request, 'error=denied')

  const state = verifyState(sp.get('state'), process.env.INBOX_STATE_SECRET)
  if (!state || state.provider !== 'instagram') return back(request, 'error=state')

  const code = sp.get('code')
  const clientId = process.env.META_APP_ID
  const clientSecret = process.env.META_APP_SECRET
  if (!code || !clientId || !clientSecret) return back(request, 'error=config')

  const admin = createAdminClient()

  // approval is re-checked at the moment of connecting, not only when the flow started
  const { data: allowed } = await admin.from('agent_allowlist').select('email').ilike('email', state.email).eq('approved', true).limit(1)
  if (!allowed?.length) return back(request, 'error=forbidden')

  try {
    const tokens = await exchangeCode({ clientId, clientSecret, code })
    const accounts = await fetchSharedAccounts(tokens.accessToken)
    if (!accounts.length) return back(request, 'error=no_accounts')
    const businessId = await fetchClientBusinessId(tokens.accessToken)

    const connected: string[] = []
    let webhookFailed = false
    for (const a of accounts) {
      const webhooks = await subscribeWebhooks(tokens.accessToken, a.id)
      if (!webhooks) webhookFailed = true
      const saved = await saveConnection(admin, {
        provider: 'instagram',
        ownerEmail: state.email,
        externalAccountId: a.id,
        handle: a.username ? `@${a.username}` : null,
        label: a.username ? `Instagram @${a.username}` : 'Instagram',
        scopes: ['instagram_basic', 'instagram_manage_messages'],
        capabilities: { webhooks },
        accessToken: tokens.accessToken,
        tokenExpiresAt: tokens.expiresInSec ? new Date(Date.now() + tokens.expiresInSec * 1000) : null,
        clientBusinessId: businessId,
      })
      if (!saved.ok) return back(request, 'error=owned_by_other')
      connected.push(a.username ?? a.id)
    }
    return back(request, `connected=${encodeURIComponent(connected.join(', '))}${webhookFailed ? '&note=webhook_manual' : ''}`)
  } catch (e) {
    console.error('[inbox/connect/instagram] failed:', e instanceof Error ? e.message : e)
    return back(request, 'error=exchange')
  }
}
