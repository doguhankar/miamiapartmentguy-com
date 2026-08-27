"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface BuildingPrice {
  studioMin: number | null
  oneBedMin: number | null
  twoBedMin: number | null
  loading: boolean
}

export function useBuildingPrice(
  buildingId: string,
  _fallbackPrice: number,
): BuildingPrice {
  const [prices, setPrices] = useState<Omit<BuildingPrice, "loading">>({
    studioMin: null,
    oneBedMin: null,
    twoBedMin: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadPrices() {
      setLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from("units")
        .select("beds, price")
        .eq("building_id", buildingId)

      if (cancelled) return

      const minimums: Omit<BuildingPrice, "loading"> = {
        studioMin: null,
        oneBedMin: null,
        twoBedMin: null,
      }

      for (const unit of data ?? []) {
        if (typeof unit.price !== "number") continue

        if (unit.beds === 0) {
          minimums.studioMin = minimums.studioMin === null
            ? unit.price
            : Math.min(minimums.studioMin, unit.price)
        } else if (unit.beds === 1) {
          minimums.oneBedMin = minimums.oneBedMin === null
            ? unit.price
            : Math.min(minimums.oneBedMin, unit.price)
        } else if (unit.beds === 2) {
          minimums.twoBedMin = minimums.twoBedMin === null
            ? unit.price
            : Math.min(minimums.twoBedMin, unit.price)
        }
      }

      setPrices(minimums)
      setLoading(false)
    }

    loadPrices()

    return () => {
      cancelled = true
    }
  }, [buildingId])

  return { ...prices, loading }
}
