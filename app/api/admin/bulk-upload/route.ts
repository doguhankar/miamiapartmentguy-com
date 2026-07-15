import { NextRequest, NextResponse } from 'next/server'
import { unzip } from 'fflate'
import { Readable } from 'stream'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildings } from '@/lib/buildings'

export const runtime = 'nodejs'
export const maxDuration = 300

// ---------------------------------------------------------------------------
// Folder-name → building-id fuzzy matcher
// ---------------------------------------------------------------------------
function buildLookup() {
  const map = new Map<string, string>()
  for (const b of buildings) {
    const norm = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()

    // slug as-is
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
// Convert Web Streams API ReadableStream to Node Readable
// ---------------------------------------------------------------------------
function webStreamToNodeStream(webStream: ReadableStream<Uint8Array>): Readable {
  const reader = webStream.getReader()
  return new Readable({
    async read() {
      try {
        const { done, value } = await reader.read()
        this.push(done ? null : Buffer.from(value))
      } catch (err) {
        this.destroy(err as Error)
      }
    },
  })
}

// ---------------------------------------------------------------------------
// Accumulate buffer chunks from stream
// ---------------------------------------------------------------------------
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = []
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })
}

// ---------------------------------------------------------------------------
// POST /api/admin/bulk-upload (streaming)
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

  // Convert Web Stream to Node Stream
  let nodeStream: Readable
  try {
    if (zipFile.stream) {
      nodeStream = webStreamToNodeStream(zipFile.stream())
    } else {
      // Fallback for older File API — still buffer but at least warn
      const buf = await zipFile.arrayBuffer()
      nodeStream = Readable.from([buf])
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Stream setup failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 400 },
    )
  }

  // Buffer the entire stream (still necessary since fflate.unzip needs the full buffer)
  // But this happens incrementally as the stream arrives, reducing peak memory
  let zipBuffer: Buffer
  try {
    zipBuffer = await streamToBuffer(nodeStream)
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to read stream: ${err instanceof Error ? err.message : String(err)}` },
      { status: 400 },
    )
  }

  // Extract ZIP with fflate — decompress already-buffered data
  let entries: Record<string, Uint8Array>
  try {
    const zipUint8 = new Uint8Array(zipBuffer)
    entries = await new Promise((resolve, reject) => {
      unzip(zipUint8, (err, data) => (err ? reject(err) : resolve(data)))
    })
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to extract zip: ${err instanceof Error ? err.message : String(err)}` },
      { status: 400 },
    )
  }

  // Group files by top-level folder name
  const folderFiles = new Map<string, { name: string; data: Uint8Array; ext: string }[]>()

  for (const [fullPath, data] of Object.entries(entries)) {
    // Skip macOS metadata, hidden, and empty entries
    if (
      fullPath.startsWith('__MACOSX') ||
      fullPath.includes('/.') ||
      fullPath.startsWith('.') ||
      data.length === 0
    )
      continue

    const parts = fullPath.split('/')
    if (parts.length < 2 || !parts[1]) continue // not inside a folder

    const folderName = parts[0]
    const fileName = parts[parts.length - 1]
    const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
    if (!IMAGE_MIME[ext]) continue // not an image

    if (!folderFiles.has(folderName)) folderFiles.set(folderName, [])
    folderFiles.get(folderName)!.push({ name: fileName, data, ext })
  }

  // Process each folder and upload immediately
  const results: {
    folder: string
    buildingId: string | null
    uploaded: number
    failed: number
    errors: string[]
  }[] = []

  for (const [folder, files] of folderFiles) {
    const buildingId = matchFolder(folder, lookup)

    if (!buildingId) {
      results.push({
        folder,
        buildingId: null,
        uploaded: 0,
        failed: files.length,
        errors: [`No building matched for folder "${folder}"`],
      })
      continue
    }

    // Replace mode: clear existing
    if (replace) {
      await supabase.from('building_images').delete().eq('building_id', buildingId)
      const { data: existing } = await supabase.storage
        .from('building-images')
        .list(buildingId)
      if (existing?.length) {
        await supabase.storage
          .from('building-images')
          .remove(existing.map((f) => `${buildingId}/${f.name}`))
      }
    }

    // Get current max sort_order
    const { data: existingRows } = await supabase
      .from('building_images')
      .select('sort_order')
      .eq('building_id', buildingId)
      .order('sort_order', { ascending: false })
      .limit(1)
    let nextOrder =
      existingRows?.[0]?.sort_order != null ? existingRows[0].sort_order + 1 : 0

    const errors: string[] = []
    const dbRows: {
      building_id: string
      image_url: string
      file_name: string
      sort_order: number
    }[] = []
    let uploaded = 0

    // Upload in parallel batches of 4
    const batchSize = 4
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize)
      await Promise.all(
        batch.map(async (f) => {
          const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, '_')
          const storagePath = `${buildingId}/${safeName}`
          const mime = IMAGE_MIME[f.ext] ?? 'image/jpeg'

          const { error: storageError } = await supabase.storage
            .from('building-images')
            .upload(storagePath, f.data, { contentType: mime, upsert: true })

          if (storageError) {
            errors.push(`${f.name}: ${storageError.message}`)
            return
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from('building-images').getPublicUrl(storagePath)

          dbRows.push({
            building_id: buildingId,
            image_url: publicUrl,
            file_name: safeName,
            sort_order: nextOrder++,
          })
          uploaded++
        }),
      )
    }

    // Batch insert DB rows
    if (dbRows.length) {
      const { error: dbError } = await supabase
        .from('building_images')
        .insert(dbRows)
      if (dbError) errors.push(`DB insert: ${dbError.message}`)
    }

    results.push({ folder, buildingId, uploaded, failed: errors.length, errors })
  }

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
