import { createClient } from '@supabase/supabase-js'

export async function GET(request, { params }) {
  try {
    const { buildingId } = await params

    // Validate buildingId
    if (!buildingId) {
      return Response.json(
        { error: 'buildingId required' },
        { status: 400 }
      )
    }

    // Validate Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) {
      console.error('[v0] Missing Supabase credentials')
      return Response.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Extract query parameters for filtering and sorting
    const searchParams = request.nextUrl.searchParams
    const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')) : null
    const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')) : null
    const beds = searchParams.get('beds') ? parseInt(searchParams.get('beds')) : null
    const sort = searchParams.get('sort') || 'price_asc'

    // Build base query
    let query = supabase
      .from('pricing_units')
      .select('*')
      .eq('building_id', buildingId)

    // Apply price filters
    if (minPrice !== null) {
      query = query.gte('price', minPrice)
    }
    if (maxPrice !== null) {
      query = query.lte('price', maxPrice)
    }

    // Apply beds filter
    if (beds !== null) {
      query = query.eq('beds', beds)
    }

    // Apply sorting
    switch (sort) {
      case 'price_desc':
        query = query.order('price', { ascending: false })
        break
      case 'availability':
        query = query.order('available_date', { ascending: true })
        break
      case 'price_asc':
      default:
        query = query.order('price', { ascending: true })
        break
    }

    // Execute query
    const { data: units, error: unitsError } = await query

    if (unitsError) {
      console.error('[v0] Supabase query error:', unitsError)
      return Response.json(
        { error: 'Database query failed', details: unitsError.message },
        { status: 500 }
      )
    }

    if (!units) {
      console.warn('[v0] No units found for building:', buildingId)
      return Response.json(
        { error: 'No units found' },
        { status: 404 }
      )
    }

    // Get building name from buildings table
    const { data: buildingData, error: buildingError } = await supabase
      .from('buildings')
      .select('name')
      .eq('id', buildingId)
      .single()

    if (buildingError) {
      console.warn('[v0] Building not found:', buildingId)
    }

    // Format response
    const response = {
      success: true,
      buildingId,
      buildingName: buildingData?.name || null,
      units: units.map(unit => ({
        id: unit.id,
        unitNumber: unit.floor_plan_type,
        unitType: formatUnitType(unit.beds, unit.baths),
        price: unit.price,
        beds: unit.beds,
        baths: unit.baths,
        sqft: unit.sqft,
        availabilityDate: unit.available_date,
        photos: unit.photos || [],
      })),
      totalUnits: units.length,
      lastUpdated: new Date().toISOString(),
    }

    // Return with cache headers
    return Response.json(response, {
      headers: {
        'Cache-Control': 'max-age=300',
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('[v0] API error:', error)
    return Response.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

function formatUnitType(beds, baths) {
  if (!beds) return 'Studio'
  return `${beds}B/${baths ? baths.toString() : '1'}`
}
