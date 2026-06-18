import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateSlug } from '@/lib/slug-utils'

interface SaveListRequest {
  buildingIds: string[]
}

export async function POST(request: NextRequest) {
  console.log('[v0-api] POST /api/lists called')
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('[v0-api] Supabase URL configured:', !!supabaseUrl)
    console.log('[v0-api] Supabase key configured:', !!supabaseServiceKey)

    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('[v0-api] Supabase not configured, returning 500')
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body: SaveListRequest = await request.json()

    console.log('[v0-api] Request body:', body)
    console.log('[v0-api] Building IDs:', body.buildingIds)
    console.log('[v0-api] Building IDs count:', body.buildingIds?.length)

    if (!body.buildingIds || !Array.isArray(body.buildingIds) || body.buildingIds.length === 0) {
      console.log('[v0-api] Invalid buildingIds, returning 400')
      return NextResponse.json(
        { error: 'buildingIds array is required and must not be empty' },
        { status: 400 }
      )
    }

    // Generate unique slug
    const slug = generateSlug()
    console.log('[v0-api] Generated slug:', slug)

    // Save to Supabase
    console.log('[v0-api] Inserting into saved_lists table...')
    const { data, error } = await supabase
      .from('saved_lists')
      .insert({
        slug,
        buildings: body.buildingIds,
      })
      .select('slug')
      .single()

    console.log('[v0-api] Supabase response - data:', data)
    console.log('[v0-api] Supabase response - error:', error)

    if (error) {
      console.error('[v0-api] Supabase insert error:', error)
      return NextResponse.json(
        { error: 'Failed to save list' },
        { status: 500 }
      )
    }

    // Return the shareable link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const shareUrl = `${appUrl}/lists/${data.slug}`
    
    console.log('[v0-api] App URL:', appUrl)
    console.log('[v0-api] Generated shareUrl:', shareUrl)
    console.log('[v0-api] ShareUrl type:', typeof shareUrl)
    console.log('[v0-api] ShareUrl length:', shareUrl.length)

    const responseBody = {
      success: true,
      slug: data.slug,
      shareUrl,
    }
    
    console.log('[v0-api] Sending response:', responseBody)

    return NextResponse.json(responseBody)
  } catch (error) {
    console.error('[v0-api] Save list error:', error)
    console.error('[v0-api] Error type:', (error as Error).name)
    console.error('[v0-api] Error message:', (error as Error).message)
    console.error('[v0-api] Error stack:', (error as Error).stack)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
