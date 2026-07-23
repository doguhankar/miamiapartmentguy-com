import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// One-time migration endpoint — hit GET /api/migrate to add deal_value column
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Try inserting a dummy row to a temp table to check if the column exists;
  // use a safe upsert approach — add column if it's missing by catching error.
  // Supabase doesn't expose raw SQL DDL via JS client, so we patch via a known lead.
  // Instead, verify column presence by selecting it:
  const { error: checkError } = await supabase
    .from('leads')
    .select('deal_value')
    .limit(1)

  if (!checkError) {
    return NextResponse.json({ ok: true, message: 'deal_value column already exists' })
  }

  // Column missing — inform user to add it manually via Supabase dashboard
  return NextResponse.json({
    ok: false,
    message: 'deal_value column not found. Run this in your Supabase SQL editor: ALTER TABLE leads ADD COLUMN IF NOT EXISTS deal_value numeric;',
    sqlToRun: 'ALTER TABLE leads ADD COLUMN IF NOT EXISTS deal_value numeric;'
  }, { status: 400 })
}
