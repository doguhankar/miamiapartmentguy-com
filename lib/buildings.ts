export interface Building {
  id: string
  name: string
  neighborhood: string
  lat: number
  lng: number
  address: string
  priceMin: number
  priceMax: number
  priceTier: string
  concession: string
  units: string[]
  incomeReq: string
  creditReq: string
  guarantor: boolean
  holdDays: number[]
  images: string[]
  amenities: string[]
  fees?: {
    securityDeposit?: number
    applicationFee?: number
    adminFee?: number
    petFeeMonthly?: number
  }
  requirements?: {
    incomeMultiplier?: string
    creditScore?: string
    guarantor?: string
    holdDays?: string
  }
}

export const buildings: Building[] = [
  {
    id: "flow-brickell",
    name: "Flow Brickell",
    neighborhood: "Brickell",
    lat: 25.758,
    lng: -80.1933,
    address: "275 SW 6th St, Miami, FL 33130",
    priceMin: 2790,
    priceMax: 18086,
    priceTier: "$$",
    concession: "1 month free on select units",
    units: ["Studio", "1B", "2B", "3B"],
    incomeReq: "2.5x",
    creditReq: ">650",
    guarantor: true,
    holdDays: [30, 60, 90],
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop",
    ],
    amenities: ["Pool", "Gym", "Concierge", "Parking", "Rooftop"],
    fees: {
      securityDeposit: 2790,
      applicationFee: 75,
      adminFee: 150,
      petFeeMonthly: 35,
    },
    requirements: {
      incomeMultiplier: "2.5x monthly rent",
      creditScore: "650+",
      guarantor: "Accepted",
      holdDays: "30/60/90 days",
    },
  },
  {
    id: "modera-riverside",
    name: "Modera Riverside",
    neighborhood: "Brickell",
    lat: 25.7576,
    lng: -80.1949,
    address: "300 SW 2nd Ave, Miami, FL 33130",
    priceMin: 2500,
    priceMax: 15000,
    priceTier: "$$",
    concession: "50% off first 60 days",
    units: ["Studio", "1B", "2B"],
    incomeReq: "2.5x",
    creditReq: ">650",
    guarantor: true,
    holdDays: [30, 60],
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop",
    ],
    amenities: ["Pool", "Gym", "Parking"],
    fees: {
      securityDeposit: 2500,
      applicationFee: 60,
      adminFee: 125,
      petFeeMonthly: 30,
    },
    requirements: {
      incomeMultiplier: "2.5x monthly rent",
      creditScore: "650+",
      guarantor: "Accepted",
      holdDays: "30/60 days",
    },
  },
  {
    id: "maizon",
    name: "Maizon",
    neighborhood: "Brickell",
    lat: 25.7554,
    lng: -80.1944,
    address: "221 SW 12th St, Miami, FL 33130",
    priceMin: 2235,
    priceMax: 5000,
    priceTier: "$",
    concession: "$500 move-in credit",
    units: ["Studio", "1B", "2B"],
    incomeReq: "2.5x",
    creditReq: ">650",
    guarantor: true,
    holdDays: [14, 30, 60],
    images: [
      "https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop",
    ],
    amenities: ["Pool", "Gym", "Lounge"],
    fees: {
      securityDeposit: 2235,
      applicationFee: 50,
      adminFee: 100,
    },
    requirements: {
      incomeMultiplier: "2.5x monthly rent",
      creditScore: "650+",
      guarantor: "Accepted",
      holdDays: "14/30/60 days",
    },
  },
  {
    id: "solitair",
    name: "Solitair",
    neighborhood: "Brickell",
    lat: 25.7585,
    lng: -80.1936,
    address: "86 SW 8th St, Miami, FL 33130",
    priceMin: 2654,
    priceMax: 12000,
    priceTier: "$$",
    concession: "Free first month + parking",
    units: ["Studio", "1B", "2B", "3B"],
    incomeReq: "3x",
    creditReq: ">650",
    guarantor: false,
    holdDays: [30, 60, 90],
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop",
    ],
    amenities: ["Pool", "Gym", "Bar Lounge", "Billiards"],
    fees: {
      securityDeposit: 2654,
      applicationFee: 75,
      adminFee: 150,
      petFeeMonthly: 40,
    },
    requirements: {
      incomeMultiplier: "3x monthly rent",
      creditScore: "650+",
      guarantor: "Not required",
      holdDays: "30/60/90 days",
    },
  },
  {
    id: "miro-brickell",
    name: "Miro Brickell",
    neighborhood: "Brickell",
    lat: 25.756,
    lng: -80.192,
    address: "255 SW 11th St, Miami, FL 33130",
    priceMin: 2425,
    priceMax: 6500,
    priceTier: "$",
    concession: "1 month free on leases 12+ months",
    units: ["Studio", "1B", "2B"],
    incomeReq: "2.5x",
    creditReq: ">650",
    guarantor: true,
    holdDays: [14, 30, 60],
    images: [
      "https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop",
    ],
    amenities: ["Pool", "Gym", "Dog Wash", "Yoga Studio"],
    fees: {
      securityDeposit: 2425,
      applicationFee: 60,
      adminFee: 120,
    },
    requirements: {
      incomeMultiplier: "2.5x monthly rent",
      creditScore: "650+",
      guarantor: "Accepted",
      holdDays: "14/30/60 days",
    },
  },
  {
    id: "brickell-first",
    name: "Brickell First",
    neighborhood: "Brickell",
    lat: 25.7555,
    lng: -80.1945,
    address: "110 SW 12th St, Miami, FL 33130",
    priceMin: 3045,
    priceMax: 7500,
    priceTier: "$$",
    concession: "2 months free on 12-month lease",
    units: ["1B", "2B", "3B"],
    incomeReq: "3x",
    creditReq: ">650",
    guarantor: false,
    holdDays: [30, 60],
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop",
    ],
    amenities: ["Pool", "Spa", "Gym", "Concierge", "Valet"],
    fees: {
      securityDeposit: 3045,
      applicationFee: 75,
      adminFee: 175,
      petFeeMonthly: 50,
    },
    requirements: {
      incomeMultiplier: "3x monthly rent",
      creditScore: "650+",
      guarantor: "Not required",
      holdDays: "30/60 days",
    },
  },
  {
    id: "cmpnd",
    name: "CMPND",
    neighborhood: "Downtown",
    lat: 25.765,
    lng: -80.1866,
    address: "55 NE 2nd St, Miami, FL 33132",
    priceMin: 2478,
    priceMax: 5500,
    priceTier: "$",
    concession: "Two months free on select units",
    units: ["Studio", "1B", "2B"],
    incomeReq: "2.5x",
    creditReq: ">600",
    guarantor: true,
    holdDays: [14, 30, 60],
    images: [
      "https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop",
    ],
    amenities: ["Pool", "Gym", "Pet-Friendly", "Coworking"],
    fees: {
      securityDeposit: 2478,
      applicationFee: 50,
      adminFee: 100,
      petFeeMonthly: 25,
    },
    requirements: {
      incomeMultiplier: "2.5x monthly rent",
      creditScore: "600+",
      guarantor: "Accepted",
      holdDays: "14/30/60 days",
    },
  },
]

export const neighborhoodColors: Record<string, string> = {
  Brickell: "bg-blue-100 text-blue-700",
  Downtown: "bg-emerald-100 text-emerald-700",
}
