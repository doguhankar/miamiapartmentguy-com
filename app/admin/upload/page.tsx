'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
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

export default function AdminUploadPage() {
  const [buildingId, setBuildingId] = useState(buildings[0]?.id ?? '')
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

  // Load existing images whenever building changes
  useEffect(() => {
    if (!buildingId) return
    setLoadingExisting(true)
    fetch(`/api/admin/upload-images?buildingId=${encodeURIComponent(buildingId)}`)
      .then((r) => r.json())
      .then((d) => setExistingImages(d.images ?? []))
      .catch(() => setExistingImages([]))
      .finally(() => setLoadingExisting(false))
  }, [buildingId])

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const maxSizeBytes = 10 * 1024 * 1024 // 10 MB
    const filesArray = Array.from(incoming)
    const oversized = filesArray.filter((f) => f.size > maxSizeBytes)
    
    if (oversized.length > 0) {
      setError(`${oversized.length} file(s) exceed 10 MB limit: ${oversized.map((f) => f.name).join(', ')}`)
      return
    }

    const valid = filesArray.filter((f) =>
      /\.(jpe?g|png|webp|gif)$/i.test(f.name),
    )
    
    if (valid.length < filesArray.length) {
      setError(`${filesArray.length - valid.length} file(s) are not supported image types`)
      return
    }

    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name))
      return [...prev, ...valid.filter((f) => !names.has(f.name))]
    })
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      addFiles(e.dataTransfer.files)
    },
    [addFiles],
  )

  const removeFile = (name: string) =>
    setFiles((prev) => prev.filter((f) => f.name !== name))

  const handleUpload = async () => {
    if (!buildingId || !files.length) return
    setUploading(true)
    setProgress(0)
    setResponse(null)
    setError(null)

    // Upload in batches of 3 to avoid timeouts on large files
    const batchSize = 3
    const allResults: UploadResult[] = []
    let uploaded = 0
    let failed = 0
    let batchRetries = 0
    const maxRetries = 2

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize)
      const form = new FormData()
      form.append('buildingId', buildingId)
      // Only replace on the first batch
      form.append('replace', (replace && i === 0).toString())
      batch.forEach((f) => form.append('images', f))

      let lastError: string | null = null
      let success = false

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const res = await fetch('/api/admin/upload-images', {
            method: 'POST',
            body: form,
          })

          if (!res.ok) {
            const errorText = await res.text()
            throw new Error(`HTTP ${res.status}: ${errorText}`)
          }

          const data: UploadResponse = await res.json()
          allResults.push(...data.results)
          uploaded += data.uploaded
          failed += data.failed
          success = true
          break
        } catch (err) {
          lastError = err instanceof Error ? err.message : 'Unknown error'
          if (attempt < maxRetries) {
            // Wait with exponential backoff: 1s, 2s
            await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
          }
        }
      }

      if (!success) {
        setError(`Upload failed after ${maxRetries + 1} attempts: ${lastError}`)
        setUploading(false)
        return
      }

      setProgress(Math.round(((i + batch.length) / files.length) * 100))
    }

    setResponse({ buildingId, uploaded, failed, results: allResults })
    setFiles([])
    // Refresh existing images list
    const d = await fetch(
      `/api/admin/upload-images?buildingId=${encodeURIComponent(buildingId)}`,
    ).then((r) => r.json())
    setExistingImages(d.images ?? [])
    setUploading(false)
    setProgress(100)
  }

  const handleDeleteAll = async () => {
    if (!confirm(`Delete ALL images for ${buildingId}?`)) return
    await fetch(
      `/api/admin/upload-images?buildingId=${encodeURIComponent(buildingId)}`,
      { method: 'DELETE' },
    )
    setExistingImages([])
  }

  const selectedBuilding = buildings.find((b) => b.id === buildingId)

  return (
    <main
      className="min-h-screen p-8"
      style={{ background: '#0B1220', color: '#F6F8F9', fontFamily: 'Space Grotesk, sans-serif' }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#FF4D8D' }}>
            Admin
          </p>
          <h1
            className="text-3xl font-black uppercase"
            style={{ fontFamily: 'Archivo, sans-serif', letterSpacing: '-0.02em' }}
          >
            Upload Building Images
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#7E8CA0' }}>
            Images upload to Supabase Storage and are served via CDN.
          </p>
        </div>

        {/* Building Selector */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#B8C4D4' }}>
            Building
          </label>
          <select
            value={buildingId}
            onChange={(e) => {
              setBuildingId(e.target.value)
              setResponse(null)
              setError(null)
              setFiles([])
            }}
            className="w-full rounded-lg px-4 py-3 text-sm font-medium"
            style={{
              background: '#162032',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#F6F8F9',
              outline: 'none',
            }}
          >
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.neighborhood})
              </option>
            ))}
          </select>
        </div>

        {/* Existing images count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm" style={{ color: '#7E8CA0' }}>
            {loadingExisting
              ? 'Loading...'
              : `${existingImages.length} image${existingImages.length !== 1 ? 's' : ''} already uploaded`}
          </p>
          {existingImages.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="text-xs px-3 py-1.5 rounded font-semibold transition-colors"
              style={{ background: 'rgba(255,77,141,0.15)', color: '#FF4D8D', border: '1px solid rgba(255,77,141,0.3)' }}
            >
              Delete all for this building
            </button>
          )}
        </div>

        {/* Existing image thumbnails */}
        {existingImages.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {existingImages.map((img) => (
              <div key={img.id} className="relative rounded overflow-hidden" style={{ width: 72, height: 72 }}>
                <img src={img.image_url} alt={img.file_name} className="w-full h-full object-cover" />
                <div
                  className="absolute bottom-0 left-0 right-0 text-center"
                  style={{ background: 'rgba(0,0,0,0.6)', fontSize: 9, color: '#F6F8F9', padding: '2px 0' }}
                >
                  #{img.sort_order + 1}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Replace toggle */}
        <label className="flex items-center gap-3 mb-6 cursor-pointer">
          <div
            onClick={() => setReplace((v) => !v)}
            className="relative rounded-full transition-colors"
            style={{
              width: 40,
              height: 22,
              background: replace ? '#FF4D8D' : 'rgba(255,255,255,0.12)',
              flexShrink: 0,
            }}
          >
            <div
              className="absolute top-1 rounded-full transition-transform"
              style={{
                width: 14,
                height: 14,
                background: '#F6F8F9',
                left: replace ? 22 : 4,
              }}
            />
          </div>
          <span className="text-sm" style={{ color: '#B8C4D4' }}>
            Replace existing images (delete current, upload new)
          </span>
        </label>

        {/* Drop Zone */}
        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all mb-4"
          style={{
            border: `2px dashed ${dragging ? '#FF4D8D' : 'rgba(255,255,255,0.2)'}`,
            background: dragging ? 'rgba(255,77,141,0.06)' : '#162032',
            padding: '48px 24px',
            minHeight: 180,
          }}
        >
          <div className="text-4xl" style={{ opacity: 0.5 }}>
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <p className="text-sm font-semibold" style={{ color: '#B8C4D4' }}>
            Drop images here or click to browse
          </p>
          <p className="text-xs" style={{ color: '#7E8CA0' }}>
            JPG, PNG, WebP, GIF — up to 10 MB each — multiple files OK
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
          <div className="mb-4 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <div
              className="px-4 py-2.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider"
              style={{ background: '#162032', color: '#7E8CA0' }}
            >
              <span>{files.length} file{files.length !== 1 ? 's' : ''} queued</span>
              <button
                onClick={() => setFiles([])}
                className="text-xs hover:text-[#FF4D8D] transition-colors"
              >
                Clear all
              </button>
            </div>
            <div className="divide-y" style={{ divideColor: 'rgba(255,255,255,0.06)' }}>
              {files.map((f) => (
                <div
                  key={f.name}
                  className="flex items-center justify-between px-4 py-2.5 text-sm"
                  style={{ background: '#0F1A2E' }}
                >
                  <span className="truncate mr-4" style={{ color: '#B8C4D4' }}>{f.name}</span>
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
            background: !files.length || uploading ? 'rgba(255,77,141,0.3)' : '#FF4D8D',
            color: '#F6F8F9',
            cursor: !files.length || uploading ? 'not-allowed' : 'pointer',
          }}
        >
          {uploading
            ? `Uploading... ${progress}%`
            : `Upload ${files.length || ''} Image${files.length !== 1 ? 's' : ''} to ${selectedBuilding?.name ?? ''}`}
        </button>

        {/* Progress bar */}
        {uploading && (
          <div className="mt-3 rounded-full overflow-hidden" style={{ height: 4, background: 'rgba(255,255,255,0.1)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, background: '#FF4D8D' }}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="mt-4 rounded-lg px-4 py-3 text-sm font-medium"
            style={{ background: 'rgba(255,77,141,0.1)', border: '1px solid rgba(255,77,141,0.3)', color: '#FF4D8D' }}
          >
            {error}
          </div>
        )}

        {/* Success response */}
        {response && (
          <div
            className="mt-4 rounded-xl p-4"
            style={{ background: '#162032', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: response.failed === 0 ? '#19C6C0' : '#FFC24B' }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l2.5 2.5L10 3" stroke="#0B1220" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-sm font-semibold" style={{ color: '#F6F8F9' }}>
                {response.uploaded} uploaded
                {response.failed > 0 && `, ${response.failed} failed`}
              </p>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {response.results.map((r) => (
                <div key={r.fileName} className="flex items-center gap-2 text-xs">
                  <span style={{ color: r.error ? '#FF4D8D' : '#19C6C0', flexShrink: 0 }}>
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
    </main>
  )
}
