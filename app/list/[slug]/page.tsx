import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildings as localBuildings } from '@/lib/buildings'
import { SaveListShareButton } from '@/components/save-list-share-button'

export default async function PublicListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createAdminClient()
  const user = await supabase.from('saved_users').select('first_name,id').eq('share_slug', slug).single()
  if (user.error) notFound()
  const saved = await supabase.from('saved_buildings').select('building_id').eq('user_id', user.data.id)
  const ids = new Set((saved.data ?? []).map((row) => String(row.building_id)))
  const selected = localBuildings.filter((building) => ids.has(String(building.id)))
  return <main className="min-h-screen bg-background px-5 py-10 text-foreground md:px-10"><div className="mx-auto flex max-w-5xl flex-col gap-8"><header className="flex flex-col gap-5 border-b pb-8 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Miami Apartment Guy</p><h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight">{user.data.first_name}&apos;s saved buildings</h1><p className="mt-3 max-w-xl text-pretty leading-6 text-muted-foreground">A shortlist of places worth a closer look.</p></div><SaveListShareButton /></header>{selected.length === 0 ? <section className="rounded-2xl border border-dashed p-10 text-center"><h2 className="text-xl font-semibold">This list is empty</h2><p className="mt-2 text-muted-foreground">Saved buildings will appear here.</p><Link href="/map" className="mt-5 inline-flex rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground">Browse buildings</Link></section> : <section className="grid gap-5 md:grid-cols-2">{selected.map((building) => <Link key={building.id} href={`/buildings/${building.id}`} className="overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-lg"><div className="h-52 bg-muted">{building.images?.[0] && <img src={building.images[0]} alt={building.name} className="h-full w-full object-cover" />}</div><div className="flex flex-col gap-2 p-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{building.neighborhood}</p><h2 className="text-xl font-semibold">{building.name}</h2><p className="text-sm text-muted-foreground">From ${building.priceMin.toLocaleString()}/mo</p></div></Link>)}</section>}</div></main>
}
