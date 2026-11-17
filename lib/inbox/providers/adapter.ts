import type { NormalizedEvent, ProviderId } from '../types'

// A provider adapter turns one platform's wire format into MAG's NormalizedEvent.
// Everything downstream (ingest, dedupe, reply status, UI) only sees NormalizedEvent,
// so swapping a provider (e.g. Instagram direct -> a hosted messaging provider)
// means writing one new adapter, nothing else.

export interface ProviderAdapter {
  id: ProviderId
  /** false = the provider is not enabled in this release; routes answer honestly instead of guessing. */
  enabled: boolean
  /** Parse a VERIFIED webhook body. Must ignore (not invent) anything that is not a real message/contact event. */
  normalizeWebhook(body: unknown): NormalizedEvent[]
}

export class ProviderNotEnabled extends Error {
  constructor(public provider: ProviderId, message: string) {
    super(message)
    this.name = 'ProviderNotEnabled'
  }
}
