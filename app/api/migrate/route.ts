import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// One-time migration endpoint — hit GET /api/migrate to add deal_value column
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Check for required columns by attempting to select them
  const { error: dealValueError } = await supabase
    .from('leads')
    .select('deal_value')
    .limit(1)
  
  const { error: archiveReasonError } = await supabase
    .from('leads')
    .select('archive_reason')
    .limit(1)
  
  const { error: archiveNotesError } = await supabase
    .from('leads')
    .select('archive_notes')
    .limit(1)

  if (!dealValueError && !archiveReasonError && !archiveNotesError) {
    return NextResponse.json({ ok: true, message: 'All required columns exist' })
  }

  // Columns missing — inform user to add them manually via Supabase dashboard
  const missingCols = []
  if (dealValueError) missingCols.push('ALTER TABLE leads ADD COLUMN IF NOT EXISTS deal_value numeric;')
  if (archiveReasonError) missingCols.push('ALTER TABLE leads ADD COLUMN IF NOT EXISTS archive_reason TEXT;')
  if (archiveNotesError) missingCols.push('ALTER TABLE leads ADD COLUMN IF NOT EXISTS archive_notes TEXT;')

  return NextResponse.json({
    ok: false,
    message: 'Some required columns not found. Run these in your Supabase SQL editor:',
    sqlToRun: missingCols.join('\n')
  }, { status: 400 })
}
