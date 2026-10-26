import { createAdminClient } from '@/lib/supabase/admin'
import { getBuildingPricing } from '@/lib/pricing/building-pricing'
import { getBuildingImages } from '@/lib/seo'
import { getBuildingById } from '@/lib/seo'
import BuildingDetailClient from './building-detail-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function BuildingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const building = getBuildingById(id)
  if (!building) return null
  const admin = createAdminClient()
  const [{ data: units }, images, pricing] = await Promise.all([
    admin.from('units').select('price, beds, baths, sqft, unitnumber, availabilitydate, unittype').eq('building_id', id).order('price', { ascending: true }),
    getBuildingImages(building),
    getBuildingPricing(id),
  ])
  return <BuildingDetailClient buildingId={id} initialUnits={units ?? []} initialImages={images} pricing={pricing} />
}
