import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

async function isArchived(id: string): Promise<boolean> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return false

  try {
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data } = await supabase.from('buildings').select('is_archived').eq('id', id).maybeSingle()
    return data?.is_archived === true
  } catch {
    return false
  }
}

export default async function BuildingLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (await isArchived(id)) redirect('/map')
  return children
}
