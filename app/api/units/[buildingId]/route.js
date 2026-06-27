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

    // Extract query parameters
    const searchParams = request.nextUrl.searchParams
    const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')) : null
    const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')) : null
    const beds = searchParams.get('beds') ? parseInt(searchParams.get('beds')) : null
    const sort = searchParams.get('sort') || 'price_asc'

    // Mock units data for Phase 1 testing
    let mockUnits = [
      { id: '1', floor_plan_type: '1505', beds: 0, baths: 1, sqft: 550, price: 2841, available_date: 'Available now', photos: null },
      { id: '2', floor_plan_type: '2301', beds: 1, baths: 1.5, sqft: 750, price: 3200, available_date: 'Available now', photos: null },
      { id: '3', floor_plan_type: '3402', beds: 2, baths: 2, sqft: 1050, price: 4100, available_date: 'Available now', photos: null },
      { id: '4', floor_plan_type: '4510', beds: 3, baths: 2.5, sqft: 1450, price: 5500, available_date: 'Available now', photos: null },
    ]

    // Apply filters
    let units = mockUnits.filter(unit => {
      if (minPrice !== null && unit.price < minPrice) return false
      if (maxPrice !== null && unit.price > maxPrice) return false
      if (beds !== null && unit.beds !== beds) return false
      return true
    })

    // Apply sorting
    switch (sort) {
      case 'price_desc':
        units.sort((a, b) => b.price - a.price)
        break
      case 'availability':
        units.sort((a, b) => (a.available_date || '').localeCompare(b.available_date || ''))
        break
      case 'price_asc':
      default:
        units.sort((a, b) => a.price - b.price)
        break
    }

    // Get building name based on buildingId
    const buildingNames = {
      'flow-brickell': 'Flow Brickell',
      'modera-riverside': 'Modera Riverside',
      'maizon': 'Maizon',
      'solitair': 'Solitair',
      'miro-brickell': 'Miro Brickell',
      'brickell-first': 'Brickell First',
      'cmpnd': 'CMPND',
    }

    // Format response
    const response = {
      success: true,
      buildingId,
      buildingName: buildingNames[buildingId] || null,
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
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function formatUnitType(beds, baths) {
  if (!beds) return 'Studio'
  return `${beds}B/${baths ? baths.toString() : '1'}`
}
