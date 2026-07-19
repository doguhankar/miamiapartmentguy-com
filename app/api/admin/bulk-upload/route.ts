import { NextRequest, NextResponse } from 'next/server'
import { Unzip, UnzipInflate, AsyncUnzipInflate } from 'fflate'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildings } from '@/lib/buildings'

export const runtime = 'nodejs'
export const maxDuration = 300

// Tell Next.js NOT to buffer the request body — we read it raw as a stream.
export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Folder-name → building-id fuzzy matcher
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
// Minimal streaming multipart parser
//
// Multipart bodies look like:
//   --<boundary>\r\n
//   Content-Disposition: form-data; name="replace"\r\n\r\n
//   true\r\n
//   --<boundary>\r\n
//   Content-Disposition: form-data; name="zip"; filename="upload.zip"\r\n
//   Content-Type: application/zip\r\n\r\n
//   <zip bytes...>\r\n
//   --<boundary>--\r\n
//
// We only need two values: the "replace" text field and the raw bytes of
// the "zip" file field.  We parse the boundary from Content-Type, scan
// through the byte stream for part headers, and hand the zip bytes to
// the Unzip parser in real-time — the zip is NEVER fully accumulated.
// ---------------------------------------------------------------------------

interface ParsedPart {
  name: string
  filename?: string
  // For text fields only — kept small
  textValue?: string
}

function parseBoundary(contentType: string): string | null {
  const m = contentType.match(/boundary=(?:"([^"]+)"|([^\s;]+))/)
  return m ? (m[1] ?? m[2]) : null
}

// Find the byte index of `needle` inside `haystack` starting at `from`
function indexOf(haystack: Uint8Array, needle: Uint8Array, from = 0): number {
  outer: for (let i = from; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer
    }
    return i
  }
  return -1
}

const enc = new TextEncoder()
const dec = new TextDecoder()

// Concatenate two Uint8Arrays
function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length)
  out.set(a)
  out.set(b, a.length)
  return out
}

