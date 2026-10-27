import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { postMessage, resolveChannelId, slackEscape } from '@/lib/slack-bot'

export const runtime = 'nodejs'
export const maxDuration = 30

export function agentDisplayName(identifier: string | null | undefined) {
  const local = (identifier ?? '').split('@')[0].toLowerCase()
  if (local.startsWith('seb')) return 'Seb'
  if (local.startsWith('doguhankar') || local === 'don') return 'Don'
  return local || 'unassigned'
}

// Called after any stage change in an agent CRM. Reads the lead's stage from the database and
// copies it onto every lead in the same linked_lead_group. Only leads whose stage differs are
// touched, so repeated calls are harmless and cannot loop.
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
    .select('id,name,stage,linked_lead_group')
    .eq('id', leadId)
    .maybeSingle()
  if (leadError || !lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (!lead.linked_lead_group || !lead.stage) return NextResponse.json({ synced: 0 })

  const { data: group, error: groupError } = await admin
    .from('leads')
    .select('id,agent_id,stage')
    .eq('linked_lead_group', lead.linked_lead_group)
    .neq('id', leadId)
  if (groupError) return NextResponse.json({ error: groupError.message }, { status: 500 })

  const stale = (group ?? []).filter(other => other.stage !== lead.stage)
  if (!stale.length) return NextResponse.json({ synced: 0 })

  const { error: updateError } = await admin
    .from('leads')
    .update({ stage: lead.stage })
    .in('id', stale.map(other => other.id))
  if (updateError) {
    console.error('[sync-stage] update failed for group', lead.linked_lead_group, updateError.message)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  const actor = agentDisplayName(email)
  const slackErrors: string[] = []
  try {
    const channel = await resolveChannelId('closes', process.env.SLACK_LEAD_SYNC_CHANNEL_ID ?? process.env.SLACK_CLOSES_CHANNEL_ID).catch(() => '#closes')
    for (const other of stale) {
      try {
        await postMessage(
          channel,
          `🔁 ${slackEscape(lead.name ?? 'Unknown')} moved to ${slackEscape(lead.stage)} by ${slackEscape(actor)}, synced to ${slackEscape(agentDisplayName(other.agent_id))}'s CRM`,
        )
      } catch (error) {
        slackErrors.push(error instanceof Error ? error.message : String(error))
      }
    }
  } catch (error) {
    slackErrors.push(error instanceof Error ? error.message : String(error))
  }
  if (slackErrors.length) console.error('[sync-stage] Slack post failed:', slackErrors.join('; '))

  return NextResponse.json({ synced: stale.length, slackErrors: slackErrors.length })
}
