'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface BuildingImage {
  id: string
  image_url: string
  file_name: string
  sort_order: number
}

export function useSupabaseImages(buildingId: string | undefined) {
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!buildingId) return
    setLoading(true)
    const supabase = createClient()
    supabase
      .from('building_images')
      .select('image_url, sort_order')
      .eq('building_id', buildingId)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data?.length) {
          setImages(data.map((r: BuildingImage) => r.image_url))
        }
      })
      .finally(() => setLoading(false))
  }, [buildingId])

  return { images, loading }
}