// ---------------------------------------------------------------------------
// POST /api/admin/bulk-upload
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  // ---- Validate content-type and extract boundary -------------------------
  const ct = request.headers.get('content-type') ?? ''
  if (!ct.startsWith('multipart/form-data')) {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })
  }
  const boundary = parseBoundary(ct)
  if (!boundary) {
    return NextResponse.json({ error: 'No multipart boundary found' }, { status: 400 })
  }
  if (!request.body) {
    return NextResponse.json({ error: 'No request body' }, { status: 400 })
  }

  const dashBoundary = enc.encode('--' + boundary) // b'\r\n--<boundary>'
  const CRLF = enc.encode('\r\n')
  const CRLFCRLF = enc.encode('\r\n\r\n')

  const supabase = createAdminClient()
  const lookup = buildLookup()

  // State machine: searching for parts, reading headers, streaming file data
  type State = 'PREAMBLE' | 'HEADER' | 'TEXT_BODY' | 'FILE_BODY' | 'DONE'
  let state: State = 'PREAMBLE'

  let currentPart: ParsedPart | null = null
  let replaceMode = false

  // Per-folder tracking
  const folderResults = new Map<
    string,
    { buildingId: string | null; uploaded: number; failed: number; errors: string[] }
  >()
  const dbRows: {
    building_id: string
    image_url: string
    file_name: string
    sort_order: number
  }[] = []
  const orderCounters = new Map<string, number>()
  const replaced = new Set<string>()
  const uploadPromises: Promise<void>[] = []

  // fflate Unzip instance — created once we locate the zip part
  let unzipper: Unzip | null = null
  let unzipperDone: (() => void) | null = null
  let unzipperReject: ((e: unknown) => void) | null = null
  const unzipperPromise = new Promise<void>((res, rej) => {
    unzipperDone = res
    unzipperReject = rej
  })

  function initUnzipper(buildingLookup: Map<string, string>) {
    const uz = new Unzip((file) => {
      const fullPath = file.name
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
      if (parts.length < 2 || !parts[1]) { file.terminate(); return }

      const folderName = parts[0]
      const fileName = parts[parts.length - 1]
      const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
      if (!IMAGE_MIME[ext]) { file.terminate(); return }

      if (!folderResults.has(folderName)) {
        folderResults.set(folderName, {
          buildingId: matchFolder(folderName, buildingLookup),
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
      const chunks: Uint8Array[] = []

      file.ondata = (err, chunk, final) => {
        if (err) {
          result.failed++
          result.errors.push(`${fileName}: decompression error — ${err.message}`)
          return
        }
        chunks.push(chunk)
        if (final) {
          // Assemble this one file and kick off upload immediately
          const totalLen = chunks.reduce((s, c) => s + c.length, 0)
          const fileData = new Uint8Array(totalLen)
          let offset = 0
          for (const c of chunks) { fileData.set(c, offset); offset += c.length }
          chunks.length = 0 // free chunk refs

          uploadPromises.push((async () => {
            try {
              if (replaceMode && !replaced.has(buildingId)) {
                replaced.add(buildingId)
                await supabase.from('building_images').delete().eq('building_id', buildingId)
                const { data: existing } = await supabase.storage
                  .from('building-images').list(buildingId)
                if (existing?.length) {
                  await supabase.storage.from('building-images')
                    .remove(existing.map((f) => `${buildingId}/${f.name}`))
                }
              }
              if (!orderCounters.has(buildingId)) {
                const { data: rows } = await supabase.from('building_images')
                  .select('sort_order').eq('building_id', buildingId)
                  .order('sort_order', { ascending: false }).limit(1)
                orderCounters.set(buildingId,
                  rows?.[0]?.sort_order != null ? rows[0].sort_order + 1 : 0)
              }
              const sortOrder = orderCounters.get(buildingId)!
              orderCounters.set(buildingId, sortOrder + 1)

              const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
              const storagePath = `${buildingId}/${safeName}`
              const mime = IMAGE_MIME[ext] ?? 'image/jpeg'

              const { error: storageErr } = await supabase.storage
                .from('building-images')
                .upload(storagePath, fileData, { contentType: mime, upsert: true })

              if (storageErr) {
                result.failed++
                result.errors.push(`${fileName}: ${storageErr.message}`)
                return
              }
              const { data: { publicUrl } } = supabase.storage
                .from('building-images').getPublicUrl(storagePath)

              dbRows.push({ building_id: buildingId, image_url: publicUrl,
                file_name: safeName, sort_order: sortOrder })
              result.uploaded++
            } catch (e) {
              result.failed++
              result.errors.push(`${fileName}: ${e instanceof Error ? e.message : String(e)}`)
            }
          })())
        }
      }
    })
    uz.register(UnzipInflate)
    uz.register(AsyncUnzipInflate)
    return uz
  }

  // ---- Stream the request body through the multipart state machine ---------
  //
  // We accumulate a small "window" buffer (just enough to detect boundaries
  // and headers). Once we're in FILE_BODY state, bytes are pushed directly
  // to fflate — the zip itself is never buffered.
  //
  // Window kept to at most 2 * dashBoundary.length to detect split boundaries.
  const WINDOW_MAX = dashBoundary.length * 2 + 256
  let window = new Uint8Array(0)

  const reader = request.body.getReader()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      window = concat(window, value)

      // Process as much of window as we can consume
      processWindow: while (true) {
        if (state === 'PREAMBLE') {
          // Look for the opening boundary: --<boundary>\r\n
          const boundaryPos = indexOf(window, dashBoundary)
          if (boundaryPos === -1) {
            // Boundary not in window yet; keep last (boundary.len-1) bytes
            const keep = Math.min(window.length, dashBoundary.length - 1)
            window = window.slice(window.length - keep)
            break processWindow
          }
          // Consume up to and including boundary + CRLF
          const after = boundaryPos + dashBoundary.length
          // Check for -- (final boundary) or CRLF
          if (window.length < after + 2) break processWindow // need more bytes
          const next2 = dec.decode(window.slice(after, after + 2))
          if (next2 === '--') { state = 'DONE'; break processWindow }
          if (next2 !== '\r\n') {
            // Malformed; skip past this boundary
            window = window.slice(after + 2)
            continue processWindow
          }
          window = window.slice(after + 2) // consume boundary + CRLF
          state = 'HEADER'
          currentPart = null
          continue processWindow
        }

        if (state === 'HEADER') {
          // Headers end at \r\n\r\n
          const headerEnd = indexOf(window, CRLFCRLF)
          if (headerEnd === -1) break processWindow // need more bytes
          const headerStr = dec.decode(window.slice(0, headerEnd))
          window = window.slice(headerEnd + 4) // consume headers + blank line

          // Parse Content-Disposition
          const cdMatch = headerStr.match(
            /Content-Disposition:[^\r\n]*name="([^"]+)"(?:[^\r\n]*filename="([^"]*)")?/i
          )
          if (!cdMatch) { state = 'PREAMBLE'; continue processWindow }

          const partName = cdMatch[1]
          const partFilename = cdMatch[2]
          currentPart = { name: partName, filename: partFilename }

          if (partFilename) {
            // File part — init unzipper if this is the zip field
            if (partName === 'zip' || partFilename.endsWith('.zip')) {
              unzipper = initUnzipper(lookup)
            }
            state = 'FILE_BODY'
          } else {
            state = 'TEXT_BODY'
          }
          continue processWindow
        }

        if (state === 'TEXT_BODY') {
          // Read until boundary
          const boundaryPos = indexOf(window, concat(CRLF, dashBoundary))
          if (boundaryPos === -1) {
            if (window.length > WINDOW_MAX) {
              // Accumulate text field value (small fields only)
              const safeLen = window.length - WINDOW_MAX
              if (currentPart) {
                currentPart.textValue = (currentPart.textValue ?? '') +
                  dec.decode(window.slice(0, safeLen))
              }
              window = window.slice(safeLen)
            }
            break processWindow
          }
          // End of text field
          if (currentPart) {
            const fullValue = (currentPart.textValue ?? '') +
              dec.decode(window.slice(0, boundaryPos))
            if (currentPart.name === 'replace') {
              replaceMode = fullValue.trim() === 'true'
            }
          }
          // Consume up to and including the CRLF before the boundary
          window = window.slice(boundaryPos + CRLF.length) // leave --boundary
          state = 'PREAMBLE'
          continue processWindow
        }

        if (state === 'FILE_BODY') {
          // Look for the next boundary within what we have buffered.
          // The boundary is always preceded by \r\n.
          const endMarker = concat(CRLF, dashBoundary)
          const endPos = indexOf(window, endMarker)

          if (endPos === -1) {
            // Boundary not found yet — safe to push (window - endMarker.length) bytes
            const safePush = window.length - endMarker.length
            if (safePush > 0 && unzipper) {
              unzipper.push(window.slice(0, safePush), false)
              window = window.slice(safePush)
            }
            break processWindow
          }

          // Found the end of the file part — push remaining bytes as final
          if (endPos > 0 && unzipper) {
            unzipper.push(window.slice(0, endPos), true)
          } else if (unzipper) {
            unzipper.push(new Uint8Array(0), true)
          }
          unzipperDone?.()

          // Consume up to and including the CRLF before the boundary
          window = window.slice(endPos + CRLF.length)
          state = 'PREAMBLE'
          unzipper = null
          continue processWindow
        }

        if (state === 'DONE') break processWindow
        break processWindow
      }
    }
  } finally {
    reader.releaseLock()
  }

  // If the stream ended without a final boundary (e.g. truncated upload),
  // flush whatever is left to fflate and signal done.
  if (unzipper) {
    try { unzipper.push(new Uint8Array(0), true) } catch { /* ignore */ }
    unzipperDone?.()
  } else {
    // Already done or never started
    unzipperDone?.()
  }

  // Wait for unzipper to finish dispatching all file events, then all uploads
  await unzipperPromise
  await Promise.all(uploadPromises)

  // Batch-insert DB rows
  if (dbRows.length) {
    const BATCH = 100
    for (let i = 0; i < dbRows.length; i += BATCH) {
      const { error: dbError } = await supabase
        .from('building_images')
        .insert(dbRows.slice(i, i + BATCH))
      if (dbError) {
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

  const results = Array.from(folderResults.entries()).map(([folder, r]) => ({
    folder,
    buildingId: r.buildingId,
    uploaded: r.uploaded,
    failed: r.failed,
    errors: r.errors,
  }))

  return NextResponse.json({
    totalUploaded: results.reduce((s, r) => s + r.uploaded, 0),
    totalFailed: results.reduce((s, r) => s + r.failed, 0),
    buildingsProcessed: results.filter((r) => r.buildingId).length,
    unmatched: results.filter((r) => !r.buildingId).map((r) => r.folder),
    results,
  })
}
