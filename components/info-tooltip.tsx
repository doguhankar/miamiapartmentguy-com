"use client"

import { useState } from "react"

interface InfoTooltipProps {
  text: string
}

export function InfoTooltip({ text }: InfoTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-400"
      >
        ?
      </button>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs px-3 py-2 rounded whitespace-nowrap z-10">
          {text}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  )
}
