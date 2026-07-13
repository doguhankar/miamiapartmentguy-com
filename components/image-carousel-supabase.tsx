'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getBuildingImages } from '@/lib/supabase-images'

interface ImageCarouselSupabaseProps {
  buildingId: string
  fallbackImages?: string[]
}

export function ImageCarouselSupabase({ buildingId, fallbackImages }: ImageCarouselSupabaseProps) {
  const [images, setImages] = useState<string[]>(fallbackImages || [])
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const fetchedImages = await getBuildingImages(buildingId, fallbackImages)
        setImages(fetchedImages)
      } catch (error) {
        console.error('[v0] Error fetching images:', error)
        setImages(fallbackImages || [])
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [buildingId, fallbackImages])

  const next = () => setCurrent((current + 1) % images.length)
  const prev = () => setCurrent((current - 1 + images.length) % images.length)

  if (loading) {
    return (
      <div className="relative w-full h-64 bg-muted rounded-lg overflow-hidden animate-pulse">
        <div className="w-full h-full bg-gray-300" />
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="relative w-full h-64 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-sm">No images available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-64 bg-muted rounded-lg overflow-hidden group">
      <img
        src={images[current]}
        alt={`Building image ${current + 1}`}
        className="w-full h-full object-cover"
        loading="lazy"
        decoding="async"
        width={400}
        height={256}
        crossOrigin="anonymous"
      />

      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition z-10"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition z-10"
            aria-label="Next image"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
            {current + 1}/{images.length}
          </div>
        </>
      )}
    </div>
  )
}
