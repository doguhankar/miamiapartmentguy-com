"use client"

import { useState } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { Building } from "@/lib/buildings"

interface BuildingDetailModalProps {
  building: Building
  onClose: () => void
}

export function BuildingDetailModal({ building, onClose }: BuildingDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const nextImage = () => {
    setCurrentImageIndex((i) => (i + 1) % (building.images?.length || 1))
  }

  const prevImage = () => {
    setCurrentImageIndex((i) => (i - 1 + (building.images?.length || 1)) % (building.images?.length || 1))
  }

  // Mock stats - in production these would come from the building data or API
  const stats = {
    concession: "1 Month Free",
    netEffective: "$2,890",
    available: "Now",
    updated: "Jul 15"
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full rounded-2xl overflow-hidden overflow-y-auto"
        style={{ maxWidth: "480px", maxHeight: "90vh", background: "#0B1220" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-50 p-1.5 rounded-lg transition-colors"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.75)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.5)")}
          >
            <X className="h-4 w-4" style={{ color: "#F6F8F9" }} />
          </button>

          {/* Image Carousel */}
          <div
            className="relative w-full"
            style={{
              height: "300px",
              background: "linear-gradient(135deg, #1B2A45, #0F1B30)"
            }}
          >
            {building.images && building.images.length > 0 ? (
              <>
                <img
                  src={building.images[currentImageIndex]}
                  alt={`${building.name} ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Left Arrow */}
                <button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors"
                  style={{ background: "rgba(0,0,0,0.4)" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.6)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.4)"}
                >
                  <ChevronLeft className="h-5 w-5" style={{ color: "#F6F8F9" }} />
                </button>

                {/* Right Arrow */}
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors"
                  style={{ background: "rgba(0,0,0,0.4)" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.6)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.4)"}
                >
                  <ChevronRight className="h-5 w-5" style={{ color: "#F6F8F9" }} />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div style={{ fontSize: "48px" }}>📷</div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Building Name */}
            <h2
              className="text-2xl font-black mb-1"
              style={{
                fontFamily: "Archivo",
                color: "#F6F8F9",
                textTransform: "uppercase",
                fontVariationSettings: "'wdth' 118",
                letterSpacing: "-0.01em"
              }}
            >
              {building.name}
            </h2>

            {/* Building Description */}
            {building.tagline && (
              <p className="text-sm mb-6" style={{ color: "#B8C4D4" }}>
                {building.tagline}
              </p>
            )}

            {/* 2x2 Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Concession */}
              <div
                className="p-4 rounded-lg"
                style={{ background: "#0F1B30" }}
              >
                <p
                  className="text-xs font-bold mb-2"
                  style={{
                    color: "#B8C4D4",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}
                >
                  Concession
                </p>
                <p
                  className="text-lg font-bold"
                  style={{ color: "#FFC24B" }}
                >
                  {stats.concession}
                </p>
              </div>

              {/* Net Effective */}
              <div
                className="p-4 rounded-lg"
                style={{ background: "#0F1B30" }}
              >
                <p
                  className="text-xs font-bold mb-2"
                  style={{
                    color: "#B8C4D4",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}
                >
                  Net Effective
                </p>
                <p
                  className="text-lg font-bold"
                  style={{ color: "#19C6C0" }}
                >
                  {stats.netEffective}
                </p>
              </div>

              {/* Available */}
              <div
                className="p-4 rounded-lg"
                style={{ background: "#0F1B30" }}
              >
                <p
                  className="text-xs font-bold mb-2"
                  style={{
                    color: "#B8C4D4",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}
                >
                  Available
                </p>
                <p
                  className="text-lg font-bold"
                  style={{ color: "#E6ECF5" }}
                >
                  {stats.available}
                </p>
              </div>

              {/* Updated */}
              <div
                className="p-4 rounded-lg"
                style={{ background: "#0F1B30" }}
              >
                <p
                  className="text-xs font-bold mb-2"
                  style={{
                    color: "#B8C4D4",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}
                >
                  Updated
                </p>
                <p
                  className="text-lg font-bold"
                  style={{ color: "#E6ECF5" }}
                >
                  {stats.updated}
                </p>
              </div>
            </div>

            {/* Text Don Button */}
            <a
              href={`sms:+14077657306?body=Hi%20Don%2C%20I%27m%20interested%20in%20${building.name}`}
              onClick={(e) => e.stopPropagation()}
              className="w-full py-3 px-4 rounded-lg font-bold text-center transition-colors"
              style={{
                background: "#FF4D8D",
                color: "#F6F8F9",
                textDecoration: "none",
                display: "block"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#E53A73"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#FF4D8D"}
            >
              Text Don about this building
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
