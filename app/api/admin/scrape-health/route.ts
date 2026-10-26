import { createAdminClient } from '@/lib/supabase/admin'
import { getScrapableBuildings } from '@/lib/scrapers/building-map'

const FRESHNESS_WINDOW_MS = 14 * 24 * 60 * 60 * 1000
const MISSING_RUN_WINDOW_MS = 25 * 60 * 60 * 1000

function isAuthorized(request: Request) {
  const expected = process.env.CRON_SECRET
  const authorization = request.headers.get('authorization')
  return Boolean(expected && authorization === `Bearer ${expected}`)
}

function daysSince(iso: string | null) {
  if (!iso) return null
  const time = new Date(iso).getTime()
  if (!Number.isFinite(time)) return null
  return Math.max(0, Math.floor((Date.now() - time) / (24 * 60 * 60 * 1000)))
}

function isMissingRun(scrapedAt: string | null) {
  if (!scrapedAt) return true
  const time = new Date(scrapedAt).getTime()
  return !Number.isFinite(time) || Date.now() - time > MISSING_RUN_WINDOW_MS
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const buildings = getScrapableBuildings()

  const [{ data: unitRows, error: unitsError }, logsResult] = await Promise.all([
    supabase.from('units').select('building_id,lastupdated'),
    supabase
      .from('scrape_logs')
      .select('building_id,status,error_message,scraped_at,retrieved_at')
      .order('scraped_at', { ascending: false }),
  ])

  let logs: Array<{
    building_id: string | number
    status: string
    error_message: string | null
    scraped_at: string | null
    retrieved_at?: string | null
  }> | null = logsResult.data
  let logsError = logsResult.error
  let retrievedAtAvailable = true

  if (logsError?.message?.toLowerCase().includes('retrieved_at')) {
    retrievedAtAvailable = false
    const fallback = await supabase
      .from('scrape_logs')
      .select('building_id,status,error_message,scraped_at')
      .order('scraped_at', { ascending: false })
    logs = fallback.data
    logsError = fallback.error
  }

  if (unitsError) return Response.json({ error: unitsError.message }, { status: 500 })
  if (logsError) return Response.json({ error: logsError.message }, { status: 500 })

  const result = buildings.map((building) => {
    const rows = (logs ?? []).filter((row) => String(row.building_id) === String(building.appId))
    const successful = rows.find((row) => row.status === 'success' && row.retrieved_at)
    const failed = rows.find((row) => row.status !== 'success')
    const writes = (unitRows ?? [])
      .filter((row) => String(row.building_id) === String(building.appId) && row.lastupdated)
      .map((row) => row.lastupdated)
      .sort()
    const lastSuccessfulRetrieval = retrievedAtAvailable ? successful?.retrieved_at ?? null : null
    const age = daysSince(lastSuccessfulRetrieval)

    return {
      building_id: building.appId,
      last_successful_retrieval: lastSuccessfulRetrieval,
      last_application_write: writes.at(-1) ?? null,
      last_failed_attempt: failed?.scraped_at ?? null,
      latest_error: failed?.error_message ?? null,
      days_since_retrieval: age,
      freshness_status:
        age === null ? 'unknown' : Date.now() - new Date(lastSuccessfulRetrieval!).getTime() > FRESHNESS_WINDOW_MS ? 'confirmed_stale' : 'confirmed_fresh',
      is_missing_run: isMissingRun(rows[0]?.scraped_at ?? null),
    }
  })

  return Response.json({ buildings: result })
}
