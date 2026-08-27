import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const { userId } = await request.json()
  const supabase = createAdminClient()
  const user = await supabase.from('saved_users').select('share_slug').eq('id', userId).single()
  if (user.error) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  return NextResponse.json({ url: `/list/${user.data.share_slug}` })
}
