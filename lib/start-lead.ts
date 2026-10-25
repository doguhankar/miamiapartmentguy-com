import { z } from 'zod'
import { neighborhoodCenters } from '@/lib/neighborhood-centers'

export const START_NEIGHBORHOODS = Object.keys(neighborhoodCenters).sort() as [string, ...string[]]
export const START_BEDS = ['Studio', '1', '2', '3+'] as const
export const START_NOT_SURE = 'Not sure yet'
export const START_SOURCES = ['instagram', 'tiktok', 'fb', 'dm', 'calculator'] as const
export type StartSource = (typeof START_SOURCES)[number]

export const DON_SMS_HREF = 'sms:+14077657306'

export function resolveStartSource(value: unknown): StartSource {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return (START_SOURCES as readonly string[]).includes(normalized) ? (normalized as StartSource) : 'instagram'
}

export function normalizeUsPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  const national = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
  return national.length === 10 ? national : null
}

export function formatUsPhone(national: string) {
  return `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`
}

export function todayIso() {
  const now = new Date()
  const offsetMs = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10)
}

export function oneYearOutIso() {
  const date = new Date(`${todayIso()}T00:00:00`)
  date.setFullYear(date.getFullYear() + 1)
  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10)
}

const BUDGET_REQUIRED = 'Enter your monthly budget'

export const startLeadSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your name').max(80, 'Name is too long'),
    phone: z.string().trim().refine(value => normalizeUsPhone(value) !== null, 'Enter a valid 10-digit US phone number'),
    moveDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a move-in date')
      .refine(value => value >= todayIso(), 'Move-in date must be today or later')
      .refine(value => value <= oneYearOutIso(), 'Move-in date must be within the next year'),
    beds: z.enum(START_BEDS, { errorMap: () => ({ message: 'Choose an apartment size' }) }),
    budget: z.preprocess(
      value => {
        if (typeof value !== 'string') return value
        const cleaned = value.replace(/[$,\s]/g, '')
        return cleaned === '' ? undefined : cleaned
      },
      z.coerce
        .number({ required_error: BUDGET_REQUIRED, invalid_type_error: BUDGET_REQUIRED })
        .int('Budget must be a whole dollar amount')
        .gt(0, 'Budget must be greater than 0')
        .max(1_000_000, 'Enter a realistic monthly budget'),
    ),
    creditScore: z.preprocess(
      value => (value === '' || value === null || value === undefined ? undefined : value),
      z.coerce.number().int('Credit score must be a whole number').min(300, 'Credit score must be 300–850').max(850, 'Credit score must be 300–850').optional(),
    ),
    neighborhood: z.preprocess(
      value => (value === '' || value === null || value === undefined ? START_NOT_SURE : value),
      z.enum([START_NOT_SURE, ...START_NEIGHBORHOODS], { errorMap: () => ({ message: 'Choose a neighborhood from the list' }) }),
    ),
    notes: z.string().trim().max(500, 'Keep notes under 500 characters').optional(),
    source: z.string().optional(),
    agentSlug: z.string().trim().max(80).optional(),
    website: z.string().optional(),
  })

export type StartLeadInput = z.input<typeof startLeadSchema>
export type StartLeadParsed = z.output<typeof startLeadSchema>

export function sizeLabel(beds: string) {
  return beds === 'Studio' ? 'Studio' : `${beds} BR`
}

export function formatBudget(amount: number) {
  return `$${amount.toLocaleString('en-US')}`
}
