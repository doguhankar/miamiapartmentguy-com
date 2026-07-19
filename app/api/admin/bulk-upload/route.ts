import { NextRequest, NextResponse } from 'next/server'
import { Unzip, UnzipInflate, AsyncUnzipInflate } from 'fflate'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildings } from '@/lib/buildings'

export const runtime = 'nodejs'
export const maxDuration = 300

// ---------------------------------------------------------------------------
// Folder-name → building-id fuzzy matcher (unchanged)
// ---------------------------------------------------------------------------
function buildLookup() {
  const map = new Map<string, string>()
  for (const b of buildings) {
    const norm = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()
    map.set(b.id.toLowerCase(), b.id)
    const n = norm(b.name)
    map.set(n, b.id)
    map.set(n.replace(/ /g, '-'), b.id)
    map.set(n.replace(/ /g, ''), b.id)
  }
  return map
}

function matchFolder(folderName: string, lookup: Map<string, string>): string | null {
  const norm = folderName
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return (
    lookup.get(norm) ??
    lookup.get(norm.replace(/ /g, '-')) ??
    lookup.get(norm.replace(/ /g, '')) ??
    (() => {
      for (const [key, id] of lookup) {
        if (norm.length > 2 && (key.includes(norm) || norm.includes(key))) return id
      }
      return null
    })()
  )
}

const IMAGE_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  heic: 'image/heic',
}

