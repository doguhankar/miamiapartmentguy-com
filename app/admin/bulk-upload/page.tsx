'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'

interface BuildingResult {
  folder: string
  buildingId: string | null
  uploaded: number
  failed: number
  errors: string[]
}

interface BulkResponse {
  totalUploaded: number
  totalFailed: number
  buildingsProcessed: number
  unmatched: string[]
  skippedFiles: string[]
  results: BuildingResult[]
}

export default function BulkUploadPage() {
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [replace, setReplace] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [response, setResponse] = useState<BulkResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.name.toLowerCase().endsWith('.zip')) {
      setZipFile(file)
      setError(null)
      setResponse(null)
    } else {
      setError('Please drop a .zip file')
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setZipFile(file)
      setError(null)
      setResponse(null)
    }
  }

  const handleUpload = async () => {
    if (!zipFile) return
    setUploading(true)
    setStatus('Uploading and extracting ZIP...')
    setError(null)
    setResponse(null)

    const form = new FormData()
    form.append('zip', zipFile)
    form.append('replace', replace.toString())

    try {
      setStatus('Processing images... this may take a few minutes for large ZIPs.')
      const res = await fetch('/api/admin/bulk-upload', {
        method: 'POST',
        body: form,
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`HTTP ${res.status}: ${text}`)
      }

      const data: BulkResponse = await res.json()
      setResponse(data)
      setZipFile(null)
      setStatus(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <main
      className="min-h-screen p-8"
      style={{ background: '#0B1220', color: '#F6F8F9', fontFamily: 'Space Grotesk, sans-serif' }}
    >
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-1">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#FF4D8D' }}>Admin</p>
            <Link
              href="/admin/upload"
              className="text-xs uppercase tracking-wider transition-colors"
              style={{ color: '#7E8CA0' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#F6F8F9')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#7E8CA0')}
            >
              Single Building Upload
            </Link>
          </div>
          <h1
            className="text-3xl font-black uppercase"
            style={{ fontFamily: 'Archivo, sans-serif', letterSpacing: '-0.02em' }}
          >
            Bulk ZIP Upload
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#7E8CA0' }}>
            Zip your building folders, drop the ZIP here — all images upload automatically. For large uploads, split into batches of 10–15 buildings each.
          </p>
        </div>

        {/* Instructions */}
        <div
          className="rounded-xl p-4 mb-8 text-sm"
          style={{ background: '#162032', border: '1px solid rgba(25,198,192,0.2)' }}
        >
          <p className="font-semibold mb-2" style={{ color: '#19C6C0' }}>How to prepare your ZIP</p>
          <ol className="space-y-1 list-decimal list-inside" style={{ color: '#B8C4D4' }}>
            <li>Create a folder for each building named exactly like the building (e.g. <span style={{ color: '#F6F8F9' }}>Flow Brickell</span>, <span style={{ color: '#F6F8F9' }}>Modera Riverside</span>)</li>
            <li>Put the building&apos;s photos inside that folder</li>
            <li>Select all building folders and compress into one ZIP</li>
            <li>Drop the ZIP below and click Upload</li>
          </ol>
          <p className="mt-3 text-xs" style={{ color: '#7E8CA0' }}>
            Folder names are matched automatically — partial matches and alternate capitalisation work fine. Unmatched folders are listed after upload.
          </p>
        </div>

        {/* Batching guidance */}
        <div
          className="rounded-xl p-4 mb-8 text-sm"
          style={{ background: 'rgba(255,77,141,0.05)', border: '1px solid rgba(255,77,141,0.2)' }}
        >
          <p className="font-semibold mb-2" style={{ color: '#FF4D8D' }}>For large uploads (50+ buildings)</p>
          <p style={{ color: '#B8C4D4' }} className="mb-2">
            To keep uploads fast and reliable, split your ZIP into smaller batches:
          </p>
          <ul className="space-y-1 list-disc list-inside" style={{ color: '#B8C4D4' }}>
            <li>Create separate ZIPs with 10–15 buildings each (e.g. <span style={{ color: '#F6F8F9' }}>buildings-1-15.zip</span>, <span style={{ color: '#F6F8F9' }}>buildings-16-30.zip</span>)</li>
            <li>Upload each batch separately — the page supports multiple uploads</li>
            <li>Each batch uploads in parallel, so 50 buildings = 4 batches in ~4 minutes total</li>
          </ul>
          <p className="mt-2 text-xs" style={{ color: '#7E8CA0' }}>
            This avoids timeouts and keeps memory usage low. You can upload batches back-to-back.
          </p>
        </div>

        {/* Replace toggle */}
        <label className="flex items-center gap-3 mb-6 cursor-pointer">
          <div
            onClick={() => setReplace((v) => !v)}
            className="relative rounded-full transition-colors flex-shrink-0"
            style={{ width: 40, height: 22, background: replace ? '#FF4D8D' : 'rgba(255,255,255,0.12)' }}
          >
            <div
              className="absolute top-1 rounded-full transition-all"
              style={{ width: 14, height: 14, background: '#F6F8F9', left: replace ? 22 : 4 }}
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
          className="rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all mb-6"
          style={{
            border: `2px dashed ${dragging ? '#19C6C0' : zipFile ? '#19C6C0' : 'rgba(255,255,255,0.2)'}`,
            background: dragging ? 'rgba(25,198,192,0.06)' : zipFile ? 'rgba(25,198,192,0.04)' : '#162032',
            padding: '48px 24px',
            minHeight: 200,
          }}
        >
          <svg width="44" height="44" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}
            style={{ color: zipFile ? '#19C6C0' : '#7E8CA0' }}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 13.5l3 3m0 0l3-3m-3 3v-6m1.06-4.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
          </svg>

          {zipFile ? (
            <div className="text-center">
              <p className="font-semibold" style={{ color: '#19C6C0' }}>{zipFile.name}</p>
              <p className="text-sm mt-1" style={{ color: '#7E8CA0' }}>
                {(zipFile.size / 1024 / 1024).toFixed(1)} MB — click to change
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold" style={{ color: '#B8C4D4' }}>
                Drop your ZIP file here or click to browse
              </p>
              <p className="text-xs" style={{ color: '#7E8CA0' }}>
                ZIP with building folders • Upload multiple batches one after another
              </p>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!zipFile || uploading}
          className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all"
          style={{
            fontFamily: 'Archivo, sans-serif',
            background: !zipFile || uploading ? 'rgba(255,77,141,0.3)' : '#FF4D8D',
            color: '#F6F8F9',
            cursor: !zipFile || uploading ? 'not-allowed' : 'pointer',
          }}
        >
          {uploading ? 'Uploading...' : 'Upload All Buildings'}
        </button>

        {/* Status */}
        {status && (
          <div
            className="mt-4 rounded-lg px-4 py-3 flex items-center gap-3 text-sm"
            style={{ background: 'rgba(25,198,192,0.1)', border: '1px solid rgba(25,198,192,0.3)', color: '#19C6C0' }}
          >
            <svg className="animate-spin flex-shrink-0" width="16" height="16" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {status}
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

        {/* Results */}
        {response && (
          <div className="mt-6 space-y-4">
            {/* Summary */}
            <div
              className="rounded-xl p-5"
              style={{ background: '#162032', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <h2 className="font-black uppercase text-sm mb-4" style={{ fontFamily: 'Archivo, sans-serif', color: '#F6F8F9' }}>
                Upload Complete
              </h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="rounded-lg p-3" style={{ background: '#0B1220' }}>
                  <p className="text-2xl font-black" style={{ color: '#19C6C0' }}>{response.totalUploaded}</p>
                  <p className="text-xs mt-1" style={{ color: '#7E8CA0' }}>Images uploaded</p>
                </div>
                <div className="rounded-lg p-3" style={{ background: '#0B1220' }}>
                  <p className="text-2xl font-black" style={{ color: '#FFC24B' }}>{response.buildingsProcessed}</p>
                  <p className="text-xs mt-1" style={{ color: '#7E8CA0' }}>Buildings matched</p>
                </div>
                <div className="rounded-lg p-3" style={{ background: '#0B1220' }}>
                  <p className="text-2xl font-black" style={{ color: response.totalFailed > 0 ? '#FF4D8D' : '#F6F8F9' }}>
                    {response.totalFailed}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#7E8CA0' }}>Failed</p>
                </div>
              </div>
            </div>

            {/* Unmatched folders */}
            {response.unmatched.length > 0 && (
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(255,196,75,0.08)', border: '1px solid rgba(255,196,75,0.2)' }}
              >
                <p className="text-sm font-semibold mb-2" style={{ color: '#FFC24B' }}>
                  {response.unmatched.length} folder{response.unmatched.length !== 1 ? 's' : ''} not matched to a building
                </p>
                <ul className="text-sm space-y-1" style={{ color: '#B8C4D4' }}>
                  {response.unmatched.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span style={{ color: '#FFC24B' }}>&#9888;</span> {f}
                    </li>
                  ))}
                </ul>
                <p className="text-xs mt-3" style={{ color: '#7E8CA0' }}>
                  Rename these folders to match building names and re-upload.
                </p>
              </div>
            )}

            {/* Per-building breakdown */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div
                className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider"
                style={{ background: '#162032', color: '#7E8CA0' }}
              >
                Per-building results
              </div>
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {response.results.filter((r) => r.buildingId).map((r) => (
                  <div
                    key={r.folder}
                    className="flex items-center justify-between px-4 py-3 text-sm"
                    style={{ background: '#0F1A2E' }}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold truncate" style={{ color: '#F6F8F9' }}>{r.folder}</p>
                      <p className="text-xs" style={{ color: '#7E8CA0' }}>id: {r.buildingId}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded"
                        style={{ background: 'rgba(25,198,192,0.15)', color: '#19C6C0' }}
                      >
                        {r.uploaded} uploaded
                      </span>
                      {r.failed > 0 && (
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded"
                          style={{ background: 'rgba(255,77,141,0.15)', color: '#FF4D8D' }}
                        >
                          {r.failed} failed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
