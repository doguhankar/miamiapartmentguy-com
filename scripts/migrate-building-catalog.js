#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const sourcePath = path.join(__dirname, '../lib/buildings.ts')
const EXPECTED_SOURCE_COUNT = 135
const BOULEVARD_ID = 'the-boulevard'
const NEW_BUILDING_IDS = [
  'flagler-on-the-river', 'central-tower', 'square-station', 'melody-tower', 'miami-plaza',
  'downtown-5th', 'downtown-1st', '22-skyview', '23-biscayne-bay', 'urban-22', 'second-plaza',
  '25-biscayne-park', '1800-biscayne-plaza', '25-mirage', 'oak-plaza', 'one-plaza-west-brickell',
]

function loadLocalBuildings() {
  const source = fs.readFileSync(sourcePath, 'utf8')
  const startMarker = 'export const buildings: Building[] = ['
  const endMarker = '\n]\nexport const neighborhoodColors'
  const start = source.indexOf(startMarker)
  const end = source.indexOf(endMarker, start)

  if (start === -1 || end === -1) {
    throw new Error(`Could not locate the buildings array in ${sourcePath}`)
  }

  // The source array contains plain JavaScript object literals; the TypeScript
  // interface and subsequent export are excluded before evaluating the array.
  const arraySource = source.slice(start + startMarker.length, end)
  return Function(`"use strict"; return [${arraySource}]`)()
}

function normalizeBuildings(sourceBuildings) {
  if (sourceBuildings.length !== EXPECTED_SOURCE_COUNT) {
    throw new Error(`Expected ${EXPECTED_SOURCE_COUNT} local buildings, found ${sourceBuildings.length}`)
  }

  const rows = sourceBuildings.map((building) => ({
    id: building.name === 'The Boulevard' && building.id === '36' ? BOULEVARD_ID : String(building.id),
    name: String(building.name).trim(),
    neighborhood: building.neighborhood ? String(building.neighborhood).trim() : null,
    address: building.address ? String(building.address).trim() : null,
    lat: building.lat,
    lng: building.lng,
    commission: building.commission ?? null,
    is_archived: false,
  }))

  if (rows.some((row) => !row.id || !row.name)) {
    throw new Error('Every building must have a non-empty id and name')
  }

  const ids = rows.map((row) => row.id)
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index)
  if (duplicateIds.length > 0) {
    throw new Error(`Duplicate IDs remain after normalization: ${[...new Set(duplicateIds)].join(', ')}`)
  }

  return rows
}

async function main() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  }

  const allRows = normalizeBuildings(loadLocalBuildings())
  const rows = allRows.filter((row) => NEW_BUILDING_IDS.includes(row.id))
  if (rows.length !== NEW_BUILDING_IDS.length) {
    throw new Error(`Expected ${NEW_BUILDING_IDS.length} new buildings in lib/buildings.ts, found ${rows.length}`)
  }
  const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })

  console.log(`[v0] Inserting ${rows.length} new building rows (existing rows are left untouched)...`)
  const { error } = await supabase.from('buildings').upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
  if (error) throw error

  const { data, error: verifyError } = await supabase
    .from('buildings')
    .select('id, lat, lng, commission, is_archived')
    .in('id', NEW_BUILDING_IDS)
  if (verifyError) throw verifyError

  const missing = NEW_BUILDING_IDS.filter((id) => !data.some((row) => row.id === id))
  if (missing.length > 0) {
    throw new Error(`Verification failed: missing rows ${missing.join(', ')}`)
  }

  console.log(`[v0] Verified ${data.length} of ${NEW_BUILDING_IDS.length} new rows in public.buildings`)
}

main().catch((error) => {
  console.error('[v0] Building catalog migration failed:', error.message)
  process.exitCode = 1
})
