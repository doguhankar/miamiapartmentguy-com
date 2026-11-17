import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { bearer, resolveActor } from '@/lib/inbox/authz'
import { signState } from '@/lib/inbox/connect'
import { authorizeUrl } from '@/lib/inbox/providers/instagram'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST (bearer) -> { url }. The browser then navigates to Instagram's official authorization page.
// MAG never sees or asks for a social-account password.
export async function POST(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params
  const actor = await resolveActor(createAdminClient(), bearer(request))
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!actor.approved) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (provider === 'instagram') {
    const clientId = process.env.META_APP_ID
    const configId = process.env.IG_CONFIG_ID
    const stateSecret = process.env.INBOX_STATE_SECRET
    if (!clientId || !configId || !stateSecret || !process.env.META_APP_SECRET) {
      return NextResponse.json(
        { error: 'Instagram is not configured on the server yet (META_APP_ID, META_APP_SECRET, IG_CONFIG_ID, INBOX_STATE_SECRET). See docs/inbox/SETUP.md.' },
        { status: 503 },
      )
    }
    const origin = process.env.INBOX_PUBLIC_ORIGIN ?? new URL(request.url).origin
    const url = authorizeUrl({
      clientId,
      configId,
      redirectUri: `${origin}/api/inbox/connect/instagram/callback`,
      state: signState({ email: actor.email, provider: 'instagram' }, stateSecret),
    })
    return NextResponse.json({ url })
  }

  if (provider === 'tiktok') {
    return NextResponse.json(
      { error: 'TikTok connection is not available yet: it needs TikTok Business Messaging API approval first.' },
      { status: 501 },
    )
  }


  return NextResponse.json({ error: 'Unknown provider' }, { status: 404 })
}
