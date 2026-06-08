import { NextRequest, NextResponse } from 'next/server'

interface LeadData {
  moveDate: string
  apartmentSize: string
  budget: string
  neighborhoods: string[]
  creditScore: string
  name: string
  phone: string
}

export async function POST(request: NextRequest) {
  try {
    const body: LeadData = await request.json()

    console.log('[v0] ===== LEAD SUBMISSION START =====')
    console.log('[v0] Lead data received:', {
      name: body.name,
      phone: body.phone,
      moveDate: body.moveDate,
      budget: body.budget,
      neighborhoods: body.neighborhoods.join(', '),
      apartmentSize: body.apartmentSize,
      creditScore: body.creditScore,
      timestamp: new Date().toISOString(),
    })

    // Check environment variables
    const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL
    const NOTION_TOKEN = process.env.NOTION_TOKEN
    const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID

    console.log('[v0] Environment check:', {
      SLACK_WEBHOOK_URL_present: !!SLACK_WEBHOOK_URL,
      NOTION_TOKEN_present: !!NOTION_TOKEN,
      NOTION_DATABASE_ID_present: !!NOTION_DATABASE_ID,
    })

    if (!SLACK_WEBHOOK_URL) {
      console.warn('[v0] ⚠️  SLACK_WEBHOOK_URL not set in environment')
    }
    if (!NOTION_TOKEN) {
      console.warn('[v0] ⚠️  NOTION_TOKEN not set in environment')
    }
    if (!NOTION_DATABASE_ID) {
      console.warn('[v0] ⚠️  NOTION_DATABASE_ID not set in environment')
    }

    // Send to Slack
    if (SLACK_WEBHOOK_URL) {
      try {
        console.log('[v0] Sending to Slack...')
        const slackMessage = {
          text: '🏢 New Lead from Move with Don Form',
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: '🏢 New Lead Submission',
              },
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*Name:*\n${body.name}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Phone:*\n${body.phone}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Move Date:*\n${body.moveDate}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Budget:*\n${body.budget}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Apartment Size:*\n${body.apartmentSize}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Credit Score:*\n${body.creditScore}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Neighborhoods:*\n${body.neighborhoods.join(', ')}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Submitted:*\n${new Date().toISOString()}`,
                },
              ],
            },
          ],
        }

        const slackResponse = await fetch(SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slackMessage),
        })

        console.log('[v0] Slack response status:', slackResponse.status)
        const slackText = await slackResponse.text()
        console.log('[v0] Slack response body:', slackText)

        if (!slackResponse.ok) {
          console.error('[v0] ❌ Slack API error:', slackText)
        } else {
          console.log('[v0] ✅ Slack notification sent successfully')
        }
      } catch (slackError) {
        console.error('[v0] ❌ Slack error:', slackError instanceof Error ? slackError.message : String(slackError))
      }
    }

    // Send to Notion
    if (NOTION_TOKEN && NOTION_DATABASE_ID) {
      try {
        console.log('[v0] Sending to Notion...')
        const notionPayload = {
          parent: { database_id: NOTION_DATABASE_ID },
          properties: {
            Name: { title: [{ text: { content: body.name } }] },
            'Phone': { rich_text: [{ text: { content: body.phone } }] },
            'Move Date': { rich_text: [{ text: { content: body.moveDate } }] },
            'Budget': { rich_text: [{ text: { content: body.budget } }] },
            'Apartment Size': { rich_text: [{ text: { content: body.apartmentSize } }] },
            'Credit Score': { rich_text: [{ text: { content: body.creditScore } }] },
            'Neighborhoods': { rich_text: [{ text: { content: body.neighborhoods.join(', ') } }] },
            'Submitted At': { rich_text: [{ text: { content: new Date().toISOString() } }] },
          },
        }

        const notionResponse = await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${NOTION_TOKEN}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
          },
          body: JSON.stringify(notionPayload),
        })

        console.log('[v0] Notion response status:', notionResponse.status)
        const notionData = await notionResponse.json()
        console.log('[v0] Notion response body:', JSON.stringify(notionData, null, 2))

        if (!notionResponse.ok) {
          console.error('[v0] ❌ Notion API error:', notionData)
        } else {
          console.log('[v0] ✅ Notion page created successfully:', notionData.id)
        }
      } catch (notionError) {
        console.error('[v0] ❌ Notion error:', notionError instanceof Error ? notionError.message : String(notionError))
      }
    }

    console.log('[v0] ===== LEAD SUBMISSION END =====')

    return NextResponse.json(
      { success: true, message: 'Lead submitted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] ===== ERROR PROCESSING LEAD =====')
    console.error('[v0] Error:', error instanceof Error ? error.message : String(error))
    console.error('[v0] Full error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit lead' },
      { status: 500 }
    )
  }
}
