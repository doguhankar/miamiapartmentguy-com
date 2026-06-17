import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const slug = params.slug

    if (!slug || typeof slug !== 'string' || !/^[a-f0-9]{12}$/.test(slug)) {
      return NextResponse.json(
        { error: 'Invalid slug format' },
        { status: 400 }
      )
    }

    // Fetch from Supabase
    const { data, error } = await supabase
      .from('saved_lists')
      .select('slug, buildings, created_at')
      .eq('slug', slug)
      .single()

    if (error) {
      console.error('[v0] Supabase fetch error:', error)
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      slug: data.slug,
      buildingIds: data.buildings,
      createdAt: data.created_at,
    })
  } catch (error) {
    console.error('[v0] Fetch list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
