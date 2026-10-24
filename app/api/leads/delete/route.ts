import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

// public.leads has no DELETE RLS policy, so a browser-side delete would remove
// zero rows and report success. The delete runs here with the service role,
// after verifying the caller, ownership, and that the lead is in Archive.
export async function POST(request: NextRequest) {
  const admin = createAdminClient()

  const accessToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: userData, error: userError } = await admin.auth.getUser(accessToken)
  const email = userData.user?.email
  if (userError || !email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: allowed } = await admin.from('agent_allowlist').select('email').ilike('email', email).limit(1)
  if (!allowed?.length) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = (await request.json().catch(() => null)) as { leadId?: number | string } | null
  const leadId = Number(body?.leadId)
  if (!Number.isInteger(leadId)) return NextResponse.json({ error: 'Invalid lead id' }, { status: 400 })

  const { data: lead, error: leadError } = await admin
    .from('leads')
    .select('id,agent_id,stage')
    .eq('id', leadId)
    .maybeSingle()
  if (leadError) {
    console.error(`[leads/delete] lookup failed for lead ${leadId}:`, leadError.message)
    return NextResponse.json({ error: 'Could not look up the lead' }, { status: 500 })
  }
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if ((lead.agent_id ?? '').toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (lead.stage !== 'Archive') {
    return NextResponse.json({ error: 'Only archived leads can be deleted' }, { status: 409 })
  }

  const { data: deleted, error: deleteError } = await admin
    .from('leads')
    .delete()
    .eq('id', leadId)
    .select('id')
  if (deleteError) {
    console.error(`[leads/delete] delete failed for lead ${leadId}:`, deleteError.message)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }
  if (!deleted?.length) {
    return NextResponse.json({ error: 'Delete did not remove the lead' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: leadId })
}
