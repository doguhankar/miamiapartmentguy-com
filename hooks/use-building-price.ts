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
    if (!buildingId) {
      setLoading(false)
      return
    }

    const fetchPrice = async () => {
      try {
        setLoading(true)
        
        const res = await fetch(`/api/prices/${buildingId}?t=${Date.now()}`)
        
        if (res.ok) {
          const data: PricingData = await res.json()
          if (data.units && data.units.length > 0) {
            const minPrice = Math.min(...data.units.map(u => u.price))
            setPrice(minPrice)
          } else {
            setPrice(fallbackPrice)
          }
        } else {
          setPrice(fallbackPrice)
        }
      } catch (err) {
        setPrice(fallbackPrice)
      } finally {
        setLoading(false)
      }
    }

    fetchPrice()
  }, [buildingId, fallbackPrice])

  return { price, loading }
}
