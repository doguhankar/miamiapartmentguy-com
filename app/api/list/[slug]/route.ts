import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createAdminClient()
  const user = await supabase.from('saved_users').select('first_name,share_slug').eq('share_slug', slug).single()
  if (user.error) return NextResponse.json({ error: 'List not found.' }, { status: 404 })
  const saved = await supabase.from('saved_buildings').select('building_id').eq('user_id', user.data.id)
  const ids = (saved.data ?? []).map((row) => String(row.building_id))
  const buildings = ids.length ? await supabase.from('buildings').select('*').in('id', ids) : { data: [], error: null }
  return NextResponse.json({ firstName: user.data.first_name, buildings: buildings.data ?? [] })
}
