'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface BuildingImageGalleryProps {
  images: string[]
  buildingName: string
  height?: number
  currentIndex?: number
  onCurrentIndexChange?: (index: number) => void
}

export function BuildingImageGallery({ images, buildingName, height = 280, currentIndex, onCurrentIndexChange }: BuildingImageGalleryProps) {
  const [internalCurrent, setInternalCurrent] = useState(0)
  const current = currentIndex ?? internalCurrent
  const setCurrent = (value: number | ((index: number) => number)) => {
    const nextIndex = typeof value === 'function' ? value(current) : value
    if (currentIndex === undefined) setInternalCurrent(nextIndex)
    onCurrentIndexChange?.(nextIndex)
  }
  const [isOpen, setIsOpen] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const total = images.length

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
      if (event.key === 'ArrowRight' && total > 1) setCurrent((index) => (index + 1) % total)
      if (event.key === 'ArrowLeft' && total > 1) setCurrent((index) => (index - 1 + total) % total)
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen, total])

  if (total === 0) return <div style={{ height, background: '#E5E7EB' }} aria-label="No building photos" />

  const previous = () => setCurrent((index) => (index - 1 + total) % total)
  const next = () => setCurrent((index) => (index + 1) % total)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={`Open ${buildingName} photo gallery`}
        style={{ position: 'relative', display: 'block', width: '100%', height, padding: 0, border: 0, cursor: 'zoom-in', background: '#E5E7EB', overflow: 'hidden' }}
      >
        <Image src={images[current]} alt={`${buildingName} photo ${current + 1}`} fill sizes="(max-width: 768px) 100vw, 50vw" style={{ objectFit: 'cover' }} priority={current === 0} />
        {total > 1 && <span style={{ position: 'absolute', right: 12, bottom: 12, padding: '5px 9px', borderRadius: 999, color: '#fff', background: 'rgba(0,0,0,0.62)', fontSize: 11, fontWeight: 700 }}>{current + 1} / {total}</span>}
      </button>

      {isOpen && (
        <div role="dialog" aria-modal="true" aria-label={`${buildingName} photo gallery`} style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.92)', padding: 20 }} onClick={() => setIsOpen(false)} onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX ?? null)} onTouchEnd={(event) => { if (touchStart === null || total < 2) return; const delta = (event.changedTouches[0]?.clientX ?? touchStart) - touchStart; if (Math.abs(delta) > 45) delta < 0 ? next() : previous(); setTouchStart(null) }}>
          <button type="button" onClick={() => setIsOpen(false)} aria-label="Close gallery" style={{ position: 'absolute', top: 18, right: 18, zIndex: 2, display: 'grid', placeItems: 'center', width: 42, height: 42, border: 0, borderRadius: '50%', color: '#fff', background: 'rgba(255,255,255,0.14)', cursor: 'pointer' }}><X size={24} /></button>
          <div style={{ position: 'relative', width: 'min(92vw, 1100px)', height: 'min(82vh, 780px)' }} onClick={(event) => event.stopPropagation()}>
            <Image src={images[current]} alt={`${buildingName} photo ${current + 1}`} fill sizes="92vw" style={{ objectFit: 'contain' }} priority />
          </div>
          {total > 1 && <>
            <button type="button" onClick={(event) => { event.stopPropagation(); previous() }} aria-label="Previous image" style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', display: 'grid', placeItems: 'center', width: 46, height: 46, border: 0, borderRadius: '50%', color: '#fff', background: 'rgba(255,255,255,0.14)', cursor: 'pointer' }}><ChevronLeft size={28} /></button>
            <button type="button" onClick={(event) => { event.stopPropagation(); next() }} aria-label="Next image" style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', display: 'grid', placeItems: 'center', width: 46, height: 46, border: 0, borderRadius: '50%', color: '#fff', background: 'rgba(255,255,255,0.14)', cursor: 'pointer' }}><ChevronRight size={28} /></button>
            <div style={{ position: 'absolute', bottom: 18, left: 0, width: '100%', textAlign: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>{current + 1} / {total}</div>
          </>}
        </div>
      )}
    </>
  )
}
