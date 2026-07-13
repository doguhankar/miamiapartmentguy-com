import { useState, useEffect } from 'react'
import { getBuildingImages } from '@/lib/supabase-images'

interface UseBuildingImagesOptions {
  buildingId: string
  fallbackImages?: string[]
}

/**
 * Hook to fetch building images from Supabase with fallback support
 */
export function useBuildingImages({ buildingId, fallbackImages }: UseBuildingImagesOptions) {
  const [images, setImages] = useState<string[]>(fallbackImages || [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true)
        setError(null)
        const fetchedImages = await getBuildingImages(buildingId, fallbackImages)
        setImages(fetchedImages)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch images')
        setError(error)
        console.error('[v0] Error fetching building images:', error)
        // Keep fallback images on error
        setImages(fallbackImages || [])
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [buildingId, fallbackImages])

  return { images, loading, error }
}
