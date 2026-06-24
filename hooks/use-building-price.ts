import { useState, useEffect } from 'react'

interface PricingData {
  buildingId: string
  units: Array<{ price: number }>
  updatedAt: string
}

export function useBuildingPrice(buildingId: string, fallbackPrice: number) {
  const [price, setPrice] = useState(fallbackPrice)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch(`/api/prices/${buildingId}?t=${Date.now()}`)
        if (res.ok) {
          const data: PricingData = await res.json()
          if (data.units && data.units.length > 0) {
            const minPrice = Math.min(...data.units.map(u => u.price))
            setPrice(minPrice)
          }
        }
      } catch (err) {
        console.error(`[v0] Error fetching price for ${buildingId}:`, err)
      } finally {
        setLoading(false)
      }
    }

    fetchPrice()
  }, [buildingId])

  return { price, loading }
}
