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
  const results = {
    success: true,
    slack: { sent: false, error: null as string | null },
    notion: { sent: false, error: null as string | null, errorDetails: null as any },
  }

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
      results.slack.error = 'SLACK_WEBHOOK_URL not configured'
    }
    if (!NOTION_TOKEN) {
      console.warn('[v0] ⚠️  NOTION_TOKEN not set in environment')
      results.notion.error = 'NOTION_TOKEN not configured'
    }
    if (!NOTION_DATABASE_ID) {
      console.warn('[v0] ⚠️  NOTION_DATABASE_ID not set in environment')
      results.notion.error = 'NOTION_DATABASE_ID not configured'
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
          results.slack.error = slackText
        } else {
          console.log('[v0] ✅ Slack notification sent successfully')
          results.slack.sent = true
        }
      } catch (slackError) {
        const errorMsg = slackError instanceof Error ? slackError.message : String(slackError)
        console.error('[v0] ❌ Slack error:', errorMsg)
        results.slack.error = errorMsg
      }
    }

    // Send to Notion
    if (NOTION_TOKEN && NOTION_DATABASE_ID) {
      try {
        console.log('[v0] Sending to Notion...')
        console.log('[v0] Notion Database ID:', NOTION_DATABASE_ID)
        
        // First, fetch the database schema to see what properties exist
        console.log('[v0] Fetching Notion database schema...')
        const schemaResponse = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${NOTION_TOKEN}`,
            'Notion-Version': '2022-06-28',
          },
        })
        
        const schemaData = await schemaResponse.json()
        
        if (!schemaResponse.ok) {
          console.error('[v0] ❌ Failed to fetch Notion database schema:', schemaData)
          results.notion.error = `Failed to fetch database schema: ${schemaData.message || 'Unknown error'}`
          results.notion.errorDetails = schemaData
          results.success = false
        } else {
          // Extract property names and types from schema
          const properties = schemaData.properties || {}
          const propertyNames = Object.keys(properties)
          console.log('[v0] Available properties in Notion database:', JSON.stringify(Object.entries(properties).map(([name, prop]: any) => ({ name, type: prop.type })), null, 2))
          
          // Find the title property or use the first one
          let titleProp = propertyNames.find(name => properties[name as keyof typeof properties].type === 'title')
          if (!titleProp && propertyNames.length > 0) {
            titleProp = propertyNames[0]
          }
          
          console.log('[v0] Using title property:', titleProp)
          
          // Build payload with only properties that exist in the database
          const notionPayload: any = {
            parent: { database_id: NOTION_DATABASE_ID },
            properties: {},
          }
          
          // Map our lead data to available properties
          if (titleProp) {
            const titlePropObj = properties[titleProp as keyof typeof properties] as any
            if (titlePropObj.type === 'title') {
              notionPayload.properties[titleProp] = { title: [{ text: { content: body.name } }] }
            } else {
              notionPayload.properties[titleProp] = { rich_text: [{ text: { content: body.name } }] }
            }
          }
          
          // Add other properties if they exist
          for (const propName of propertyNames) {
            const propObj = properties[propName as keyof typeof properties] as any
            if (propObj.type === 'relation') {
              // Skip relation properties
              continue
            } else if (propObj.type === 'multi_select') {
              // For multi_select, create appropriate selection
              if (propName.toLowerCase().includes('apartment') || propName.toLowerCase().includes('size')) {
                notionPayload.properties[propName] = { multi_select: [{ name: body.apartmentSize }] }
              } else if (propName.toLowerCase().includes('credit')) {
                notionPayload.properties[propName] = { multi_select: [{ name: body.creditScore }] }
              } else if (propName.toLowerCase().includes('neighborhood')) {
                notionPayload.properties[propName] = { multi_select: body.neighborhoods.map(n => ({ name: n })) }
              }
            } else if (propObj.type === 'rich_text' || propObj.type === 'text') {
              // Add as rich_text if empty and matches our data
              if (propName.toLowerCase().includes('phone')) {
                notionPayload.properties[propName] = { rich_text: [{ text: { content: body.phone } }] }
              } else if (propName.toLowerCase().includes('date') || propName.toLowerCase().includes('move')) {
                notionPayload.properties[propName] = { rich_text: [{ text: { content: body.moveDate } }] }
              } else if (propName.toLowerCase().includes('budget')) {
                notionPayload.properties[propName] = { rich_text: [{ text: { content: body.budget } }] }
              }
            }
          }
          
          console.log('[v0] Notion payload being sent:', JSON.stringify(notionPayload, null, 2))

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
            console.error('[v0] ❌ Notion API error (status', notionResponse.status + '):', JSON.stringify(notionData, null, 2))
            results.notion.error = notionData.message || 'Unknown Notion API error'
            results.notion.errorDetails = {
              status: notionResponse.status,
              message: notionData.message,
              availableProperties: Object.entries(properties).map(([name, prop]: any) => ({ name, type: prop.type })),
            }
            results.success = false
          } else {
            console.log('[v0] ✅ Notion page created successfully:', notionData.id)
            results.notion.sent = true
          }
        }
      } catch (notionError) {
        const errorMsg = notionError instanceof Error ? notionError.message : String(notionError)
        console.error('[v0] ❌ Notion error:', errorMsg)
        console.error('[v0] Full Notion error:', notionError)
        results.notion.error = errorMsg
        results.success = false
      }
    }

    console.log('[v0] ===== LEAD SUBMISSION END =====')
    console.log('[v0] Submission results:', JSON.stringify(results, null, 2))

    return NextResponse.json(results, { status: results.success ? 200 : 207 })
  } catch (error) {
    console.error('[v0] ===== ERROR PROCESSING LEAD =====')
    console.error('[v0] Error:', error instanceof Error ? error.message : String(error))
    console.error('[v0] Full error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to submit lead',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
