// Integration BOUNDARY for the future group-text handoff. Types only: nothing here sends,
// provisions numbers, or calls a messaging service. Apple Business Register is NOT a group-chat
// service and is deliberately not used here.
//
// Intended flow (not built): qualified lead + phone + consent -> assigned agent -> ~45s delay
// -> create ONE group (client + agent + MAG line) -> messages come back as inbox events.

export type HandoffRequest = {
  conversationId: string
  leadId: number
  clientPhone: string
  consent: { given: true; recordedAt: string; source: string } // refuse to enqueue without it
  assignedAgentEmail: string
  delaySeconds: number // 45 by default
}

export type HandoffResult = { status: 'not_enabled' } | { status: 'queued'; handoffId: string } | { status: 'refused'; reason: string }

export interface GroupHandoffProvider {
  readonly enabled: boolean
  enqueue(req: HandoffRequest): Promise<HandoffResult>
}

/** Default: disabled. Replace with a real provider only after Don approves a service. */
export const disabledHandoff: GroupHandoffProvider = {
  enabled: false,
  async enqueue() {
    return { status: 'not_enabled' }
  },
}
