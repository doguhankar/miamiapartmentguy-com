import { getBuildingPricing } from '@/lib/pricing/building-pricing'
import BuildingDetailClient from './building-detail-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function BuildingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const pricing = await getBuildingPricing(id)
  return <BuildingDetailClient pricing={pricing} />
}
