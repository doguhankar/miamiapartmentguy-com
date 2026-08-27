import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface LeasingLeadBody {
  buildingName?: unknown
  buildingId?: unknown
  firstName?: unknown
  lastName?: unknown
  email?: unknown
  phone?: unknown
  intents?: unknown
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LeasingLeadBody
    const buildingName = text(body.buildingName)
    const buildingId = text(body.buildingId)
    const firstName = text(body.firstName)
    const lastName = text(body.lastName)
    const email = text(body.email)
    const phone = text(body.phone)
    const intents = Array.isArray(body.intents)
      ? body.intents.filter((intent): intent is string => typeof intent === 'string').map(intent => intent.trim()).filter(Boolean)
      : []

    if (!firstName || !lastName || !phone || !buildingName || !buildingId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const name = `${firstName} ${lastName}`
    const notes = `Interested in: ${intents.length ? intents.join(', ') : 'Not specified'}`
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('leads')
      .insert([{
        name,
        email: email || null,
        phone,
        notes,
        source: 'leasing_form',
        stage: 'new',
        building_name: buildingName,
        building_id: buildingId,
      }])
      .select()
      .single()

    if (error) {
      console.error('[v0] Leasing lead insert failed:', error)
      return NextResponse.json({ success: false, error: 'Unable to save lead' }, { status: 500 })
    }

    const webhookUrl = process.env.SLACK_WEBHOOK_URL
    if (webhookUrl) {
      const slackResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: '🏢 New Leasing Lead Submission',
          blocks: [
            {
              type: 'header',
              text: { type: 'plain_text', text: '🏢 New Leasing Lead Submission' },
            },
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: `*Name:*\n${name}` },
                { type: 'mrkdwn', text: `*Phone:*\n${phone}` },
                { type: 'mrkdwn', text: `*Email:*\n${email || 'Not provided'}` },
                { type: 'mrkdwn', text: `*Building:*\n${buildingName}` },
                { type: 'mrkdwn', text: `*Building ID:*\n${buildingId}` },
                { type: 'mrkdwn', text: `*Interested in:*\n${intents.length ? intents.join(', ') : 'Not specified'}` },
                { type: 'mrkdwn', text: `*Submitted:*\n${new Date().toISOString()}` },
              ],
            },
          ],
        }),
      })

      if (!slackResponse.ok) {
        console.error('[v0] Leasing lead Slack notification failed:', await slackResponse.text())
      }
    }

    return NextResponse.json({ success: true, lead: data })
  } catch (error) {
    console.error('[v0] Leasing lead submission failed:', error)
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }
}
