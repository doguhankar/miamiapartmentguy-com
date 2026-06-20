import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateSlug } from '@/lib/slug-utils'

interface SaveListRequest {
  buildingIds: string[]
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body: SaveListRequest = await request.json()

    if (!body.buildingIds || !Array.isArray(body.buildingIds) || body.buildingIds.length === 0) {
      return NextResponse.json(
        { error: 'buildingIds array is required and must not be empty' },
        { status: 400 }
      )
    }

    // Generate unique slug
    const slug = generateSlug()

    // Save to Supabase
    console.log('[v0] API Saving buildingIds:', body.buildingIds, 'Types:', body.buildingIds.map(id => typeof id));
    const { data, error } = await supabase
      .from('saved_lists')
      .insert({
        slug,
        buildings: body.buildingIds,
      })
      .select('slug')
      .single()

    if (error) {
      console.error('[v0] Supabase insert error:', error)
      return NextResponse.json(
        { error: 'Failed to save list' },
        { status: 500 }
      )
    }

    // Return the shareable link - always use the production domain
    const shareUrl = `https://www.miamiapartmentguy.com/lists/${data.slug}`

    return NextResponse.json({
      success: true,
      slug: data.slug,
      shareUrl,
    })
  } catch (error) {
    console.error('[v0] Save list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
