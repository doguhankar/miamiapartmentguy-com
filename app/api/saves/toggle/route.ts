import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/saved-lists'

export async function POST(request: Request) {
  try {
    const { userId, buildingId, saved } = await request.json()
    if (!userId || !buildingId) return NextResponse.json({ error: 'Missing save details.' }, { status: 400 })
    const supabase = createAdminClient()
    if (saved) await supabase.from('saved_buildings').upsert({ user_id: userId, building_id: String(buildingId) }, { onConflict: 'user_id,building_id' })
    else await supabase.from('saved_buildings').delete().eq('user_id', userId).eq('building_id', String(buildingId))
    const rows = await supabase.from('saved_buildings').select('building_id').eq('user_id', userId)
    if (rows.error) throw rows.error
    return NextResponse.json({ savedIds: rows.data.map((row) => String(row.building_id)) })
  } catch (error) { return NextResponse.json({ error: safeError(error) }, { status: 400 }) }
}
