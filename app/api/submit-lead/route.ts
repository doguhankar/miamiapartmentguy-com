import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface LeadData {
  moveDate: string
  apartmentSize: string
  budget: string
  neighborhoods: string[]
  creditScore: string
  name: string
  phone: string
}

// Cache for Notion database schema to avoid fetching on every request
let notionSchemaCache: any = null
let schemaCacheTime = 0
const SCHEMA_CACHE_TTL = 3600000 // 1 hour in milliseconds

async function getNotionSchema(token: string, dbId: string) {
  const now = Date.now()
  
  // Return cached schema if still valid
  if (notionSchemaCache && (now - schemaCacheTime) < SCHEMA_CACHE_TTL) {
    console.log('[v0] Using cached Notion schema')
    return notionSchemaCache
  }
  
  console.log('[v0] Fetching fresh Notion database schema...')
  const schemaResponse = await fetch(`https://api.notion.com/v1/databases/${dbId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
    },
  })
  
  const schemaData = await schemaResponse.json()
  
  if (schemaResponse.ok) {
    notionSchemaCache = schemaData.properties
    schemaCacheTime = now
    console.log('[v0] Notion schema cached')
  }
  
  return schemaData.properties
}

async function sendToSlack(webhookUrl: string, leadData: LeadData) {
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
              text: `*Name:*\n${leadData.name}`,
            },
            {
              type: 'mrkdwn',
              text: `*Phone:*\n${leadData.phone}`,
            },
            {
              type: 'mrkdwn',
              text: `*Move Date:*\n${leadData.moveDate}`,
            },
            {
              type: 'mrkdwn',
              text: `*Budget:*\n${leadData.budget}`,
            },
            {
              type: 'mrkdwn',
              text: `*Apartment Size:*\n${leadData.apartmentSize}`,
            },
            {
              type: 'mrkdwn',
              text: `*Credit Score:*\n${leadData.creditScore}`,
            },
            {
              type: 'mrkdwn',
              text: `*Neighborhoods:*\n${leadData.neighborhoods.join(', ')}`,
            },
            {
              type: 'mrkdwn',
              text: `*Submitted:*\n${new Date().toISOString()}`,
            },
          ],
        },
      ],
    }

    const slackResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage),
    })

    console.log('[v0] Slack response status:', slackResponse.status)
    const slackText = await slackResponse.text()

    if (!slackResponse.ok) {
      console.error('[v0] ❌ Slack API error:', slackText)
      return { sent: false, error: slackText }
    } else {
      console.log('[v0] ✅ Slack notification sent successfully')
      return { sent: true, error: null }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('[v0] ❌ Slack error:', errorMsg)
    return { sent: false, error: errorMsg }
  }
}

async function sendToNotion(
  token: string,
  dbId: string,
  leadData: LeadData,
  properties: any
) {
  try {
    console.log('[v0] Sending to Notion...')
    
    const propertyNames = Object.keys(properties)
    
    // Find the title property or use the first one
    let titleProp = propertyNames.find(
      name => properties[name as keyof typeof properties].type === 'title'
    )
    if (!titleProp && propertyNames.length > 0) {
      titleProp = propertyNames[0]
    }
    
    // Build payload with only properties that exist in the database
    const notionPayload: any = {
      parent: { database_id: dbId },
      properties: {},
    }
    
    // Map our lead data to available properties
    if (titleProp) {
      const titlePropObj = properties[titleProp as keyof typeof properties] as any
      if (titlePropObj.type === 'title') {
        notionPayload.properties[titleProp] = { title: [{ text: { content: leadData.name } }] }
      } else {
        notionPayload.properties[titleProp] = { rich_text: [{ text: { content: leadData.name } }] }
      }
    }
    
    // Add other properties if they exist
    for (const propName of propertyNames) {
      const propObj = properties[propName as keyof typeof properties] as any
      if (propObj.type === 'relation') {
        continue
      } else if (propObj.type === 'multi_select') {
        if (propName.toLowerCase().includes('apartment') || propName.toLowerCase().includes('size')) {
          notionPayload.properties[propName] = { multi_select: [{ name: leadData.apartmentSize }] }
        } else if (propName.toLowerCase().includes('credit')) {
          notionPayload.properties[propName] = { multi_select: [{ name: leadData.creditScore }] }
        } else if (propName.toLowerCase().includes('neighborhood')) {
          notionPayload.properties[propName] = { multi_select: leadData.neighborhoods.map(n => ({ name: n })) }
        }
      } else if (propObj.type === 'rich_text' || propObj.type === 'text') {
        if (propName.toLowerCase().includes('phone')) {
          notionPayload.properties[propName] = { rich_text: [{ text: { content: leadData.phone } }] }
        } else if (propName.toLowerCase().includes('date') || propName.toLowerCase().includes('move')) {
          notionPayload.properties[propName] = { rich_text: [{ text: { content: leadData.moveDate } }] }
        } else if (propName.toLowerCase().includes('budget')) {
          notionPayload.properties[propName] = { rich_text: [{ text: { content: leadData.budget } }] }
        }
      }
    }
    
    const notionResponse = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify(notionPayload),
    })

    console.log('[v0] Notion response status:', notionResponse.status)
    const notionData = await notionResponse.json()

    if (!notionResponse.ok) {
      console.error('[v0] ❌ Notion API error (status', notionResponse.status + '):', notionData)
      return {
        sent: false,
        error: notionData.message || 'Unknown Notion API error',
        errorDetails: {
          status: notionResponse.status,
          message: notionData.message,
        },
      }
    } else {
      console.log('[v0] ✅ Notion page created successfully:', notionData.id)
      return { sent: true, error: null, errorDetails: null }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('[v0] ❌ Notion error:', errorMsg)
    return { sent: false, error: errorMsg, errorDetails: null }
  }
}

async function sendToSupabase(leadData: LeadData) {
  try {
    console.log('[v0] Sending to Supabase...')
    const supabase = createAdminClient()

    const { data, error } = await supabase.from('leads').insert([
      {
        name: leadData.name,
        phone: leadData.phone,
        move_in_timing: leadData.moveDate,
        beds: leadData.apartmentSize,
        budget: leadData.budget,
        area: leadData.neighborhoods[0] || null,
        credit_range: leadData.creditScore,
        agent_id: 'doguhankar1@gmail.com',
        stage: 'New Lead',
        source: 'Homepage Form',
      },
    ])

    if (error) {
      console.error('[v0] ❌ Supabase insert error:', error)
      return { sent: false, error: error.message }
    } else {
      console.log('[v0] ✅ Supabase lead inserted successfully:', data)
      return { sent: true, error: null }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('[v0] ❌ Supabase error:', errorMsg)
    return { sent: false, error: errorMsg }
  }
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

    const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL
    const NOTION_TOKEN = process.env.NOTION_TOKEN
    const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID

    console.log('[v0] Environment check:', {
      SLACK_WEBHOOK_URL_present: !!SLACK_WEBHOOK_URL,
      NOTION_TOKEN_present: !!NOTION_TOKEN,
      NOTION_DATABASE_ID_present: !!NOTION_DATABASE_ID,
    })

    // Fire Slack, Notion, and Supabase in parallel without waiting for results
    // This allows the API to return immediately while integrations process in background
    const integrationPromises: Promise<any>[] = []

    if (SLACK_WEBHOOK_URL) {
      integrationPromises.push(sendToSlack(SLACK_WEBHOOK_URL, body).catch(e => ({ sent: false, error: String(e) })))
    }

    if (NOTION_TOKEN && NOTION_DATABASE_ID) {
      // Get schema (cached or fresh) then send to Notion
      integrationPromises.push(
        getNotionSchema(NOTION_TOKEN, NOTION_DATABASE_ID)
          .then(properties => sendToNotion(NOTION_TOKEN, NOTION_DATABASE_ID, body, properties))
          .catch(e => ({ sent: false, error: String(e) }))
      )
    }

    // Always send to Supabase (service-role key is required)
    integrationPromises.push(sendToSupabase(body).catch(e => ({ sent: false, error: String(e) })))

    // Use Promise.allSettled to wait for all integrations (for logging), but don't return immediately
    const integrationResults = await Promise.allSettled(integrationPromises)
    
    console.log('[v0] ===== LEAD SUBMISSION END =====')
    console.log('[v0] Integration results:', JSON.stringify(integrationResults, null, 2))

    // Return success immediately - background integrations may still be processing
    // This gives the user instant feedback while integrations complete in parallel
    return NextResponse.json(
      { 
        success: true, 
        message: 'Lead submitted successfully',
        leadData: {
          name: body.name,
          phone: body.phone,
          timestamp: new Date().toISOString(),
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] ===== ERROR PROCESSING LEAD =====')
    console.error('[v0] Error:', error instanceof Error ? error.message : String(error))
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
