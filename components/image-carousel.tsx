"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface ImageCarouselProps {
  images: string[]
}

export function ImageCarousel({ images }: ImageCarouselProps) {
  const [current, setCurrent] = useState(0)

  const next = () => setCurrent((current + 1) % images.length)
  const prev = () => setCurrent((current - 1 + images.length) % images.length)

  return (
    <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden group">
      <img
        src={images[current]}
        alt={`Building image ${current + 1}`}
        className="w-full h-full object-cover"
      />

      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition z-10"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition z-10"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
            {current + 1}/{images.length}
          </div>
        </>
      )}
    </div>
  )
}
