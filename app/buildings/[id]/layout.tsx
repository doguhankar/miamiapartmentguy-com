import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { buildingAlt } from '@/lib/building-alt'
import { getBuildingPricing } from '@/lib/pricing/building-pricing'
import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  absoluteUrl,
  buildingDescription,
  buildingJsonLd,
  buildingTitle,
  getBuildingById,
  getBuildingImages,
  getLiveBuildingRows,
  getLivePricingMap,
  serializeJsonLd,
  summarizePrice,
} from '@/lib/seo'

export const dynamic = 'force-dynamic'

type LayoutProps = {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const building = getBuildingById(id)
  if (!building) return { title: 'Building not found', robots: { index: false, follow: false } }

  const [pricing, images, buildingPricing] = await Promise.all([
    getLivePricingMap(),
    getBuildingImages(building),
    getBuildingPricing(building.id),
  ])
  const summary = summarizePrice(building, pricing.get(building.id))
  const price =
    buildingPricing.base !== null
      ? { ...summary, min: buildingPricing.base, max: summary.max && summary.max > buildingPricing.base ? summary.max : null }
      : summary
  const title = buildingTitle(building, price)
  const description = buildingDescription(building, price)
  const path = `/buildings/${building.id}`
  const image = images[0] ?? DEFAULT_OG_IMAGE

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      url: path,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: absoluteUrl(image), alt: buildingAlt(building.name, building.neighborhood) }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [absoluteUrl(image)] },
  }
}

export default async function BuildingLayout({ children, params }: LayoutProps) {
  const { id } = await params
  const building = getBuildingById(id)
  if (!building) notFound()

  const rows = await getLiveBuildingRows()
  if (rows.get(id)?.archived) redirect('/map')

  const [pricing, images] = await Promise.all([getLivePricingMap(), getBuildingImages(building)])
  const price = summarizePrice(building, pricing.get(building.id))
  const jsonLd = buildingJsonLd(building, price, images.map(absoluteUrl))

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      {children}
    </>
  )
}
