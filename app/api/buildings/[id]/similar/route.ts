import { createClient } from '@/lib/supabase/server'
import { buildings as catalog } from '@/lib/buildings'

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase.from('buildings').select('*').neq('id', id)

  if (error) {
    return Response.json({ error: 'Unable to load similar buildings' }, { status: 500 })
  }

  const buildings = shuffle(data ?? [])
    .filter((building) => {
      const fallback = catalog.find((item) => item.id === String(building.id))
      const image = building.image_url ?? building.image ?? building.images?.[0] ?? fallback?.images?.[0]
      const hasPhotos = building.has_photos ?? building.hasPhotos
      return hasPhotos === true || Boolean(image) || Boolean(building.images?.length) || Boolean(fallback?.images?.length)
    })
    .slice(0, 10)
    .map((building) => {
    const fallback = catalog.find((item) => item.id === String(building.id))
    return {
      id: String(building.id),
      name: building.name ?? fallback?.name ?? 'Apartment community',
      neighborhood: building.neighborhood ?? fallback?.neighborhood ?? 'Miami',
      address: building.address ?? fallback?.address ?? null,
      priceMin: Number(building.price_min ?? building.priceMin ?? fallback?.priceMin ?? 0),
      priceMax: building.price_max == null && building.priceMax == null
        ? fallback?.priceMax ?? null
        : Number(building.price_max ?? building.priceMax),
      image: building.image_url ?? building.image ?? building.images?.[0] ?? fallback?.images?.[0] ?? null,
    }
  })

  return Response.json({ buildings }, { headers: { 'Cache-Control': 'no-store' } })
}
