'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { buildings } from '@/lib/buildings'

interface UploadResult {
  fileName: string
  url: string
  error?: string
}

interface UploadResponse {
  buildingId: string
  uploaded: number
  failed: number
  results: UploadResult[]
}

interface ExistingImage {
  id: string
  file_name: string
  image_url: string
  sort_order: number
}

// Group buildings by neighborhood for the <optgroup> selector
const byNeighborhood = buildings.reduce<Record<string, typeof buildings>>((acc, b) => {
  const n = b.neighborhood ?? 'Other'
  if (!acc[n]) acc[n] = []
  acc[n].push(b)
  return acc
}, {})
const neighborhoods = Object.keys(byNeighborhood).sort()

export default function AdminUploadPage() {
  const [buildingId, setBuildingId] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [replace, setReplace] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [response, setResponse] = useState<UploadResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([])
  const [loadingExisting, setLoadingExisting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedBuilding = buildings.find((b) => b.id === buildingId)

  // Load existing images whenever building changes
  useEffect(() => {
    if (!buildingId) { setExistingImages([]); return }
    setLoadingExisting(true)
    fetch(`/api/admin/upload-images?buildingId=${encodeURIComponent(buildingId)}`)
      .then((r) => r.json())
      .then((d) => setExistingImages(d.images ?? []))
      .catch(() => setExistingImages([]))
      .finally(() => setLoadingExisting(false))
  }, [buildingId])

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const maxSizeBytes = 10 * 1024 * 1024
    const arr = Array.from(incoming)
    const oversized = arr.filter((f) => f.size > maxSizeBytes)
    if (oversized.length) {
      setError(`${oversized.length} file(s) exceed 10 MB: ${oversized.map((f) => f.name).join(', ')}`)
      return
    }
    const valid = arr.filter((f) => /\.(jpe?g|png|webp|gif)$/i.test(f.name))
    if (valid.length < arr.length) {
      setError(`${arr.length - valid.length} file(s) are not supported image types`)
      return
    }
    setError(null)
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name))
      return [...prev, ...valid.filter((f) => !names.has(f.name))]
    })
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }, [addFiles])

  const removeFile = (name: string) => setFiles((prev) => prev.filter((f) => f.name !== name))

  const handleUpload = async () => {
    if (!buildingId || !files.length) return
    setUploading(true)
    setProgress(0)
    setResponse(null)
    setError(null)

    const batchSize = 3
    const allResults: UploadResult[] = []
    let uploaded = 0, failed = 0

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize)
      const form = new FormData()
      form.append('buildingId', buildingId)
      form.append('replace', (replace && i === 0).toString())
      batch.forEach((f) => form.append('images', f))

      let lastError: string | null = null
      let success = false

      for (let attempt = 0; attempt <= 2; attempt++) {
        try {
          const res = await fetch('/api/admin/upload-images', { method: 'POST', body: form })
          if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
          const data: UploadResponse = await res.json()
          allResults.push(...data.results)
          uploaded += data.uploaded
          failed += data.failed
          success = true
          break
        } catch (err) {
          lastError = err instanceof Error ? err.message : 'Unknown error'
          if (attempt < 2) await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
        }
      }

      if (!success) {
        setError(`Upload failed: ${lastError}`)
        setUploading(false)
        return
      }
      setProgress(Math.round(((i + batch.length) / files.length) * 100))
    }

    setResponse({ buildingId, uploaded, failed, results: allResults })
    setFiles([])
    const d = await fetch(`/api/admin/upload-images?buildingId=${encodeURIComponent(buildingId)}`).then((r) => r.json())
    setExistingImages(d.images ?? [])
    setUploading(false)
    setProgress(100)
  }

  const handleDeleteAll = async () => {
    if (!confirm(`Delete ALL images for "${selectedBuilding?.name}"?`)) return
    await fetch(`/api/admin/upload-images?buildingId=${encodeURIComponent(buildingId)}`, { method: 'DELETE' })
    setExistingImages([])
    setResponse(null)
  }

  return (
    <main
      className="min-h-screen p-6 md:p-10"
      style={{ background: '#0B1220', color: '#F6F8F9', fontFamily: 'Space Grotesk, sans-serif' }}
    >
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#FF4D8D' }}>Admin</span>
            <span style={{ color: '#2A3A50' }}>|</span>
            <Link
              href="/admin/bulk-upload"
              className="text-xs uppercase tracking-wider"
              style={{ color: '#7E8CA0' }}
            >
              Bulk ZIP Upload
            </Link>
          </div>
          <h1
            className="text-2xl font-black uppercase"
            style={{ fontFamily: 'Archivo, sans-serif', letterSpacing: '-0.02em' }}
          >
            Upload Building Images
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#7E8CA0' }}>
            Select a building, then drop images to upload directly to Supabase Storage.
          </p>
        </div>

        {/* ── STEP 1: Building selector ── */}
        <div
          className="rounded-2xl p-5 mb-4"
          style={{ background: '#111D30', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#7E8CA0' }}>
            Step 1 — Select a building
          </p>
          <select
            value={buildingId}
            onChange={(e) => {
              setBuildingId(e.target.value)
              setResponse(null)
              setError(null)
              setFiles([])
            }}
            className="w-full rounded-xl px-4 py-3 text-sm font-medium"
            style={{
              background: '#162032',
              border: `1.5px solid ${buildingId ? '#FF4D8D' : 'rgba(255,255,255,0.12)'}`,
              color: buildingId ? '#F6F8F9' : '#7E8CA0',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="" disabled>— choose a building —</option>
            {neighborhoods.map((hood) => (
              <optgroup key={hood} label={hood}>
                {byNeighborhood[hood].map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </optgroup>
            ))}
          </select>

          {/* Selected building summary */}
          {selectedBuilding && (
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#F6F8F9' }}>
                  {selectedBuilding.name}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#7E8CA0' }}>
                  {selectedBuilding.neighborhood} &mdash; id: <code style={{ color: '#19C6C0' }}>{selectedBuilding.id}</code>
                </p>
              </div>
              {loadingExisting ? (
                <p className="text-xs" style={{ color: '#7E8CA0' }}>Loading...</p>
              ) : (
                <div className="text-right">
                  <p className="text-sm font-semibold" style={{ color: existingImages.length > 0 ? '#19C6C0' : '#7E8CA0' }}>
                    {existingImages.length} image{existingImages.length !== 1 ? 's' : ''}
                  </p>
                  {existingImages.length > 0 && (
                    <button
                      onClick={handleDeleteAll}
                      className="text-xs mt-0.5 transition-colors"
                      style={{ color: '#FF4D8D' }}
                    >
                      Delete all
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Existing image strip */}
        {existingImages.length > 0 && (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {existingImages.map((img) => (
              <div
                key={img.id}
                className="relative rounded-lg overflow-hidden flex-shrink-0"
                style={{ width: 68, height: 68 }}
              >
                <img src={img.image_url} alt={img.file_name} className="w-full h-full object-cover" />
                <div
                  className="absolute bottom-0 left-0 right-0 text-center"
                  style={{ background: 'rgba(0,0,0,0.65)', fontSize: 9, color: '#F6F8F9', padding: '2px 0' }}
                >
                  #{img.sort_order + 1}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── STEP 2: Drop zone (only shown once building selected) ── */}
        {buildingId ? (
          <div
            className="rounded-2xl p-5"
            style={{ background: '#111D30', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#7E8CA0' }}>
              Step 2 — Upload images
            </p>

            {/* Replace toggle */}
            <label className="flex items-center gap-3 mb-4 cursor-pointer">
              <div
                onClick={() => setReplace((v) => !v)}
                className="relative rounded-full transition-colors flex-shrink-0"
                style={{ width: 36, height: 20, background: replace ? '#FF4D8D' : 'rgba(255,255,255,0.12)' }}
              >
                <div
                  className="absolute top-[3px] rounded-full transition-all duration-150"
                  style={{ width: 14, height: 14, background: '#F6F8F9', left: replace ? 19 : 3 }}
                />
              </div>
              <span className="text-sm" style={{ color: '#B8C4D4' }}>
                Replace existing images
              </span>
            </label>

            {/* Drop area */}
            <div
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all mb-4"
              style={{
                border: `2px dashed ${dragging ? '#FF4D8D' : 'rgba(255,255,255,0.15)'}`,
                background: dragging ? 'rgba(255,77,141,0.05)' : 'rgba(255,255,255,0.02)',
                padding: '40px 24px',
              }}
            >
              <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: '#7E8CA0' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-sm font-semibold" style={{ color: '#B8C4D4' }}>
                Drop images here or click to browse
              </p>
              <p className="text-xs" style={{ color: '#7E8CA0' }}>
                WebP, JPG, PNG, GIF &mdash; up to 10 MB each
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && addFiles(e.target.files)}
              />
            </div>

            {/* Queued files */}
            {files.length > 0 && (
              <div
                className="mb-4 rounded-xl overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div
                  className="px-4 py-2 flex items-center justify-between"
                  style={{ background: '#162032' }}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#7E8CA0' }}>
                    {files.length} file{files.length !== 1 ? 's' : ''} queued
                  </span>
                  <button
                    onClick={() => setFiles([])}
                    className="text-xs transition-colors"
                    style={{ color: '#7E8CA0' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FF4D8D')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#7E8CA0')}
                  >
                    Clear all
                  </button>
                </div>
                <div>
                  {files.map((f) => (
                    <div
                      key={f.name}
                      className="flex items-center justify-between px-4 py-2.5 text-sm"
                      style={{ background: '#0F1A2E', borderTop: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <span className="truncate mr-4" style={{ color: '#B8C4D4', maxWidth: '60%' }}>{f.name}</span>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs" style={{ color: '#7E8CA0' }}>
                          {(f.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                        <button
                          onClick={() => removeFile(f.name)}
                          className="text-xs transition-colors"
                          style={{ color: '#7E8CA0' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#FF4D8D')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#7E8CA0')}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload button */}
            <button
              onClick={handleUpload}
              disabled={!files.length || uploading}
              className="w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wide transition-all"
              style={{
                background: (!files.length || uploading) ? 'rgba(255,77,141,0.25)' : '#FF4D8D',
                color: (!files.length || uploading) ? 'rgba(246,248,249,0.4)' : '#F6F8F9',
                cursor: (!files.length || uploading) ? 'not-allowed' : 'pointer',
              }}
            >
              {uploading
                ? `Uploading... ${progress}%`
                : files.length
                  ? `Upload ${files.length} image${files.length !== 1 ? 's' : ''} to ${selectedBuilding?.name}`
                  : 'Select images to upload'}
            </button>

            {/* Progress bar */}
            {uploading && (
              <div
                className="mt-3 rounded-full overflow-hidden"
                style={{ height: 3, background: 'rgba(255,255,255,0.08)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, background: '#FF4D8D' }}
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                className="mt-4 rounded-lg px-4 py-3 text-sm"
                style={{ background: 'rgba(255,77,141,0.08)', border: '1px solid rgba(255,77,141,0.25)', color: '#FF4D8D' }}
              >
                {error}
              </div>
            )}

            {/* Success */}
            {response && (
              <div
                className="mt-4 rounded-xl p-4"
                style={{ background: '#162032', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: response.failed === 0 ? '#19C6C0' : '#FFC24B' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l2.5 2.5L10 3" stroke="#0B1220" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: '#F6F8F9' }}>
                    {response.uploaded} uploaded{response.failed > 0 ? `, ${response.failed} failed` : ''}
                  </p>
                </div>
                <div className="space-y-1.5 max-h-44 overflow-y-auto">
                  {response.results.map((r) => (
                    <div key={r.fileName} className="flex items-center gap-2 text-xs">
                      <span
                        className="font-bold flex-shrink-0"
                        style={{ color: r.error ? '#FF4D8D' : '#19C6C0', width: 28 }}
                      >
                        {r.error ? 'FAIL' : 'OK'}
                      </span>
                      <span className="truncate" style={{ color: '#B8C4D4' }}>{r.fileName}</span>
                      {r.error && (
                        <span className="truncate" style={{ color: '#7E8CA0' }}>{r.error}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Placeholder when no building selected */
          <div
            className="rounded-2xl flex flex-col items-center justify-center gap-3"
            style={{
              background: '#111D30',
              border: '2px dashed rgba(255,255,255,0.07)',
              padding: '56px 24px',
              minHeight: 200,
            }}
          >
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} style={{ color: '#2A3A50' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
            </svg>
            <p className="text-sm font-medium" style={{ color: '#2A3A50' }}>
              Select a building above to continue
            </p>
          </div>
        )}

      </div>
    </main>
  )
}