// ---------------------------------------------------------------------------
// POST /api/admin/bulk-upload — true streaming: extract one → upload one
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const supabase = createAdminClient()
  const lookup = buildLookup()

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const zipFile = formData.get('zip') as File | null
  if (!zipFile) {
    return NextResponse.json({ error: 'No zip file provided' }, { status: 400 })
  }

  const replace = formData.get('replace') === 'true'

  // Per-folder result tracking
  const folderResults = new Map<
    string,
    { buildingId: string | null; uploaded: number; failed: number; errors: string[] }
  >()

  // DB rows to batch-insert at the end (tiny — just strings, no binary data)
  const dbRows: {
    building_id: string
    image_url: string
    file_name: string
    sort_order: number
  }[] = []

  // Per-building sort_order counters & replace-mode tracking
  const orderCounters = new Map<string, number>()
  const replaced = new Set<string>()

  // In-flight upload promises — we track them so we can await all before returning
  const uploadPromises: Promise<void>[] = []

  await new Promise<void>((resolve, reject) => {
    const unzipper = new Unzip((file) => {
      const fullPath = file.name

      // Skip macOS metadata, hidden files, directories (end with /)
      if (
        fullPath.startsWith('__MACOSX') ||
        fullPath.includes('/.') ||
        fullPath.startsWith('.') ||
        fullPath.endsWith('/')
      ) {
        file.terminate()
        return
      }

      const parts = fullPath.split('/')
      if (parts.length < 2 || !parts[1]) {
        file.terminate()
        return
      }

      const folderName = parts[0]
      const fileName = parts[parts.length - 1]
      const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
      if (!IMAGE_MIME[ext]) {
        file.terminate()
        return
      }

      // Initialise folder result entry
      if (!folderResults.has(folderName)) {
        folderResults.set(folderName, {
          buildingId: matchFolder(folderName, lookup),
          uploaded: 0,
          failed: 0,
          errors: [],
        })
      }
      const result = folderResults.get(folderName)!

      if (!result.buildingId) {
        result.failed++
        if (!result.errors.some((e) => e.startsWith('No building matched'))) {
          result.errors.push(`No building matched for folder "${folderName}"`)
        }
        file.terminate()
        return
      }

      const buildingId = result.buildingId

      // Collect per-file chunks in a small local array — freed after upload
      const chunks: Uint8Array[] = []

      file.ondata = (err, chunk, final) => {
        if (err) {
          result.failed++
          result.errors.push(`${fileName}: decompression error — ${err.message}`)
          return
        }

        chunks.push(chunk)

        if (final) {
          // Concatenate this one file's chunks and immediately kick off an upload.
          // The chunks array is local to this closure and will be GC'd once the
          // upload promise resolves and this scope exits.
          const totalLen = chunks.reduce((s, c) => s + c.length, 0)
          const fileData = new Uint8Array(totalLen)
          let offset = 0
          for (const c of chunks) {
            fileData.set(c, offset)
            offset += c.length
          }
          // Drop chunk references immediately
          chunks.length = 0

          const uploadPromise = (async () => {
            try {
              // Replace mode: clear existing images once per building
              if (replace && !replaced.has(buildingId)) {
                replaced.add(buildingId)
                await supabase.from('building_images').delete().eq('building_id', buildingId)
                const { data: existingStorage } = await supabase.storage
                  .from('building-images')
                  .list(buildingId)
                if (existingStorage?.length) {
                  await supabase.storage
                    .from('building-images')
                    .remove(existingStorage.map((f) => `${buildingId}/${f.name}`))
                }
              }

              // Initialise sort_order counter for this building on first use
              if (!orderCounters.has(buildingId)) {
                const { data: existingRows } = await supabase
                  .from('building_images')
                  .select('sort_order')
                  .eq('building_id', buildingId)
                  .order('sort_order', { ascending: false })
                  .limit(1)
                const startOrder =
                  existingRows?.[0]?.sort_order != null
                    ? existingRows[0].sort_order + 1
                    : 0
                orderCounters.set(buildingId, startOrder)
              }

              const sortOrder = orderCounters.get(buildingId)!
              orderCounters.set(buildingId, sortOrder + 1)

              const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
              const storagePath = `${buildingId}/${safeName}`
              const mime = IMAGE_MIME[ext] ?? 'image/jpeg'

              const { error: storageError } = await supabase.storage
                .from('building-images')
                .upload(storagePath, fileData, { contentType: mime, upsert: true })

              if (storageError) {
                result.failed++
                result.errors.push(`${fileName}: ${storageError.message}`)
                return
              }

              const {
                data: { publicUrl },
              } = supabase.storage.from('building-images').getPublicUrl(storagePath)

              // Queue DB row — batched at the end
              dbRows.push({
                building_id: buildingId,
                image_url: publicUrl,
                file_name: safeName,
                sort_order: sortOrder,
              })
              result.uploaded++
            } catch (e) {
              result.failed++
              result.errors.push(
                `${fileName}: unexpected error — ${e instanceof Error ? e.message : String(e)}`,
              )
            }
          })()

          uploadPromises.push(uploadPromise)
        }
      }

      // Register decoders: use async inflate for large files, sync for small ones
      file.start = true
      try {
        if ((file as any).size != null && (file as any).size < 512 * 1024) {
          file.start = false
          UnzipInflate.prototype.constructor.call(file as any)
        }
      } catch {
        // ignore — file will use whatever decoder it has
      }
    })

    // Register decoders before pushing data
    unzipper.register(UnzipInflate)
    unzipper.register(AsyncUnzipInflate)

    // Stream zip bytes through the Unzip parser in 64 KB chunks.
    // We never hold more than one chunk + one decompressed file at a time.
    ;(async () => {
      try {
        const reader = zipFile.stream().getReader()
        const CHUNK = 65536 // 64 KB read window
        let remainder = new Uint8Array(0)

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            // Push any remaining bytes as final
            if (remainder.length) unzipper.push(remainder, true)
            else unzipper.push(new Uint8Array(0), true)
            break
          }

          // Prepend any leftover bytes from previous iteration
          let chunk: Uint8Array
          if (remainder.length) {
            chunk = new Uint8Array(remainder.length + value.length)
            chunk.set(remainder)
            chunk.set(value, remainder.length)
            remainder = new Uint8Array(0)
          } else {
            chunk = value
          }

          // Push in CHUNK-sized windows to give fflate a steady feed
          let pos = 0
          while (pos + CHUNK <= chunk.length) {
            unzipper.push(chunk.slice(pos, pos + CHUNK), false)
            pos += CHUNK
          }
          // Hold the tail for the next iteration
          if (pos < chunk.length) {
            remainder = chunk.slice(pos)
          }
        }

        resolve()
      } catch (err) {
        reject(err)
      }
    })()
  })

  // Wait for all in-flight storage uploads to complete
  await Promise.all(uploadPromises)

  // Batch-insert all DB rows at once (just string metadata — tiny payload)
  if (dbRows.length) {
    const BATCH = 100
    for (let i = 0; i < dbRows.length; i += BATCH) {
      const { error: dbError } = await supabase
        .from('building_images')
        .insert(dbRows.slice(i, i + BATCH))
      if (dbError) {
        // Attach to the relevant building's result
        const affectedBuildings = new Set(dbRows.slice(i, i + BATCH).map((r) => r.building_id))
        for (const bid of affectedBuildings) {
          for (const [, result] of folderResults) {
            if (result.buildingId === bid) {
              result.errors.push(`DB insert batch: ${dbError.message}`)
            }
          }
        }
      }
    }
  }

  // Build response
  const results = Array.from(folderResults.entries()).map(([folder, r]) => ({
    folder,
    buildingId: r.buildingId,
    uploaded: r.uploaded,
    failed: r.failed,
    errors: r.errors,
  }))

  const totalUploaded = results.reduce((s, r) => s + r.uploaded, 0)
  const totalFailed = results.reduce((s, r) => s + r.failed, 0)
  const unmatched = results.filter((r) => !r.buildingId).map((r) => r.folder)

  return NextResponse.json({
    totalUploaded,
    totalFailed,
    buildingsProcessed: results.filter((r) => r.buildingId).length,
    unmatched,
    results,
  })
}
