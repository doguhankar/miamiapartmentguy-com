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
const BATCH_SIZE = 100

function loadLocalBuildings() {
  const source = fs.readFileSync(sourcePath, 'utf8')
  const startMarker = 'export const buildings: Building[] = ['
  const endMarker = '\n]\n\nexport const neighborhoodColors'
  const start = source.indexOf(startMarker)
  const end = source.indexOf(endMarker, start)
  if (start === -1 || end === -1) throw new Error(`Could not locate buildings array in ${sourcePath}`)
  return Function(`"use strict"; return [${source.slice(start + startMarker.length, end)}]`)()
}

function normalizeId(building) {
  return building.name === 'The Boulevard' && String(building.id) === '36'
    ? BOULEVARD_ID
    : String(building.id)
}

function normalizeImages(buildings) {
  if (buildings.length !== EXPECTED_SOURCE_COUNT) {
    throw new Error(`Expected ${EXPECTED_SOURCE_COUNT} local buildings, found ${buildings.length}`)
  }

  const rows = []
  for (const building of buildings) {
    const urls = Array.isArray(building.images) ? building.images : []
    urls.forEach((value, sortOrder) => {
      const imageUrl = typeof value === 'string' ? value.trim() : ''
      if (!imageUrl) return
      rows.push({
        building_id: normalizeId(building),
        image_url: imageUrl,
        file_name: path.basename(imageUrl.split('?')[0]) || `${normalizeId(building)}-${sortOrder}`,
        sort_order: sortOrder,
      })
    })
  }

  const seen = new Set()
  return rows.filter((row) => {
    const key = `${row.building_id}\u0000${row.image_url}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function fetchAll(supabase, columns) {
  const { data, error } = await supabase.from('building_images').select(columns).order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

async function main() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) throw new Error('SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')

  const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const sourceBuildings = loadLocalBuildings()
  const imageRows = normalizeImages(sourceBuildings)

  const { data: buildingRows, error: buildingError } = await supabase.from('buildings').select('id')
  if (buildingError) throw buildingError
  const buildingIds = new Set((buildingRows ?? []).map((row) => String(row.id)))
  const missingIds = [...new Set(imageRows.map((row) => row.building_id))].filter((id) => !buildingIds.has(id))
  if (missingIds.length) throw new Error(`Missing Supabase buildings for image rows: ${missingIds.join(', ')}`)

  const existingRows = await fetchAll(supabase, 'building_id, image_url')
  const existing = new Set(existingRows.map((row) => `${row.building_id}\u0000${row.image_url}`))
  const pending = imageRows.filter((row) => !existing.has(`${row.building_id}\u0000${row.image_url}`))

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const { error } = await supabase.from('building_images').insert(pending.slice(i, i + BATCH_SIZE))
    if (error) throw error
  }

  const finalRows = await fetchAll(supabase, 'building_id, image_url')
  const covered = new Set(finalRows.filter((row) => row.image_url?.trim()).map((row) => String(row.building_id)))
  console.log(`[v0] Local buildings: ${sourceBuildings.length}`)
  console.log(`[v0] Local image URLs: ${imageRows.length}`)
  console.log(`[v0] Inserted missing image rows: ${pending.length}`)
  console.log(`[v0] Buildings with at least one image: ${covered.size} / ${EXPECTED_SOURCE_COUNT}`)
}

main().catch((error) => {
  console.error('[v0] Building image migration failed:', error.message)
  process.exitCode = 1
})
