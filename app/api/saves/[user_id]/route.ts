import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(request: Request, { params }: { params: Promise<{ user_id: string }> }) {
  const { user_id } = await params
  const buildingId = new URL(request.url).searchParams.get('buildingId')
  const supabase = createAdminClient()
  const query = supabase.from('saved_buildings').delete().eq('user_id', user_id)
  const result = buildingId ? await query.eq('building_id', buildingId) : await query
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function GET(_: Request, { params }: { params: Promise<{ user_id: string }> }) {
  const { user_id } = await params
  const supabase = createAdminClient()
  const user = await supabase.from('saved_users').select('id,first_name,share_slug').eq('id', user_id).single()
  if (user.error) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  const rows = await supabase.from('saved_buildings').select('building_id').eq('user_id', user_id)
  return NextResponse.json({ user: { id: user.data.id, firstName: user.data.first_name, shareSlug: user.data.share_slug }, savedIds: (rows.data ?? []).map((row) => String(row.building_id)) })
}
