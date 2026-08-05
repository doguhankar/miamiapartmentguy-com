#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const sourcePath = path.join(__dirname, '../lib/buildings.ts')
const EXPECTED_SOURCE_COUNT = 108
const BOULEVARD_ID = 'the-boulevard'

function loadLocalBuildings() {
  const source = fs.readFileSync(sourcePath, 'utf8')
  const startMarker = 'export const buildings: Building[] = ['
  const endMarker = '\n]\n\nexport const neighborhoodColors'
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

  const rows = normalizeBuildings(loadLocalBuildings())
  const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })

  console.log(`[v0] Upserting ${rows.length} building catalog rows...`)
  const { error } = await supabase.from('buildings').upsert(rows, { onConflict: 'id' })
  if (error) throw error

  const { count, error: countError } = await supabase
    .from('buildings')
    .select('id', { count: 'exact', head: true })
  if (countError) throw countError

  if (count !== rows.length) {
    throw new Error(`Verification failed: expected ${rows.length} rows, found ${count}`)
  }

  console.log(`[v0] Verified public.buildings row count: ${count}`)
  console.log(`[v0] The Boulevard remapped from duplicate id 36 to ${BOULEVARD_ID}`)
}

main().catch((error) => {
  console.error('[v0] Building catalog migration failed:', error.message)
  process.exitCode = 1
})
