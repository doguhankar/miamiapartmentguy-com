import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface LeadData {
  moveDate: string
  apartmentSize: string
  budget: string
  neighborhoods: string[]
  creditScore: string
  agent: string
  name: string
  phone: string
  source?: string
  brokerage?: string
  licensed?: string
  agentId?: string
  slackChannel?: string
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
    const isAgentApplicant = leadData.source === 'agent_recruit'
    const slackMessage = isAgentApplicant
      ? {
          channel: leadData.slackChannel,
          text: `🧑‍💼 New Agent Applicant\nName: ${leadData.name}\nPhone: ${leadData.phone}\nCurrent brokerage: ${leadData.brokerage || 'Not provided'}\nLicensed in Florida: ${leadData.licensed || 'Not provided'}\nSource: agent_recruit`,
        }
      : {
          channel: leadData.slackChannel,
          text: '🏢 New Lead from Move with Don Form',
          blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: isAgentApplicant ? '🧑‍💼 New Agent Applicant' : '🏢 New Lead Submission',
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
              text: `*Agent:*
${leadData.agent}`,
            },
            ...(isAgentApplicant
              ? [
                  { type: 'mrkdwn', text: `*Brokerage:*\n${leadData.brokerage || 'Not provided'}` },
                  { type: 'mrkdwn', text: `*Licensed in Florida:*\n${leadData.licensed || 'Not provided'}` },
                  { type: 'mrkdwn', text: '*Source:*\nagent_recruit' },
                ]
              : []),
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
        } else if (propName.toLowerCase().includes('agent')) {
          notionPayload.properties[propName] = { rich_text: [{ text: { content: leadData.agent } }] }
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
    const supabase = createAdminClient()

    const payload = {
      name: leadData.name,
      phone: leadData.phone,
      move_in_timing: leadData.moveDate,
      beds: leadData.apartmentSize,
      budget: leadData.budget,
      area: leadData.neighborhoods[0] || null,
      credit_range: leadData.creditScore,
      agent_id: leadData.agentId || 'doguhankar1@gmail.com',
      stage: 'New Lead',
      source: leadData.source || 'Homepage Form',
      notes: leadData.source === 'agent_recruit'
        ? `Brokerage: ${leadData.brokerage || 'Not provided'}; Licensed in Florida: ${leadData.licensed || 'Not provided'}`
        : `Selected agent: ${leadData.agent}`,
    }

    // .select() ensures the inserted row is returned in data (without it data is always null)
    const { data, error } = await supabase.from('leads').insert([payload]).select()

    if (error) {
      console.error('[supabase] insert failed — code:', error.code, '| message:', error.message, '| details:', error.details)
      return { sent: false, error: { code: error.code, message: error.message, details: error.details, hint: error.hint } }
    }

    return { sent: true, data: data?.[0] ?? null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[supabase] exception:', msg)
    return { sent: false, error: msg }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: LeadData = await request.json()

    const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL
    const NOTION_TOKEN = process.env.NOTION_TOKEN
    const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID

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

    // Use Promise.allSettled to wait for all integrations and capture their results
    const integrationResults = await Promise.allSettled(integrationPromises)

    // Extract results from Promise.allSettled for each integration
    // Index mapping depends on which integrations were included:
    // - Slack (if configured) → index 0
    // - Notion (if configured) → index 0 or 1 (after Slack)
    // - Supabase (always) → always last
    let slackResult = null
    let notionResult = null
    let supabaseResult = null
    let resultIndex = 0

    // Slack result (if sent)
    if (SLACK_WEBHOOK_URL) {
      const result = integrationResults[resultIndex]
      slackResult = result.status === 'fulfilled' 
        ? { status: result.value?.sent ? 'success' : 'failed', ...result.value }
        : { status: 'error', error: String(result.reason) }
      resultIndex++
    }

    // Notion result (if sent)
    if (NOTION_TOKEN && NOTION_DATABASE_ID) {
      const result = integrationResults[resultIndex]
      notionResult = result.status === 'fulfilled'
        ? { status: result.value?.sent ? 'success' : 'failed', ...result.value }
        : { status: 'error', error: String(result.reason) }
      resultIndex++
    }

    // Supabase result (always sent)
    const supabaseSettledResult = integrationResults[resultIndex]
    if (supabaseSettledResult.status === 'fulfilled') {
      const value = supabaseSettledResult.value
      supabaseResult = value?.sent 
        ? { status: 'success', data: value.data }
        : { status: 'error', error: value?.error }
    } else {
      supabaseResult = { status: 'error', error: String(supabaseSettledResult.reason) }
    }

    const timestamp = new Date().toISOString()
    const allSucceeded = [slackResult, notionResult, supabaseResult].every(r => r === null || r.status === 'success')

    return NextResponse.json(
      { 
        success: allSucceeded,
        timestamp,
        slackResult,
        notionResult,
        supabaseResult,
        leadData: {
          name: body.name,
          phone: body.phone,
        }
      },
      { status: 200 }
    )
  } catch (error) {
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
