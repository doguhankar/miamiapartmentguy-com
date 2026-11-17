import { randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { bearer, canManageAccount, resolveActor } from '@/lib/inbox/authz'
import { encryptSecret } from '@/lib/inbox/crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Owner-only. Generates (or rotates) the shared secret for a Manychat account slot and returns it ONCE.
// Only the encrypted value is stored.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()
  const actor = await resolveActor(admin, bearer(request))
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: acc } = await admin.from('social_accounts').select('id,provider,owner_email').eq('id', id).maybeSingle()
  // unknown id and "not yours" look identical
  if (!acc || !canManageAccount(actor, acc)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (acc.provider !== 'manychat') return NextResponse.json({ error: 'Only Manychat accounts use a webhook secret' }, { status: 400 })

  const secret = randomBytes(24).toString('base64url')
  const { error } = await admin
    .from('social_account_credentials')
    .upsert({ account_id: id, webhook_secret_enc: encryptSecret(secret), updated_at: new Date().toISOString() }, { onConflict: 'account_id' })
  if (error) return NextResponse.json({ error: 'Could not save the secret' }, { status: 500 })

  await admin.from('social_accounts').update({ status: 'connected', capabilities: { lead_sync: true }, updated_at: new Date().toISOString() }).eq('id', id)
  return NextResponse.json({ accountId: id, secret })
}
