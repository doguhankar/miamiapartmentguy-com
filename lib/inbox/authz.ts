import type { SupabaseClient } from '@supabase/supabase-js'
import type { Actor } from './types'

// Authorization for service-role routes. Mirrors the RLS policies in
// supabase/migrations/20261117000000_social_inbox_v2.sql so a route that uses the
// service role can never grant more than the database would.
//
// Rules:
//  * "approved" = a current row in agent_allowlist with approved = true.
//  * Ordinary agents: conversations on accounts they own, or assigned to them.
//  * Team-wide visibility, reassigning and sending are three SEPARATE flags on a
//    non-revoked inbox_team_roles row. Having one never implies another.
//  * Nothing here keys off the building-image admin flag.

type ConvoRef = { agent_id: string; assigned_to: string | null }
type AccountRef = { owner_email: string }

const eq = (a: string | null | undefined, b: string | null | undefined) =>
  !!a && !!b && a.toLowerCase() === b.toLowerCase()

export function canViewConversation(actor: Actor | null, c: ConvoRef): boolean {
  if (!actor?.approved) return false
  if (eq(c.agent_id, actor.email) || eq(c.assigned_to, actor.email)) return true
  return !!actor.grant?.viewTeam
}

export function canViewAccount(actor: Actor | null, a: AccountRef): boolean {
  if (!actor?.approved) return false
  return eq(a.owner_email, actor.email) || !!actor.grant?.viewTeam
}

/** Connecting or reconnecting an account is owner-only; a team grant does not change that. */
export function canManageAccount(actor: Actor | null, a: AccountRef): boolean {
  return !!actor?.approved && eq(a.owner_email, actor.email)
}

export function canAssign(
  actor: Actor | null,
  c: ConvoRef,
  target: string | null,
  targetApproved: boolean,
): boolean {
  if (!canViewConversation(actor, c) || !actor) return false
  if (target !== null && !targetApproved) return false
  if (actor.grant?.reassign) return true
  if (c.assigned_to === null && eq(target, actor.email)) return true // claim
  if (eq(c.assigned_to, actor.email) && target === null) return true // release own
  return false
}

/** Creating/linking a CRM lead acts on someone's pipeline: owner/assignee, or an explicit reassign grant. */
export function canWriteLeadFor(actor: Actor | null, c: ConvoRef): boolean {
  if (!canViewConversation(actor, c) || !actor) return false
  const leadOwner = c.assigned_to ?? c.agent_id
  return eq(leadOwner, actor.email) || !!actor.grant?.reassign
}

export function canSendClientMessages(actor: Actor | null): boolean {
  return !!actor?.approved && !!actor.grant?.send
}

/** Resolve the caller from a Supabase access token. Re-checked on every request (no caching), so revocation is immediate. */
export async function resolveActor(admin: SupabaseClient, accessToken: string | null | undefined): Promise<Actor | null> {
  if (!accessToken) return null
  const { data, error } = await admin.auth.getUser(accessToken)
  const email = data?.user?.email?.toLowerCase()
  if (error || !email) return null

  const { data: allowed } = await admin
    .from('agent_allowlist')
    .select('email')
    .ilike('email', email)
    .eq('approved', true)
    .limit(1)
  const approved = !!allowed?.length
  if (!approved) return { email, approved: false, grant: null }

  const { data: role } = await admin
    .from('inbox_team_roles')
    .select('can_view_team,can_reassign,can_send_client_messages')
    .ilike('email', email)
    .is('revoked_at', null)
    .maybeSingle()

  return {
    email,
    approved: true,
    grant: role
      ? { viewTeam: !!role.can_view_team, reassign: !!role.can_reassign, send: !!role.can_send_client_messages }
      : null,
  }
}

export function bearer(request: Request): string | null {
  const h = request.headers.get('authorization')
  const m = h?.match(/^Bearer\s+(.+)$/i)
  return m ? m[1] : null
}
