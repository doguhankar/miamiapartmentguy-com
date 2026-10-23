import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatUsPhone, normalizeUsPhone, resolveStartSource, startLeadSchema, formatBudget, sizeLabel } from '@/lib/start-lead'
import { sendStartLeadEmail } from '@/lib/start-lead-email'

export const maxDuration = 30

const IP_WINDOW_MS = 10 * 60 * 1000
const IP_MAX_REQUESTS = 5
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000
const ipHits = new Map<string, number[]>()

// Best-effort per-instance limiter; the phone duplicate check below is the durable guard.
function isIpRateLimited(ip: string) {
  const now = Date.now()
  const recent = (ipHits.get(ip) ?? []).filter(time => now - time < IP_WINDOW_MS)
  recent.push(now)
  ipHits.set(ip, recent)
  if (ipHits.size > 5000) {
    for (const [key, times] of ipHits) if (times.every(time => now - time >= IP_WINDOW_MS)) ipHits.delete(key)
  }
  return recent.length > IP_MAX_REQUESTS
}

function clientIp(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
}

async function notifySlack(text: string) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) return false
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) console.error('[start-lead] Slack responded', response.status, await response.text())
    return response.ok
  } catch (error) {
    console.error('[start-lead] Slack failed:', error instanceof Error ? error.message : error)
    return false
  }
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 })
  }

  if (body && typeof body === 'object' && typeof (body as { website?: unknown }).website === 'string' && (body as { website: string }).website.trim()) {
    return NextResponse.json({ success: true })
  }

  if (isIpRateLimited(clientIp(request))) {
    return NextResponse.json({ success: false, error: 'Too many requests. Please wait a few minutes or text Don directly.' }, { status: 429 })
  }

  const parsed = startLeadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Please fix the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const input = parsed.data
  const phoneDigits = normalizeUsPhone(input.phone)
  if (!phoneDigits) {
    return NextResponse.json({ success: false, error: 'Please fix the highlighted fields.', fieldErrors: { phone: ['Enter a valid 10-digit US phone number'] } }, { status: 400 })
  }

  const phoneDisplay = formatUsPhone(phoneDigits)
  const source = resolveStartSource(input.source)
  const supabase = createAdminClient()

  const { count: recentDuplicates, error: duplicateError } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('phone', phoneDisplay)
    .gte('created_at', new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString())
  if (duplicateError) {
    console.error('[start-lead] duplicate check failed:', duplicateError.message)
  } else if ((recentDuplicates ?? 0) > 0) {
    return NextResponse.json({ success: false, error: "We already got your request. I'll text you shortly." }, { status: 429 })
  }

  const { data: lead, error: insertError } = await supabase
    .from('leads')
    .insert([
      {
        name: input.name,
        phone: phoneDisplay,
        move_in_timing: input.moveDate,
        beds: input.beds,
        budget: formatBudget(input.budget),
        area: input.neighborhood,
        credit_range: input.creditScore ? String(input.creditScore) : null,
        stage: 'New Lead',
        source,
        notes: input.notes || null,
      },
    ])
    .select('id')
    .single()

  if (insertError || !lead) {
    console.error('[start-lead] insert failed:', insertError?.code, insertError?.message)
    return NextResponse.json({ success: false, error: "We couldn't save your request. Please try again or text Don directly." }, { status: 500 })
  }

  const [emailResult, slackSent] = await Promise.all([
    sendStartLeadEmail({
      leadId: lead.id,
      name: input.name,
      phoneDisplay,
      phoneDigits,
      moveDate: input.moveDate,
      beds: input.beds,
      budget: input.budget,
      creditScore: input.creditScore,
      neighborhood: input.neighborhood,
      notes: input.notes,
      source,
    }),
    notifySlack(`New lead via ${source}: ${input.name} · ${phoneDisplay} · ${sizeLabel(input.beds)} · ${formatBudget(input.budget)}/mo · ${input.neighborhood}`),
  ])

  if (!emailResult.sent) console.error('[start-lead] notification email failed for lead', lead.id, emailResult.error)

  return NextResponse.json({ success: true, notified: { email: emailResult.sent, slack: slackSent } })
}
