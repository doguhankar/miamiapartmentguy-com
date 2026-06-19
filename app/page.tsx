'use client';

import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ImageCarousel } from '@/components/image-carousel';
import { MapFilterModal, type FilterState } from '@/components/map-filter-modal';
import { FlowBrickellCard } from '@/components/flow-brickell-card';
import { MoveWithDon } from '@/components/move-with-don';
import { DesktopBuildingCard } from '@/components/desktop-building-card';
import { BuildingDetailView } from '@/components/building-detail-view';
import { MapFilterCard, type MapFilterState } from '@/components/map-filter-card';
import { copyToClipboard, showToast } from '@/lib/toast-utils';
import { Star } from 'lucide-react';

const BUILDINGS = [
  { id: 1, name: 'Flow Brickell', neighborhood: 'Brickell', address: '275 SW 6th St, Miami, FL 33130', lat: 25.7684, lng: -80.1990, priceMin: 2790, priceTier: '$$', tagline: 'Vibrant community, social hub, always buzzing', concession: '1 month free on select units', units: ['Studio', '1B', '2B', '3B'], incomeReq: '2.5x', creditReq: '>650', guarantor: true, holdDays: [30, 60, 90], images: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/f8-PjSUbS6yTrIBusqZ0XXyuU8h1qerGT.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/f7-e8tHKaMeidxoV13PJgZNveLuE6ScPy.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/f1-sC9oG9eD9DGGUwRRPP93yLIPgssB8r.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/f3-Bw25PrMJlv7UYJ3bt5D5fmbz94yAMb.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/f4-9VsnFpU86vEqyTuNQKYutuLUnX5dEi.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/f5-XWNn2OspXHwINOXtaNPYMrIUhleUvP.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/f6-OjhZIKj1vv611WQHgFm26OfY157Ijw.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/f2-ICadR5CSOFH7p9F3OQtpdBs2CH5RlD.webp'], amenities: ['Pool', 'Gym', 'Concierge', 'Parking', 'Rooftop'], fees: { deposit: '$2,790', application: '$75', admin: '$150', parking: '$150/car', misc: 'Pet fee: $35/mo' } },
  { id: 2, name: 'Modera Riverside', neighborhood: 'Brickell', address: '300 SW 2nd Ave, Miami, FL 33130', lat: 25.7561, lng: -80.1954, priceMin: 2500, priceTier: '$$', tagline: 'Affordable high rise, quiet, Brickell vibes without the price tag', concession: '50% off first 60 days', units: ['Studio', '1B', '2B'], incomeReq: '2.5x', creditReq: '>650', guarantor: true, holdDays: [30, 60], images: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m10-eFibmVGaoLcW7F9yCC8Q0iDbnok5RQ.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m2-zljnlgeiWfRh7efeAOWUdv7n9CBRg8.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m1-N8n1gv8rO34iHYqY2A9ThD4bCBBCzS.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m3-P1DrJebzT4LXbuhgUfyEK4QfQbQaCP.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m4-5yw1QrHhTa6B3CsxKYhub7Jcd4t4bf.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m5-xn4hF7DSM3eovfOZ6Ye7TTXYVGzAoH.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m6-ha2rtnFYwLSD7UvP42a2mzkpntezAl.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m7-rrZzGBE3l6dBWHjRyvcwyOQILIa1Ia.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m8-4HBSHHVaB1e40ghxXO2pKUCZdfKyC9.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m9-TlKdeoYwon7uWYwzuhrVghOXxeGl6i.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m11-vjN4FXlPNBGbWxQE9r7L0htW8DKWG5.webp'], amenities: ['Pool', 'Gym', 'Parking'], fees: { deposit: '$2,500', application: '$50', admin: '$100', parking: '$125/car', misc: 'Renters insurance required' } },
  { id: 3, name: 'Maizon', neighborhood: 'Brickell', address: '221 SW 12th St, Miami, FL 33130', lat: 25.7528, lng: -80.1958, priceMin: 2235, priceTier: '$', tagline: 'Modern living, walkable Brickell, accessible pricing', concession: '$500 move-in credit', units: ['Studio', '1B', '2B'], incomeReq: '2.5x', creditReq: '>650', guarantor: true, holdDays: [14, 30, 60], images: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m7-jNaoQBZPgAJqewPoOFl1BQiCZi739k.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m1-OwMP8bOjwr28fKxPS2EvFerp4FObKU.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m2-VUZhXREXzNUnHLCBAYPlqf9rO8SbVb.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m3-VziIF3AXZaRjdkc5pVJu6Z4XxOBIOR.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m4-L5dcGBNxHNCp94mLqHuCWQcjSPLVQU.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m5-hSp80fmga9b4S2TD6Oq2dIjx13iwKa.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m6-zULNSdqRYyjTot5WJrOKRD1VMfqdKb.webp'], amenities: ['Pool', 'Gym', 'Lounge'], fees: { deposit: '$2,235', application: '$60', admin: '$120', parking: '$140/car', misc: 'None' } },
  { id: 4, name: 'Solitair', neighborhood: 'Brickell', address: '86 SW 8th St, Miami, FL 33130', lat: 25.7662, lng: -80.1946, priceMin: 2654, priceTier: '$$', tagline: 'Heart of Brickell, skyline views, luxury finishes', concession: 'Free first month + parking', units: ['Studio', '1B', '2B', '3B'], incomeReq: '3x', creditReq: '>650', guarantor: false, holdDays: [30, 60, 90], images: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/s1-Cq8HWNBmCuDUjzUnemNQ0LSL3oAyf9.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/s2-4FM6V9NJD00X1xWKnCvf5ICeRKZu6N.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/s3-8YSpCa6oqLwQQpE4d66WSS49eLmYD2.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/s4-8RiBxRFqfXyIBwKqkTMPV9KDpiLHr4.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/s5-TPlih6Zwm5nAHcfTwn3I6xVrWXBf2F.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/s6-xKXhykKd0cAB30Xh8EolJ7rx8FxQNd.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/s7-27mIhAPC9FgphoPVeL1Qzl4q4Y7fTY.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/s8-iGBISVwmfzNzCcAcxupX6P4GkzE26C.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/s9-eIA6KFaI9JDatCpAQMa2TgFDV83XRE.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/s10-ko4gZiBjUNLyg6V1dUlv9bxZ2hxJDn.webp'], amenities: ['Pool', 'Gym', 'Bar Lounge', 'Billiards'], fees: { deposit: '$2,654', application: '$75', admin: '$150', parking: 'Free', misc: 'Concierge fee: $25/mo' } },
  { id: 5, name: 'Miro Brickell', neighborhood: 'Brickell', address: '255 SW 11th St, Miami, FL 33130', lat: 25.7626, lng: -80.1943, priceMin: 2425, priceTier: '$', tagline: 'Sleek modern, Brickell central, rooftop living', concession: '1 month free on leases 12+ months', units: ['Studio', '1B', '2B'], incomeReq: '2.5x', creditReq: '>650', guarantor: true, holdDays: [14, 30, 60], images: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m1-EVGO5Tnuoa56uiQIXOy3hT9IcOEYUu.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m2-wuD1Aeh4mN9nF9xbbDQ9k11TChxsYv.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m3-sr2A1V5niMZrWtGbAGTPd4aEoAZ04b.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m4-yPkGymDnP7mXYalAEVLFJl96rkE5Dd.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m5-HQ3lSjEHqYmY2W1uW1lzXlDIMkmuR4.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m6-fXxRDyBBn2yz8AZfXae7zyNuucFTcQ.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m7-1Cq4dznXhyuUt4lrRIolmg1tLneTZ5.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/m8-fOgzc4WvWx8sykWi2lDdU5S47FYXOS.webp'], amenities: ['Pool', 'Gym', 'Dog Wash', 'Yoga Studio'], fees: { deposit: '$2,425', application: '$65', admin: '$130', parking: '$135/car', misc: 'Pet fee: $50/mo' } },
  { id: 6, name: 'Brickell First', neighborhood: 'Brickell', address: '110 SW 12th St, Miami, FL 33130', lat: 25.7622, lng: -80.1958, priceMin: 3045, priceTier: '$$', tagline: 'Affordable quality, prime location, reliable community', concession: '2 months free on 12-month lease', units: ['1B', '2B', '3B'], incomeReq: '3x', creditReq: '>650', guarantor: false, holdDays: [30, 60], images: ['https://hebbkx1anhila5yf.public.blob.vercel-storage.com/b1-O2FpSvYfF1LHICzaZvBrxtxAVbC0KC.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/b2-Sm2CtHzLgcPrW6MLXcv1fLHW6XmFVy.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/b3-FS8ZnMT2YPNi5qZSOx7QHMmLHMtS14.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/b4-7wDXGyndKR7qe0aqfh75kJ95l3oyW5.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/b5-sQnJdKQA02URpuWgrGmGoqVwHJ7Z1A.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/b6-bi6UZdvOoBebqO5jvsLT1iD8BTFsGE.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/b7-ZIUarO5HNZYHISSVJoiPFa1476TW8h.webp', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/b8-teMZtibo9B29cVGnS1G3p2pcxs8IFj.webp'], amenities: ['Pool', 'Spa', 'Gym', 'Concierge', 'Valet'], fees: { deposit: '$3,045', application: '$100', admin: '$200', parking: '$175/car', misc: 'Valet required: $60/mo' } },
  { id: 7, name: 'CMPND', neighborhood: 'Downtown', address: '55 NE 2nd St, Miami, FL 33132', lat: 25.7751, lng: -80.1924, priceMin: 1950, priceTier: '$', tagline: "Miami's newest highrise, all-glass corner units, two-story amenities", concession: 'Two months free on select units', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [14, 30, 60, 90], images: ['https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Pet-Friendly', 'Coworking'], fees: { deposit: '$1,950', application: '$50', admin: '$100', parking: '$120/car', misc: 'None' } },
  { id: 8, name: 'Miami World Tower', neighborhood: 'Downtown', address: '710 NE 1st Ave, Miami, FL 33132', lat: 25.7765, lng: -80.1933, priceMin: 2410, priceTier: '$$', tagline: 'All-glass downtown, vibrant location, panoramic views', concession: 'Up to two months free on select apartments', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Concierge', 'Parking', 'Rooftop'], fees: { deposit: '$2,410', application: '$75', admin: '$150', parking: '$160/car', misc: 'Concierge fee: $30/mo' } },
  { id: 9, name: 'Muze at Met', neighborhood: 'Downtown', address: '340 SE 3rd St, Miami, FL 33131', lat: 25.7679, lng: -80.1892, priceMin: 2627, priceTier: '$$', tagline: 'Quiet luxury, city views, spacious layouts', concession: '1.5 months free on 1Bs, 1 month on 2/3 beds', units: ['Studio', '1B', '2B', '3B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [14], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Concierge', 'Parking', 'Rooftop'], fees: { deposit: '$2,627', application: '$80', admin: '$160', parking: '$165/car', misc: 'Pet fee: $40/mo' } },
  { id: 10, name: 'Flow Miami World', neighborhood: 'Downtown', address: '698 NE 1st Ave, Miami, FL 33132', lat: 25.7763, lng: -80.1931, priceMin: 2223, priceTier: '$$', tagline: 'Vibrant community, social hub, always buzzing', concession: '3 months free on all apartments', units: ['Studio', '1B', '2B', '3B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Concierge', 'Parking', 'Rooftop'], fees: { deposit: '$2,223', application: '$70', admin: '$140', parking: '$145/car', misc: 'None' } },
  { id: 11, name: 'Monarc at Met', neighborhood: 'Downtown', address: '201 SE 2nd Ave, Miami, FL 33131', lat: 25.7667, lng: -80.1883, priceMin: 2692, priceTier: '$$', tagline: 'Quiet luxury on a budget, city views, accessible', concession: 'No current concessions', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [14], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Concierge', 'Parking', 'Rooftop'], fees: { deposit: '$2,692', application: '$85', admin: '$170', parking: '$170/car', misc: 'Concierge fee: $35/mo' } },
  { id: 12, name: 'Parkline', neighborhood: 'Downtown', address: '100 NW 6th St, Miami, FL 33136', lat: 25.7781, lng: -80.1997, priceMin: 2120, priceTier: '$', tagline: 'Direct Brightline access, bright units, skyline views', concession: 'Up to 3 months free', units: ['Studio', '1B', '2B', '3B'], incomeReq: '3x', creditReq: '>650', guarantor: false, holdDays: [14], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Concierge', 'Parking', 'Rooftop'], fees: { deposit: '$2,120', application: '$60', admin: '$120', parking: '$130/car', misc: 'None' } },
  // Edgewater
  { id: 13, name: '2000 Biscayne', neighborhood: 'Edgewater', address: '251 NE 20th St, Miami, FL 33137', lat: 25.7890, lng: -80.1870, priceMin: 2800, priceTier: '$$', tagline: 'Waterfront views, modern luxury, Biscayne Bay access', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Parking'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 14, name: 'Modera Edgewater', neighborhood: 'Edgewater', address: '455 NE 24th St, Miami, FL 33137', lat: 25.7920, lng: -80.1890, priceMin: 2300, priceTier: '$', tagline: 'Modern affordability, bay views, quiet residential', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Parking'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 15, name: 'Blu 27 Edgewater', neighborhood: 'Edgewater', address: '2701 Biscayne Blvd, Miami, FL 33137', lat: 25.7910, lng: -80.1880, priceMin: 2500, priceTier: '$$', tagline: 'Contemporary design, blue-tinted glass, premium amenities', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Parking'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 16, name: 'Metro Edgewater', neighborhood: 'Edgewater', address: '452 NE 31st St, Miami, FL 33137', lat: 25.7905, lng: -80.1885, priceMin: 2200, priceTier: '$', tagline: 'Urban living, transit-friendly, walkable neighborhood', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Parking'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 17, name: 'The Hamilton', neighborhood: 'Edgewater', address: '555 NE 34th St, Miami, FL 33137', lat: 25.7895, lng: -80.1865, priceMin: 2900, priceTier: '$$', tagline: 'Waterfront elegance, luxury finishes, bay proximity', concession: 'TBD', units: ['1B', '2B', '3B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Concierge', 'Parking'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  // Midtown
  { id: 18, name: 'AMLI Midtown 29', neighborhood: 'Midtown', address: '180 NE 29th St, Miami, FL 33137', lat: 25.7940, lng: -80.1910, priceMin: 2400, priceTier: '$$', tagline: 'Modern midtown, transit hub, urban living', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Parking'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 19, name: 'AMLI Midtown Miami', neighborhood: 'Midtown', address: '3000 NE 2nd Ave, Miami, FL 33137', lat: 25.7955, lng: -80.1910, priceMin: 2500, priceTier: '$$', tagline: 'Sleek apartments, walkable midtown, city vibes', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Parking'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 20, name: 'Eve at The District', neighborhood: 'Midtown', address: '3635 NE 1st Ave, Miami, FL 33137', lat: 25.7950, lng: -80.1900, priceMin: 2350, priceTier: '$$', tagline: 'Tech-forward living, midtown energy, community spaces', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Coworking'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 21, name: 'Midtown Five', neighborhood: 'Midtown', address: '125 NE 32nd St, Miami, FL 33137', lat: 25.7960, lng: -80.1905, priceMin: 2600, priceTier: '$$', tagline: 'Five-star amenities, premium midtown, cosmopolitan lifestyle', concession: 'TBD', units: ['Studio', '1B', '2B', '3B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Rooftop', 'Concierge'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 22, name: 'Gio Midtown', neighborhood: 'Midtown', address: '3131 NE 1st Ave, Miami, FL 33137', lat: 25.7958, lng: -80.1908, priceMin: 2450, priceTier: '$$', tagline: 'Contemporary design, midtown central, rooftop culture', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Rooftop'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 23, name: 'Cortland Midtown Miami', neighborhood: 'Midtown', address: '2901 NE 1st Ave, Miami, FL 33137', lat: 25.7965, lng: -80.1912, priceMin: 2300, priceTier: '$', tagline: 'Quality living, midtown location, reliable community', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Parking'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  // Wynwood
  { id: 24, name: 'Joule House', neighborhood: 'Wynwood', address: '2200 NW 1st Ave, Miami, FL 33127', lat: 25.7980, lng: -80.1990, priceMin: 2200, priceTier: '$', tagline: 'Artsy Wynwood, design-forward, creative hub', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 25, name: 'Amara Wynwood', neighborhood: 'Wynwood', address: '45 NE 27th St, Miami, FL 33137', lat: 25.7985, lng: -80.1995, priceMin: 2350, priceTier: '$$', tagline: 'Modern Wynwood, art district living, cultural vibes', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Parking'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 26, name: 'Wynwood Plaza Residences', neighborhood: 'Wynwood', address: '95 NW 29th St, Miami, FL 33127', lat: 25.8000, lng: -80.1985, priceMin: 2500, priceTier: '$$', tagline: 'Wynwood center, walkable galleries, artistic community', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Rooftop'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 27, name: 'Flow Wynwood', neighborhood: 'Wynwood', address: '176 NW 25th St, Miami, FL 33127', lat: 25.7995, lng: -80.1975, priceMin: 2400, priceTier: '$$', tagline: 'Vibrant Wynwood, social energy, art scene access', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Parking'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 28, name: 'The Highley House', neighborhood: 'Wynwood', address: '2150 N Miami Ave, Miami, FL 33127', lat: 25.7990, lng: -80.1998, priceMin: 2550, priceTier: '$$', tagline: 'Trendy Wynwood, premium finishes, gallery district', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Parking'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 29, name: 'Wynd 27 & Wynd 28', neighborhood: 'Wynwood', address: '127 NW 27th St, Miami, FL 33127', lat: 25.7992, lng: -80.2000, priceMin: 2600, priceTier: '$$', tagline: 'Twin towers, Wynwood landmark, modern luxury', concession: 'TBD', units: ['Studio', '1B', '2B', '3B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Rooftop', 'Parking'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 30, name: '29 WYN', neighborhood: 'Wynwood', address: '2828 NW 1st Ave, Miami, FL 33127', lat: 25.8005, lng: -80.2002, priceMin: 2300, priceTier: '$', tagline: 'Wynwood heart, street art views, creative neighborhood', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 31, name: 'AMLI Wynwood', neighborhood: 'Wynwood', address: '70 NW 25th St, Miami, FL 33127', lat: 25.7988, lng: -80.1980, priceMin: 2450, priceTier: '$$', tagline: 'Modern Wynwood, walkable galleries, artsy living', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Parking'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 32, name: 'The Dorsey', neighborhood: 'Wynwood', address: '286 NW 29th St, Miami, FL 33127', lat: 25.7975, lng: -80.1970, priceMin: 2100, priceTier: '$', tagline: 'Vintage Wynwood vibes, hip location, neighborhood character', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 33, name: 'Artem', neighborhood: 'Wynwood', address: '90 NW 29th St, Miami, FL 33127', lat: 25.7998, lng: -80.1978, priceMin: 2350, priceTier: '$$', tagline: 'Minimalist design, Wynwood cool, contemporary living', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Parking'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 34, name: 'Strata Wynwood', neighborhood: 'Wynwood', address: '21 NE 22nd St, Miami, FL 33137', lat: 25.7987, lng: -80.1997, priceMin: 2400, priceTier: '$$', tagline: 'Layered living, Wynwood center, urban design', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Rooftop'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 35, name: 'Wynwood 25', neighborhood: 'Wynwood', address: '240 NW 25th St, Miami, FL 33127', lat: 25.7978, lng: -80.1992, priceMin: 2150, priceTier: '$', tagline: 'Mid-rise Wynwood, walkable district, accessible pricing', concession: 'TBD', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
  { id: 37, name: 'Manor Biscayne', neighborhood: 'North Miami', address: '1650 NE 124th St, North Miami, FL 33181', lat: 25.7848, lng: -80.1877, priceMin: 2450, priceTier: '$$', tagline: 'Waterfront Biscayne Bay views, modern amenities', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 38, name: 'Aura North Miami Beach', neighborhood: 'North Miami Beach', address: '17071 W Dixie Hwy, North Miami Beach, FL 33160', lat: 25.9301, lng: -80.1198, priceMin: 2850, priceTier: '$$', tagline: 'Luxury beachfront living, world-class resort amenities', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 39, name: 'Biscayne Shores', neighborhood: 'North Miami', address: '11295 Biscayne Blvd, Miami, FL 33181', lat: 25.7893, lng: -80.1865, priceMin: 2200, priceTier: '$', tagline: 'Bay-adjacent living, contemporary design, walkable', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 40, name: 'The Gardens', neighborhood: 'North Miami', address: '1155 NE 126th St, North Miami, FL 33161', lat: 25.8816, lng: -80.1670, priceMin: 1950, priceTier: '$', tagline: 'Tropical oasis, family-friendly, nature-inspired', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 41, name: 'Soleste Nomi Beach', neighborhood: 'North Miami Beach', address: '16395 Biscayne Blvd, North Miami Beach, FL 33160', lat: 25.9289, lng: -80.1202, priceMin: 3100, priceTier: '$$$', tagline: 'Beach luxury, contemporary design, premium finishes', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 42, name: 'Villa Laguna', neighborhood: 'North Miami', address: '2200 Sole Mia Square Ln, North Miami, FL 33181', lat: 25.8797, lng: -80.1685, priceMin: 2100, priceTier: '$$', tagline: 'Lagoon-view living, serene surroundings, modern comfort', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 43, name: 'Biscayne 112', neighborhood: 'Downtown', address: '1121 Biscayne Blvd, Miami, FL 33132', lat: 25.7778, lng: -80.1901, priceMin: 2350, priceTier: '$$', tagline: 'Urban downtown, cultural district, vibrant energy', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 44, name: 'The Shoreline at Sole Mia', neighborhood: 'North Miami Beach', address: '2321 Laguna Cir, North Miami, FL 33181', lat: 25.9280, lng: -80.1206, priceMin: 2950, priceTier: '$$', tagline: 'Beachfront tranquility, resort-style living, ocean views', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 45, name: 'Blu Aventura', neighborhood: 'Aventura', address: '2335 NE 186th St, Miami, FL 33180', lat: 25.9601, lng: -80.1312, priceMin: 2650, priceTier: '$$', tagline: 'Modern waterfront living, luxury finishes, community-focused', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 46, name: 'Arvella', neighborhood: 'Aventura', address: '2555 NE 179th St, North Miami Beach, FL 33160', lat: 25.9571, lng: -80.1325, priceMin: 2400, priceTier: '$$', tagline: 'Contemporary design, accessible luxury, well-appointed', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 47, name: 'Modera Aventura', neighborhood: 'Aventura', address: '2660 NE 192nd Ter, Miami, FL 33180', lat: 25.9608, lng: -80.1342, priceMin: 2750, priceTier: '$$', tagline: 'Sophisticated living, premium amenities, urban convenience', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 48, name: 'Avida Aventura', neighborhood: 'Aventura', address: '19401 W Dixie Hwy, Miami, FL 33180', lat: 25.9588, lng: -80.1358, priceMin: 2550, priceTier: '$$', tagline: 'Vibrant community, thoughtful design, modern lifestyle', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 49, name: 'Bread Building', neighborhood: 'Hollywood', address: '1770 South Young Circle, Hollywood, FL 33020', lat: 26.0118, lng: -80.1484, priceMin: 2400, priceTier: '$$', tagline: 'Modern urban living, walkable district vibes', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 50, name: 'Revv', neighborhood: 'Hollywood', address: '2233 Hollywood Boulevard, Hollywood, FL 33020', lat: 26.0145, lng: -80.1512, priceMin: 2500, priceTier: '$$', tagline: 'Contemporary design, entertainment district', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 51, name: 'The Tropic', neighborhood: 'Hollywood', address: '303 S. Federal Highway, Hollywood, FL 33020', lat: 26.0098, lng: -80.1467, priceMin: 2350, priceTier: '$$', tagline: 'Beachfront adjacent, tropical atmosphere', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 52, name: 'Town Hollywood', neighborhood: 'Hollywood', address: '2000 Stirling Rd, Hollywood, FL 33020', lat: 26.0583, lng: -80.1706, priceMin: 2300, priceTier: '$$', tagline: 'Community-focused, residential feel', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 53, name: 'Hollywood Heights on The Boulevard', neighborhood: 'Hollywood', address: '2001 Hollywood Boulevard, Hollywood, FL 33020', lat: 26.0147, lng: -80.1508, priceMin: 2450, priceTier: '$$', tagline: 'Boulevard living, urban convenience', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 54, name: '1818 Park', neighborhood: 'Hollywood', address: '1818 Hollywood Blvd, Hollywood, FL 33020', lat: 26.0142, lng: -80.1517, priceMin: 2550, priceTier: '$$', tagline: 'Park-adjacent, lifestyle focused', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 55, name: 'Circ Residences', neighborhood: 'Hollywood', address: '1776 Polk Street, Hollywood, FL 33020', lat: 26.0108, lng: -80.1472, priceMin: 2380, priceTier: '$$', tagline: 'Contemporary design, community spaces', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 56, name: 'Alvista Hollywood', neighborhood: 'Hollywood', address: '812 South Park Road, Hollywood, FL 33021', lat: 26.0095, lng: -80.1625, priceMin: 2420, priceTier: '$$', tagline: 'Park views, residential tranquility', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 57, name: '101 Dania Beach', neighborhood: 'Dania Beach', address: '101 SW 1st St, Dania Beach, FL 33004', lat: 26.0506, lng: -80.1455, priceMin: 2600, priceTier: '$$', tagline: 'Waterfront living, ocean views, rooftop pool', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 58, name: 'Elevate Dania Beach', neighborhood: 'Dania Beach', address: '600 East Dania Beach Boulevard, Dania Beach, FL 33004', lat: 26.0507, lng: -80.1419, priceMin: 2650, priceTier: '$$', tagline: 'Luxury coastal living, modern design', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 59, name: 'Avery Dania Pointe East', neighborhood: 'Dania Beach', address: '120 North Compass Way, Dania Beach, FL 33004', lat: 26.0510, lng: -80.1425, priceMin: 2700, priceTier: '$$', tagline: 'Contemporary waterfront, lifestyle community', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 60, name: 'Soleste Seaside', neighborhood: 'Dania Beach', address: '4 North Federal Highway, Dania Beach, FL 33004', lat: 26.0506, lng: -80.1438, priceMin: 2550, priceTier: '$$', tagline: 'Seaside tranquility, resort-style amenities', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 66, name: 'Soleste Spring Garden', neighborhood: 'Allapattah', address: '1005 Spring Garden Road, Miami, FL 33136', lat: 25.7762, lng: -80.2245, priceMin: 2350, priceTier: '$$', tagline: 'Spring Garden vibes, urban garden living', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 67, name: 'The Skylar', neighborhood: 'Allapattah', address: '1444 NW 14th Avenue, Miami, FL 33125', lat: 25.7887, lng: -80.2196, priceMin: 2420, priceTier: '$$', tagline: 'Contemporary skyline views, modern minimalist', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 68, name: 'Lantower River Landing', neighborhood: 'Allapattah', address: '1480 NW North River Dr, Miami, FL 33125', lat: 25.7899, lng: -80.2184, priceMin: 2480, priceTier: '$$', tagline: 'Riverfront living, urban waterfront escape', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 69, name: 'Gallery Marti Parc', neighborhood: 'Little Havana', address: '450 SW 5th Street, Miami, FL 33130', lat: 25.7594, lng: -80.2125, priceMin: 2300, priceTier: '$$', tagline: 'Gallery district living, cultural heart vibes', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 70, name: 'Ram Miami River North/South', neighborhood: 'Little Havana', address: '590 West Flagler Street, Miami, FL 33130', lat: 25.7628, lng: -80.2088, priceMin: 2550, priceTier: '$$', tagline: 'River district living, modern riverside', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 71, name: 'Reflections Rentals', neighborhood: 'Little Havana', address: '1000 NW 7th Street, Miami, FL 33136', lat: 25.7806, lng: -80.2129, priceMin: 2400, priceTier: '$$', tagline: 'Reflective living, artistic neighborhood vibe', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 72, name: '10x Miami River', neighborhood: 'Little Havana', address: '1001 NW 7th St, Miami, FL 33136', lat: 25.7808, lng: -80.2126, priceMin: 2520, priceTier: '$$', tagline: 'Multiplied living, urban innovation hub', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 73, name: 'Brickell West City Rentals', neighborhood: 'Little Havana', address: '729 NW 2nd St, Miami, FL 33128', lat: 25.7761, lng: -80.2084, priceMin: 2380, priceTier: '$$', tagline: 'West Brickell lifestyle, urban convenience', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 74, name: 'Tides at River Rapids', neighborhood: 'Little Havana', address: '2750 NW South River Dr, Miami, FL 33125', lat: 25.7875, lng: -80.2198, priceMin: 2600, priceTier: '$$', tagline: 'Tidal living, river escape tranquility', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 75, name: 'Riverview One', neighborhood: 'Little Havana', address: '645 NW 1st St, Miami, FL 33128', lat: 25.7766, lng: -80.2033, priceMin: 2450, priceTier: '$$', tagline: 'River views, one perfect living moment', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 76, name: 'Leksa at Cityplace', neighborhood: 'Doral', address: '8401 NW 34th Terrace, Doral, FL 33122', lat: 25.8080, lng: -80.3346, priceMin: 2400, priceTier: '$$', tagline: 'Cityplace living, urban destination vibes', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 77, name: 'Century Town Center', neighborhood: 'Doral', address: '8175 NW 107th Avenue, Doral, FL 33178', lat: 25.8282, lng: -80.3608, priceMin: 2550, priceTier: '$$', tagline: 'Town center living, century modern design', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 78, name: 'Casero', neighborhood: 'Doral', address: '8255 Park Blvd, Doral, FL 33126', lat: 25.8145, lng: -80.3268, priceMin: 2380, priceTier: '$$', tagline: 'Park boulevard living, home sweet home', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 79, name: 'Palmera', neighborhood: 'Doral', address: '8400 NW 102nd Ave, Doral, FL 33178', lat: 25.8368, lng: -80.3548, priceMin: 2600, priceTier: '$$', tagline: 'Tropical palmera paradise, relaxed elegance', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 80, name: 'Sanctuary Doral', neighborhood: 'Doral', address: '9400 NW 41st St, Doral, FL 33178', lat: 25.8093, lng: -80.3458, priceMin: 2520, priceTier: '$$', tagline: 'Sanctuary living, peaceful refuge escape', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 81, name: 'Palma', neighborhood: 'Doral', address: '5250 NW 84th Avenue, Doral, FL 33166', lat: 25.8015, lng: -80.3125, priceMin: 2470, priceTier: '$$', tagline: 'Downtown Doral palma vibes, lush living', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 82, name: 'The Landmark South', neighborhood: 'Doral', address: '6055 NW 105th Ct, Doral, FL 33178', lat: 25.827, lng: -80.366, priceMin: 2580, priceTier: '$$', tagline: 'Landmark living, iconic community hub', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 83, name: 'AMLI 8800', neighborhood: 'Doral', address: '8800 Doral Blvd, Doral, FL 33178', lat: 25.8095, lng: -80.3410, priceMin: 2640, priceTier: '$$', tagline: 'Doral boulevard elegance, modern luxury', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 84, name: 'Gran Vista at Doral', neighborhood: 'Doral', address: '4400 NW 79th Avenue, Doral, FL 33166', lat: 25.8087, lng: -80.3168, priceMin: 2490, priceTier: '$$', tagline: 'Grand vistas, panoramic lifestyle views', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 85, name: 'Cordoba', neighborhood: 'Doral', address: '8150 NW 53rd Street, Doral, FL 33166', lat: 25.8062, lng: -80.3087, priceMin: 2410, priceTier: '$$', tagline: 'Cordoba charm, Spanish colonial spirit', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 86, name: 'Palms of Doral', neighborhood: 'Doral', address: '5611 NW 112th Avenue, Doral, FL 33178', lat: 25.8326, lng: -80.3698, priceMin: 2530, priceTier: '$$', tagline: 'Palms oasis, tropical paradise living', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 87, name: '275 Fontaine Parc', neighborhood: 'Doral', address: '275 Fontainebleau Blvd, Miami, FL 33172', lat: 25.7954, lng: -80.3456, priceMin: 2360, priceTier: '$$', tagline: 'Fontaine park elegance, metropolitan class', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 88, name: 'Elemi at Grove Village', neighborhood: 'Coconut Grove', address: '3335 Thomas Avenue, Miami, FL 33133', lat: 25.7275, lng: -80.2443, priceMin: 2520, priceTier: '$$', tagline: 'Grove village living, tropical sophistication', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 89, name: 'Grove Central Residences', neighborhood: 'Coconut Grove', address: '2800 SW 27th Terrace, Miami, FL 33133', lat: 25.7333, lng: -80.2381, priceMin: 2480, priceTier: '$$', tagline: 'Central grove living, community hub vibes', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 90, name: 'Cascade Link at Douglas', neighborhood: 'Coconut Grove', address: '3050 SW 37th Avenue, Miami, FL 33133', lat: 25.7365, lng: -80.2526, priceMin: 2600, priceTier: '$$', tagline: 'Cascade link living, flowing contemporary', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 91, name: 'Platform 3750', neighborhood: 'Coconut Grove', address: '3750 South Dixie Highway, Miami, FL 33133', lat: 25.7289, lng: -80.2464, priceMin: 2380, priceTier: '$$', tagline: 'Platform living, southern grove exposure', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 92, name: 'Life Time Living Gables Station', neighborhood: 'Coconut Grove', address: '227 South Dixie Highway, Coral Gables, FL 33133', lat: 25.728, lng: -80.2602, priceMin: 2650, priceTier: '$$', tagline: 'Life time wellness living, health sanctuary', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 93, name: 'Core at Link', neighborhood: 'Coconut Grove', address: '3060 SW 37th Avenue, Miami, FL 33133', lat: 25.7368, lng: -80.2524, priceMin: 2410, priceTier: '$$', tagline: 'Core link living, urban authenticity', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 94, name: 'Zoi House Grove', neighborhood: 'Coconut Grove', address: '2900 SW 28th Ln, Miami, FL 33133', lat: 25.7351, lng: -80.2397, priceMin: 2540, priceTier: '$$', tagline: 'Zoi house living, artistic grove character', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 95, name: 'MB Station', neighborhood: 'Coconut Grove', address: '3170 Coral Way, Coral Gables, FL 33145', lat: 25.7315, lng: -80.2486, priceMin: 2450, priceTier: '$$', tagline: 'Metro station living, connected community', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 96, name: 'The Mile Coral Gables', neighborhood: 'Coconut Grove', address: '3622 Coral Way, Miami, FL 33145', lat: 25.7338, lng: -80.2545, priceMin: 2570, priceTier: '$$', tagline: 'The mile lifestyle, destination living', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 97, name: 'Grove Station Tower', neighborhood: 'Coconut Grove', address: '2700 SW 27th Ave, Miami, FL 33133', lat: 25.7397, lng: -80.2386, priceMin: 2610, priceTier: '$$', tagline: 'Grove station tower, transit living hub', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 98, name: 'Modera Douglas Station', neighborhood: 'Coconut Grove', address: '3760 Bird Road, Miami, FL 33146', lat: 25.7329, lng: -80.2529, priceMin: 2490, priceTier: '$$', tagline: 'Modera station living, southeast gables', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 99, name: 'Berkshire Coral Gables', neighborhood: 'Coconut Grove', address: '3880 Bird Rd, Miami, FL 33146', lat: 25.7342, lng: -80.2561, priceMin: 2620, priceTier: '$$', tagline: 'Berkshire living, gables elegance', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 100, name: 'Society Las Olas', neighborhood: 'Las Olas', address: '301 SW 1st Ave, Fort Lauderdale, FL 33301', lat: 26.1156, lng: -80.1481, priceMin: 2700, priceTier: '$$', tagline: 'Las Olas society living, luxury downtown', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 101, name: 'Flow Fort Lauderdale', neighborhood: 'Las Olas', address: '221 SW 1st Ave, Fort Lauderdale, FL 33301', lat: 26.1153, lng: -80.1476, priceMin: 2550, priceTier: '$$', tagline: 'Flow living, organic contemporary design', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 102, name: '10x Riverwalk', neighborhood: 'Las Olas', address: '4 West Las Olas Boulevard, Fort Lauderdale, FL 33301', lat: 26.1173, lng: -80.1437, priceMin: 2600, priceTier: '$$', tagline: 'Riverwalk living, waterfront multiplied', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 103, name: 'Gables Riverwalk', neighborhood: 'Las Olas', address: '333 N New River Drive East, Fort Lauderdale, FL 33301', lat: 26.1191, lng: -80.1432, priceMin: 2480, priceTier: '$$', tagline: 'Gables riverwalk, new river elegance', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 104, name: 'Hanover Riverwalk', neighborhood: 'Las Olas', address: '477 SW 1st Avenue, Fort Lauderdale, FL 33301', lat: 26.1167, lng: -80.1478, priceMin: 2420, priceTier: '$$', tagline: 'Hanover riverwalk, european inspired', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 105, name: 'Veneto Las Olas', neighborhood: 'Las Olas', address: '201 S Federal Hwy, Fort Lauderdale, FL 33301', lat: 26.1147, lng: -80.1393, priceMin: 2670, priceTier: '$$', tagline: 'Veneto italian charm, federal avenue', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 106, name: 'Icon Las Olas', neighborhood: 'Las Olas', address: '500 East Las Olas Blvd, Fort Lauderdale, FL 33301', lat: 26.1186, lng: -80.1437, priceMin: 2580, priceTier: '$$', tagline: 'Icon living, boulevard distinction', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 107, name: 'The Registry', neighborhood: 'Las Olas', address: '419 SE 2nd Street, Fort Lauderdale, FL 33301', lat: 26.1177, lng: -80.1444, priceMin: 2510, priceTier: '$$', tagline: 'Registry prestige, southeast living', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 108, name: 'Coasterra', neighborhood: 'Las Olas', address: '150 SE 3rd Avenue, Fort Lauderdale, FL 33301', lat: 26.1182, lng: -80.1448, priceMin: 2640, priceTier: '$$', tagline: 'Coasterra living, coastal contemporary', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 109, name: 'Alluvion', neighborhood: 'Las Olas', address: '215 North New River Drive East, Fort Lauderdale, FL 33301', lat: 26.1188, lng: -80.1425, priceMin: 2450, priceTier: '$$', tagline: 'Alluvion luxury, new river waterfront', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 110, name: 'Novo Las Olas', neighborhood: 'Las Olas', address: '220 SE 2nd St, Fort Lauderdale, FL 33301', lat: 26.1174, lng: -80.1441, priceMin: 2520, priceTier: '$$', tagline: 'Novo living, new era design', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 111, name: '10x Las Olas Walk', neighborhood: 'Las Olas', address: '106 S Federal Highway, Fort Lauderdale, FL 33301', lat: 26.1167, lng: -80.1386, priceMin: 2490, priceTier: '$$', tagline: 'Las Olas walk, multiplied community', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 112, name: 'Rivr Lofts', neighborhood: 'Las Olas', address: '307 SW 5th St, Fort Lauderdale, FL 33315', lat: 26.1152, lng: -80.1478, priceMin: 2560, priceTier: '$$', tagline: 'Rivr loft living, industrial chic', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  { id: 113, name: 'Harbour at New River', neighborhood: 'Las Olas', address: '401 SW 1st Ave, Fort Lauderdale, FL 33301', lat: 26.1157, lng: -80.1472, priceMin: 2620, priceTier: '$$', tagline: 'Harbour living, new river sanctuary', concession: 'Contact for current offers', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym'], fees: { deposit: 'Contact for pricing', application: 'Contact for pricing', admin: 'Contact for pricing', parking: 'Contact for pricing', misc: 'Contact for pricing' } },
  // Miami Design District
  { id: 36, name: 'The Boulevard', neighborhood: 'Miami Design District', address: '4000 NE 2nd Ave, Miami, FL 33137', lat: 25.8130, lng: -80.1920, priceMin: 3200, priceTier: '$$$', tagline: 'Design district flagship, luxury retail walkable, upscale living', concession: 'TBD', units: ['1B', '2B', '3B'], incomeReq: '3x', creditReq: '>700', guarantor: false, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Concierge', 'Valet', 'Rooftop'], fees: { deposit: 'TBD', application: 'TBD', admin: 'TBD', parking: 'TBD', misc: 'TBD' } },
];

const NEIGHBORHOODS = ['Brickell', 'Downtown', 'Edgewater', 'Midtown', 'Wynwood', 'Miami Design District', 'North Miami', 'North Miami Beach', 'Aventura', 'Hollywood', 'Dania Beach', 'Allapattah', 'Little Havana', 'Doral', 'Coconut Grove', 'Las Olas'];

const Tooltip = ({ text }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <button className="w-5 h-5 rounded-full border border-gray-400 text-gray-600 text-xs flex items-center justify-center hover:border-gray-600" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>i</button>
      {show && <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-xs p-2 rounded shadow-lg z-50">A co-signer on your lease who guarantees payment if you can't pay rent.</div>}
    </div>
  );
};

const FeesDropdown = ({ fees }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border rounded-lg">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition font-semibold text-gray-900">
        <span>Fees & Policies</span>
        <span className={`transition transform ${isOpen ? 'rotate-90' : ''}`}>›</span>
      </button>
      {isOpen && (
        <div className="p-4 space-y-3 border-t">
          <div className="flex justify-between"><span className="text-gray-600">Deposit</span><span className="font-semibold">{fees.deposit}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Application Fee</span><span className="font-semibold">{fees.application}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Admin Fee</span><span className="font-semibold">{fees.admin}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Parking (per car)</span><span className="font-semibold">{fees.parking}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Misc Monthly Fees</span><span className="font-semibold">{fees.misc}</span></div>
        </div>
      )}
    </div>
  );
};

const TalkTodonModal = ({ building, onClose }) => {
  const [step, setStep] = useState('form');
  const [formData, setFormData] = useState({ income: '', credit: '', moveInDate: '', firstName: '', phone: '' });
  const [result, setResult] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const income = parseInt(formData.income);
    const credit = parseInt(formData.credit);
    const incomeMultiplier = parseInt(building.incomeReq);
    const creditReq = parseInt(building.creditReq);
    let status = 'qualify';
    if (income < incomeMultiplier * 1500) status = 'not-fit';
    else if (income < incomeMultiplier * 2000) status = 'close';
    if (credit < creditReq) status = 'not-fit';
    setResult(status);
    setStep('results');
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    console.log('Lead:', { ...formData, building: building.name, status: result });
    setStep('contact');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {step === 'form' && (
          <>
            <h2 className="text-2xl font-bold mb-6">{building.name}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Monthly Income</label>
                <input type="number" required value={formData.income} onChange={(e) => setFormData({ ...formData, income: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g., 5000" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Credit Score</label>
                <input type="number" required value={formData.credit} onChange={(e) => setFormData({ ...formData, credit: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g., 680" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Move-In Date</label>
                <input type="date" required value={formData.moveInDate} onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">Get My Results</button>
            </form>
            <button onClick={onClose} className="mt-4 w-full text-gray-600 py-2 hover:text-gray-900">Close</button>
          </>
        )}
        {step === 'results' && (
          <>
            <div className="text-center mb-6">
              {result === 'qualify' && <><div className="text-5xl mb-3">✓</div><h2 className="text-3xl font-bold text-green-600">You Qualify!</h2></>}
              {result === 'close' && <><div className="text-5xl mb-3">⚠</div><h2 className="text-3xl font-bold text-yellow-600">You're Close</h2></>}
              {result === 'not-fit' && <><div className="text-5xl mb-3">✗</div><h2 className="text-3xl font-bold text-red-600">Not a Fit</h2></>}
            </div>
            <button onClick={() => setStep('contact')} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 mb-3">Continue</button>
            <button onClick={onClose} className="w-full text-gray-600 py-2 hover:text-gray-900">Back</button>
          </>
        )}
        {step === 'contact' && !result && (
          <>
            <h2 className="text-2xl font-bold mb-2">One more thing...</h2>
            <p className="text-gray-600 mb-6">Don will reach out directly with personalized options.</p>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <input type="text" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="First Name" />
              <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="Phone" />
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">Submit</button>
            </form>
          </>
        )}
        {step === 'contact' && result && (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">✓</div>
            <h3 className="text-xl font-bold mb-2">Thanks!</h3>
            <p className="text-gray-600 mb-6">Don will reach out soon.</p>
            <button onClick={onClose} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold">Back to Buildings</button>
          </div>
        )}
      </div>
    </div>
  );
};

const MapComponent = ({ expandedNeighborhoods, selectedBuilding, highlightedBuilding, onPinClick, geocodedBuildings, setSelectedBuilding, setBottomSheetSnapPoint }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Set Mapbox token
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    // Create map instance
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-80.1870, 25.7907],
        zoom: 11,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    } catch (error) {
      console.error('[v0] Map initialization error:', error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Add markers when buildings or selection changes
  useEffect(() => {
    if (!map.current || !geocodedBuildings.length) return;

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    geocodedBuildings.forEach((building: any) => {
      // Create marker element
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.width = '16px';
      el.style.height = '16px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = selectedBuilding?.id === building.id ? '#FF8C00' : '#3B82F6';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';
      el.style.transition = 'all 0.2s';

      el.onclick = (e) => {
        e.stopPropagation();
        setSelectedBuilding(building);
        setBottomSheetSnapPoint(1);
      };

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([building.lng, building.lat])
        .addTo(map.current);

      markersRef.current.push(marker);
    });
  }, [geocodedBuildings, selectedBuilding]);

  return <div ref={mapContainer} className="w-full h-full" />;
};

export default function MiamiApp() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const geocodeCache = useRef(new Map());
  const [geocodedBuildings, setGeocodedBuildings] = useState(BUILDINGS);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [highlightedBuilding, setHighlightedBuilding] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedNeighborhoods, setExpandedNeighborhoods] = useState(['Brickell', 'Downtown']);
  const [bottomSheetSnapPoint, setBottomSheetSnapPoint] = useState(1);
  const bottomSheetRef = useRef(null);
  const touchStartY = useRef(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [infoBuilding, setInfoBuilding] = useState(null);
  const [starredBuildings, setStarredBuildings] = useState<Set<string>>(new Set());
  const [isSavingList, setIsSavingList] = useState(false);
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showMoveWithDonModal, setShowMoveWithDonModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>({ unitSize: [], priceRange: [], moveIn: [] });
  const [visibleBuildingIds, setVisibleBuildingIds] = useState<number[]>(BUILDINGS.map(b => b.id));
  const [selectedBuildingForDetail, setSelectedBuildingForDetail] = useState(null);
  const [mapFilters, setMapFilters] = useState<MapFilterState>({ bedrooms: [], price: [], moveInDate: [] });

  const SNAP_POINTS = {
    0: 'h-5 md:h-0',      // COLLAPSED: 20px (drag handle)
    1: 'h-[400px] md:h-auto',  // DEFAULT: 400px (full card + 40px peek of next)
    2: 'h-[75vh] md:auto' // EXPANDED: 75% screen (scrollable)
  };

  const toggleNeighborhood = (neighborhood) => {
    setExpandedNeighborhoods(prev =>
      prev.includes(neighborhood)
        ? prev.filter(n => n !== neighborhood)
        : [...prev, neighborhood]
    );
  };

  // Helper function to check if a building matches the map filters
  const buildingMatchesMapFilters = (building: any): boolean => {
    // If no filters are active, include all buildings
    if (mapFilters.bedrooms.length === 0 && mapFilters.price.length === 0 && mapFilters.moveInDate.length === 0) {
      return true;
    }

    // Check bedrooms filter
    if (mapFilters.bedrooms.length > 0) {
      const bedroomMatch = mapFilters.bedrooms.some(filter => {
        if (filter === 'Studio') return building.units.includes('Studio');
        if (filter === '1 Bedroom') return building.units.includes('1B');
        if (filter === '2 Bedrooms') return building.units.includes('2B');
        if (filter === '3+ Bedrooms') return building.units.includes('3B');
        return false;
      });
      if (!bedroomMatch) return false;
    }

    // Check price filter
    if (mapFilters.price.length > 0) {
      const priceMatch = mapFilters.price.some(filter => {
        if (filter === '$0-$2,000') return building.priceMin <= 2000;
        if (filter === '$2,000-$4,000') return building.priceMin >= 2000 && building.priceMin < 4000;
        if (filter === '$4,000+') return building.priceMin >= 4000;
        return false;
      });
      if (!priceMatch) return false;
    }

    // Move-in date filter is informational only (would need booking data)
    // For now, we'll include all buildings regardless of move-in date
    return true;
  };

  const filteredBuildings = geocodedBuildings.filter(b => 
    visibleBuildingIds.includes(b.id) &&
    buildingMatchesMapFilters(b) &&
    (b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getFilteredNeighborhoodBuildings = (neighborhood) => {
    return filteredBuildings.filter(b => b.neighborhood === neighborhood);
  };

  const openWhatsApp = (building) => {
    const message = encodeURIComponent(`Hi! I'm interested in ${building.name} at ${building.address}. Can you tell me more?`);
    window.open(`https://wa.me/1234567890?text=${message}`, '_blank');
  };

  const openSMS = () => {
    const message = encodeURIComponent('Hey, this is Don\'s direct cell! You can text me about any building you\'ve been eyeing. I can help out with virtual tours, pricing, and neighborhood info.');
    window.location.href = `sms:+14077657306?body=${message}`;
  };

  const handlePinSubmit = () => {
    if (pinInput === '1234') {
      setIsAgentMode(true);
      setShowPinModal(false);
      setPinInput('');
    } else {
      alert('Incorrect PIN');
      setPinInput('');
    }
  };

  const handleApplyFilters = async (filters: FilterState) => {
    setActiveFilters(filters);
    
    // If no filters selected, show all buildings
    if (filters.unitSize.length === 0 && filters.priceRange.length === 0 && filters.moveIn.length === 0) {
      setVisibleBuildingIds(BUILDINGS.map(b => b.id));
      return;
    }

    const matchingBuildingIds: number[] = [];

    for (const building of geocodedBuildings) {
      try {
        // For now, use building data to match filters (when /api/prices is available, query it)
        let hasMatchingUnits = true;

        // Check unit size filter
        if (filters.unitSize.length > 0) {
          const hasMatchingUnit = filters.unitSize.some(size => {
            if (size === 'Studio') return building.units.includes('Studio');
            if (size === '1BR') return building.units.includes('1B');
            if (size === '2BR') return building.units.includes('2B');
            if (size === '3BR') return building.units.includes('3B');
            return false;
          });
          hasMatchingUnits = hasMatchingUnits && hasMatchingUnit;
        }

        // Check price filter
        if (filters.priceRange.length > 0 && hasMatchingUnits) {
          const hasMatchingPrice = filters.priceRange.some(range => {
            if (range === 'Under $2.5k') return building.priceMin < 2500;
            if (range === '$2.5k-$4k') return building.priceMin >= 2500 && building.priceMin < 4000;
            if (range === '$4k+') return building.priceMin >= 4000;
            return false;
          });
          hasMatchingUnits = hasMatchingUnits && hasMatchingPrice;
        }

        // Move-in date check (all buildings match for now)
        // In future, this would query real availability data

        if (hasMatchingUnits) {
          matchingBuildingIds.push(building.id);
        }
      } catch (err) {
        console.error('Error filtering building', building.id, err);
      }
    }

    setVisibleBuildingIds(matchingBuildingIds);
  };

  // Geocoding useEffect
  useEffect(() => {
    const geocodeAddresses = async () => {
      const MAPBOX_TOKEN = 'pk.eyJ1IjoiZG9ua2FyYWhhbiIsImEiOiJjbXAzamJ1eHIwMGQ2MnJvbHU1MHNwZWlzIn0.8De9qZEqvTRmh8-d-25NfQ';
      const failedAddresses = [];
      let successCount = 0;

      const geocodePromises = BUILDINGS.map(async (building) => {
        // Check cache first
        if (geocodeCache.current.has(building.address)) {
          const cached = geocodeCache.current.get(building.address);
          successCount++;
          return { ...building, lat: cached.lat, lng: cached.lng };
        }

        try {
          const encodedAddress = encodeURIComponent(building.address);
          const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_TOKEN}`;
          
          const response = await fetch(url);
          const data = await response.json();

          if (data.features && data.features.length > 0) {
            const [lng, lat] = data.features[0].geometry.coordinates;
            geocodeCache.current.set(building.address, { lat, lng });
            successCount++;
            return { ...building, lat, lng };
          } else {
            failedAddresses.push(building.address);
            return building; // Keep original coordinates
          }
        } catch (error) {
          failedAddresses.push(building.address);
          return building; // Keep original coordinates
        }
      });

      const geocodedResults = await Promise.all(geocodePromises);
      setGeocodedBuildings(geocodedResults);

      // Log results
      console.log(`[Geocoding] Successfully geocoded ${successCount}/${geocodedResults.length} addresses`);
      if (failedAddresses.length > 0) {
        console.warn(`[Geocoding] Failed to geocode ${failedAddresses.length} addresses:`, failedAddresses);
      }
    };

    geocodeAddresses();
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;

    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
    script.async = true;
    script.onload = () => {
      const linkEl = document.createElement('link');
      linkEl.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      linkEl.rel = 'stylesheet';
      document.head.appendChild(linkEl);

      if (window.mapboxgl && mapContainer.current && !map.current) {
        window.mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        
        map.current = new window.mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [-80.188, 25.76],
          zoom: 11,
        });

        map.current.on('load', () => {
          addPins();
        });

        map.current.on('style.load', () => {
          addPins();
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const handleBottomSheetDrag = (e) => {
    if (e.type === 'touchstart') {
      touchStartY.current = e.touches[0].clientY;
    } else if (e.type === 'touchend' && touchStartY.current) {
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchEndY - touchStartY.current;
      
      if (diff > 30) {
        // Swipe down
        if (bottomSheetSnapPoint > 0) {
          setBottomSheetSnapPoint(bottomSheetSnapPoint - 1);
        }
      } else if (diff < -30) {
        // Swipe up
        if (bottomSheetSnapPoint < 2) {
          setBottomSheetSnapPoint(bottomSheetSnapPoint + 1);
        }
      }
      touchStartY.current = 0;
    }
  };

  const addPins = () => {
    if (!map.current || !window.mapboxgl) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    geocodedBuildings.forEach((building) => {
      const el = document.createElement('div');
      el.style.width = '16px';
      el.style.height = '16px';
      el.style.backgroundColor = selectedBuilding?.id === building.id ? '#FF8C00' : '#3B82F6';
      el.style.borderRadius = '50%';
      el.style.cursor = 'pointer';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      el.style.transition = 'all 0.2s';
      el.onclick = () => {
        setSelectedBuilding(building);
        setBottomSheetSnapPoint(1);
      };

      const marker = new (window as any).mapboxgl.Marker(el)
        .setLngLat([building.lng, building.lat])
        .addTo(map.current);
      
      markersRef.current.push(marker);
    });
  };

  useEffect(() => {
    if (map.current) {
      addPins();
    }
  }, [selectedBuilding, geocodedBuildings]);

  const handleSaveList = async () => {
    if (starredBuildings.size === 0) return;

    setIsSavingList(true);
    try {
      const buildingIds = Array.from(starredBuildings);
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buildingIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to save list');
      }

      const data = await response.json();
      const shareUrl = data.shareUrl;

      // Copy to clipboard
      await copyToClipboard(shareUrl, 'Link copied to clipboard');
    } catch (error) {
      console.error('[v0] Error saving list:', error);
      showToast('Failed to save list', { type: 'error' });
    } finally {
      setIsSavingList(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <MoveWithDon isOpen={showMoveWithDonModal} onClose={() => setShowMoveWithDonModal(false)} />
      
      {/* Desktop Header - Fixed at Top */}
      <div className="hidden md:flex items-center justify-between px-8 h-12 bg-white border-b border-gray-300 flex-shrink-0">
        <h1 className="text-sm font-medium text-gray-900">
          Miami Apartment Guy
          <sup className="text-xs font-normal align-top ml-1 relative" style={{top: '-1px'}}>™</sup>
        </h1>
        <button 
          onClick={() => setShowMoveWithDonModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-full font-medium text-xs transition-colors"
        >
          Move with Don
        </button>
      </div>

      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white md:hidden border-b-[0.5px] border-gray-300">
        <div className="flex items-center justify-between px-4 py-3.5">
          {/* Text Column - Left */}
          <h1 className="text-base font-medium text-[#1a1a1a] tracking-tighter whitespace-nowrap">
            Miami Apartment Guy
            <sup className="text-xs font-normal align-top ml-0.5 relative" style={{top: '2px'}}>™</sup>
          </h1>
          
          {/* Button Column - Right */}
          <div className="flex items-center gap-2">
            {starredBuildings.size > 0 && (
              <button 
                onClick={() => handleSaveList()}
                disabled={isSavingList}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg font-semibold transition-colors shadow-lg text-xs whitespace-nowrap flex-shrink-0"
              >
                Save ({starredBuildings.size})
              </button>
            )}
            <button 
              onClick={() => setShowMoveWithDonModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-lg text-sm whitespace-nowrap flex-shrink-0"
            >
              Move with Don
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex md:hidden flex-col w-full h-full bg-white min-h-screen pt-16">
        <div className={`flex-1 relative w-full h-full overflow-hidden transition-opacity ${bottomSheetSnapPoint === 2 ? 'pointer-events-none opacity-50' : 'pointer-events-auto'}`}>
          <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
          <div className="absolute top-4 left-4 right-4 z-20 flex gap-3 items-center pointer-events-none">
            <input type="text" placeholder="Look up a building..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 px-4 py-3 rounded-full bg-white border border-gray-200 text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 pointer-events-auto" />
            <button
              onClick={() => {
                if (selectedBuilding) {
                  const newStarred = new Set(starredBuildings);
                  if (newStarred.has(String(selectedBuilding.id))) {
                    newStarred.delete(String(selectedBuilding.id));
                  } else {
                    newStarred.add(String(selectedBuilding.id));
                  }
                  setStarredBuildings(newStarred);
                }
              }}
              className="w-12 h-12 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full flex items-center justify-center shadow-md pointer-events-auto transition-colors"
              aria-label={selectedBuilding && starredBuildings.has(String(selectedBuilding.id)) ? 'Unstar building' : 'Star building'}
              title={selectedBuilding ? (starredBuildings.has(String(selectedBuilding.id)) ? 'Unstar current building' : 'Star current building') : 'Click a card to star it'}
            >
              <div className="flex flex-col items-center justify-center">
                <Star className={`h-5 w-5 ${selectedBuilding && starredBuildings.has(String(selectedBuilding.id)) ? 'fill-white' : 'fill-white/50'}`} />
                <span className="text-xs font-bold leading-none mt-0.5">{starredBuildings.size}</span>
              </div>
            </button>
            <button onClick={() => setShowFilterModal(true)} className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-600 pointer-events-auto text-lg font-semibold">⚙</button>
          </div>
        </div>

        <div ref={bottomSheetRef} onTouchStart={handleBottomSheetDrag} onTouchEnd={handleBottomSheetDrag} className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-40 transition-all duration-300 overflow-hidden flex flex-col cursor-grab active:cursor-grabbing ${SNAP_POINTS[bottomSheetSnapPoint]}`}>
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 flex-shrink-0"></div>
          
          {bottomSheetSnapPoint === 0 && <div className="flex-1"></div>}
          
          {bottomSheetSnapPoint === 1 && (
            <div className="overflow-y-auto flex-1 px-4 pb-4">
              {!selectedBuilding ? (
                <div className="pt-2">
                  <div className="space-y-2">
                    {filteredBuildings.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No buildings found</p>
                    ) : (
                      filteredBuildings.map((building) => (
                        <div key={building.id} className="p-3 rounded-lg border border-gray-200 bg-white overflow-hidden" onClick={() => setSelectedBuilding(building)}>
                          <div className="relative w-full h-40 bg-gray-100 rounded-md mb-3 overflow-hidden">
                            <img src={building.images[0]} alt={building.name} className="w-full h-full object-cover" />
                            {/* Star Button - Uses transform to stay visible during momentum scroll */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const newStarred = new Set(starredBuildings);
                                if (newStarred.has(String(building.id))) {
                                  newStarred.delete(String(building.id));
                                } else {
                                  newStarred.add(String(building.id));
                                }
                                setStarredBuildings(newStarred);
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-white transition-colors shadow-md z-40 will-change-transform"
                              style={{
                                transform: 'translate(0, 0)',
                                backfaceVisibility: 'hidden',
                                WebkitBackfaceVisibility: 'hidden',
                              }}
                              aria-label={starredBuildings.has(String(building.id)) ? "Remove from list" : "Add to list"}
                            >
                              <Star
                                className={`h-4 w-4 transition-colors ${
                                  starredBuildings.has(String(building.id))
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-400 hover:text-yellow-400"
                                }`}
                              />
                            </button>
                          </div>
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-semibold text-gray-900 text-sm">{building.name}</h3>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{building.neighborhood}</span>
                          </div>
                          <p className="text-sm text-gray-700 mb-1">{building.tagline || `$${building.priceMin}+/mo`}</p>
                          <p className="text-xs text-gray-500 mb-2">{building.units.join(' | ')}</p>
                          {isAgentMode && <p className="text-xs text-green-600 font-semibold mb-2">Commission: 50% of 1 month</p>}
                          <div className="flex gap-2 mt-2">
                            <button onClick={(e) => { e.stopPropagation(); openSMS(); }} className="md:hidden flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-600">Text Don</button>
                            <button onClick={(e) => { e.stopPropagation(); setInfoBuilding(building); }} className="flex-1 bg-blue-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-600">Info</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="pt-2">
                  <div className="p-3 rounded-lg border border-gray-200 bg-white overflow-hidden">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedBuilding(null); }} className="text-sm text-blue-500 font-semibold mb-2 hover:text-blue-600">← Back</button>
                    <div className="relative w-full h-40 bg-gray-100 rounded-md mb-3 overflow-hidden">
                      <img src={selectedBuilding.images[0]} alt={selectedBuilding.name} className="w-full h-full object-cover" />
                      {/* Star Button - Uses transform to stay visible during momentum scroll */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newStarred = new Set(starredBuildings);
                          if (newStarred.has(String(selectedBuilding.id))) {
                            newStarred.delete(String(selectedBuilding.id));
                          } else {
                            newStarred.add(String(selectedBuilding.id));
                          }
                          setStarredBuildings(newStarred);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-white transition-colors shadow-md z-40 will-change-transform"
                        style={{
                          transform: 'translate(0, 0)',
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                        }}
                        aria-label={starredBuildings.has(String(selectedBuilding.id)) ? "Remove from list" : "Add to list"}
                      >
                        <Star
                          className={`h-4 w-4 transition-colors ${
                            starredBuildings.has(String(selectedBuilding.id))
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-400 hover:text-yellow-400"
                          }`}
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newStarred = new Set(starredBuildings);
                          if (newStarred.has(String(selectedBuilding.id))) {
                            newStarred.delete(String(selectedBuilding.id));
                          } else {
                            newStarred.add(String(selectedBuilding.id));
                          }
                          setStarredBuildings(newStarred);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-white transition-colors shadow-md"
                        aria-label={starredBuildings.has(String(selectedBuilding.id)) ? "Remove from list" : "Add to list"}
                      >
                        <Star
                          className={`h-4 w-4 transition-colors ${
                            starredBuildings.has(String(selectedBuilding.id))
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-400 hover:text-yellow-400"
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{selectedBuilding.name}</h3>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{selectedBuilding.neighborhood}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">{selectedBuilding.tagline || `$${selectedBuilding.priceMin}+/mo`}</p>
                    <p className="text-xs text-gray-500 mb-2">{selectedBuilding.units.join(' | ')}</p>
                    {isAgentMode && <p className="text-xs text-green-600 font-semibold mb-2">Commission: 50% of 1 month</p>}
                    <div className="flex gap-2 mt-2">
                      <button onClick={(e) => { e.stopPropagation(); openSMS(); }} className="md:hidden flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-600">Text Don</button>
                      <button onClick={(e) => { e.stopPropagation(); setInfoBuilding(selectedBuilding); }} className="flex-1 bg-blue-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-600">Info</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {bottomSheetSnapPoint === 2 && (
            <div className="overflow-y-auto flex-1 px-4 pb-4">
              {!selectedBuilding ? (
                <div className="pt-2">
                  <h2 className="text-lg font-semibold mb-4">{searchQuery ? 'Search Results' : 'Neighborhoods'}</h2>
                  {searchQuery ? (
                    <div className="space-y-2">
                      {filteredBuildings.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No buildings found</p>
                      ) : (
                        filteredBuildings.map((building) => (
                          <div key={building.id} onClick={() => setSelectedBuilding(building)} className="p-3 rounded-lg border border-gray-200 bg-white overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
              <img src={building.images[0]} alt={building.name} className="w-full h-40 object-cover rounded-md mb-3" loading="lazy" decoding="async" width={400} height={160} />
                            <div className="flex justify-between items-start mb-1">
                              <h3 className="font-semibold text-gray-900 text-sm">{building.name}</h3>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{building.neighborhood}</span>
                            </div>
                            <p className="text-sm text-gray-700 mb-1">{building.tagline || `$${building.priceMin}+/mo`}</p>
                            <p className="text-xs text-gray-500 mb-2">{building.units.join(' | ')}</p>
                            {isAgentMode && <p className="text-xs text-green-600 font-semibold mb-2">Commission: 50% of 1 month</p>}
                            <div className="flex gap-2 mt-2">
                                <button onClick={(e) => { e.stopPropagation(); openSMS(); }} className="md:hidden flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-600">Text Don</button>
                              <button onClick={(e) => { e.stopPropagation(); setInfoBuilding(building); }} className="flex-1 bg-blue-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-600">Info</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                  <div className="space-y-3">
                    {NEIGHBORHOODS.map((neighborhood) => {
                      const buildings = getFilteredNeighborhoodBuildings(neighborhood);
                      const isExpanded = expandedNeighborhoods.includes(neighborhood);
                      if (buildings.length === 0) return null;
                      return (
                        <div key={neighborhood}>
                          <button onClick={() => toggleNeighborhood(neighborhood)} className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                            <span className="font-semibold text-gray-900 text-sm">{neighborhood} ({buildings.length})</span>
                            <span className={`text-gray-600 transition transform ${isExpanded ? 'rotate-90' : ''}`}>›</span>
                          </button>
                          {isExpanded && (
                            <div className="mt-2 space-y-2 mb-3">
                              {buildings.map((building) => (
                                <div key={building.id} className="p-3 rounded-lg border border-gray-200 bg-white overflow-hidden">
                                  <img src={building.images[0]} alt={building.name} className="w-full h-40 object-cover rounded-md mb-3" loading="lazy" decoding="async" width={400} height={160} />
                                  <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-semibold text-gray-900 text-sm">{building.name}</h3>
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{building.neighborhood}</span>
                                  </div>
                                  <p className="text-sm text-gray-700 mb-1">{building.tagline || `$${building.priceMin}+/mo`}</p>
                                  <p className="text-xs text-gray-500 mb-2">{building.units.join(' | ')}</p>
                                  {isAgentMode && <p className="text-xs text-green-600 font-semibold mb-2">Commission: 50% of 1 month</p>}
                                  <div className="flex gap-2 mt-2">
                              <button onClick={(e) => { e.stopPropagation(); openSMS(); }} className="md:hidden flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-600">Text Don</button>
                                    <button onClick={(e) => { e.stopPropagation(); setInfoBuilding(building); }} className="flex-1 bg-blue-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-600">Info</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  )}
                </div>
          ) : selectedBuilding.name === 'Flow Brickell' ? (
            <FlowBrickellCard onOpenModal={() => setShowModal(true)} />
          ) : (
            <div className="p-4 sm:p-6 lg:p-8">
              <input type="text" placeholder="Look up a building..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">{searchQuery ? 'Search Results' : 'Neighborhoods'}</h2>
                <button onClick={() => isAgentMode ? setIsAgentMode(false) : setShowPinModal(true)} className={`px-3 py-1 rounded-lg text-sm font-medium ${isAgentMode ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{isAgentMode ? 'Agent Mode' : 'Agent?'}</button>
              </div>
                  
                  <button onClick={() => setShowModal(true)} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 mb-4">Talk to Don</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Layout - Zillow Style */}
      <div className="hidden md:flex flex-1 gap-0">
        {/* Map - 55% of width */}
        <div className="flex-1 basis-[55%] relative">
          <MapComponent 
            expandedNeighborhoods={expandedNeighborhoods} 
            selectedBuilding={selectedBuilding} 
            highlightedBuilding={highlightedBuilding}
            onPinClick={setSelectedBuilding} 
            geocodedBuildings={geocodedBuildings}
            setSelectedBuilding={setSelectedBuilding}
            setBottomSheetSnapPoint={setBottomSheetSnapPoint}
          />
          {/* Floating Filter Card */}
          <MapFilterCard 
            filters={mapFilters}
            onFilterChange={setMapFilters}
            onClearAll={() => setMapFilters({ bedrooms: [], price: [], moveInDate: [] })}
          />
        </div>

        {/* Cards Panel - 45% of width */}
        <div className="basis-[45%] bg-white border-l border-gray-200 overflow-hidden flex flex-col">
          {/* Search & Header */}
          <div className="p-5 border-b border-gray-100 bg-white">
            <input 
              type="text" 
              placeholder="Search buildings..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">
                {filteredBuildings.length} Available
              </h3>
              <div className="flex items-center gap-2">
                {starredBuildings.size > 0 && (
                  <button 
                    onClick={() => handleSaveList()}
                    disabled={isSavingList}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Save ({starredBuildings.size})
                  </button>
                )}
                <button 
                  onClick={() => isAgentMode ? setIsAgentMode(false) : setShowPinModal(true)} 
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                    isAgentMode 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {isAgentMode ? '✓ Agent Mode' : 'Agent?'}
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Cards Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredBuildings.map((building) => (
                <DesktopBuildingCard
                  key={building.id}
                  building={building}
                  isHighlighted={selectedBuilding?.id === building.id}
                  isAgentMode={isAgentMode}
                  isStarred={starredBuildings.has(String(building.id))}
                  onHover={setHighlightedBuilding}
                  onClick={setSelectedBuilding}
                  onStar={(b) => {
                    const newStarred = new Set(starredBuildings);
                    if (newStarred.has(String(b.id))) {
                      newStarred.delete(String(b.id));
                    } else {
                      newStarred.add(String(b.id));
                    }
                    setStarredBuildings(newStarred);
                  }}
                  onViewDetails={setSelectedBuildingForDetail}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {showModal && <TalkTodonModal building={selectedBuilding} onClose={() => setShowModal(false)} />}
      
      {/* Info Popup Modal */}
      {infoBuilding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">{infoBuilding.name}</h2>
              <button onClick={() => setInfoBuilding(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600">X</button>
            </div>
            
            {infoBuilding.name === 'Flow Brickell' ? (
              <FlowBrickellCard onOpenModal={() => {}} />
            ) : (
              <div className="p-4 space-y-4">
                <div className="p-4">
                  <ImageCarousel images={infoBuilding.images} />
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-blue-600 font-medium">{infoBuilding.neighborhood}</p>
                  <p className="text-sm text-gray-600 mt-1">{infoBuilding.address}</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Starting at</p>
                  <p className="text-2xl font-bold text-gray-900">${infoBuilding.priceMin}+/mo</p>
                </div>
                
                {isAgentMode && (
                  <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                    <p className="text-xs text-green-600 font-medium">Agent Commission</p>
                    <p className="text-lg font-bold text-green-700">50% of 1 month rent</p>
                  </div>
                )}
                
                <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                  <p className="text-xs text-orange-600 font-medium">Current Offer</p>
                  <p className="text-sm font-semibold text-orange-700">{infoBuilding.concession}</p>
                </div>
                
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-2">Unit Types</p>
                  <div className="flex gap-2 flex-wrap">
                    {infoBuilding.units.map((unit) => (
                      <span key={unit} className="text-xs bg-gray-100 px-3 py-1 rounded-full">{unit}</span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {infoBuilding.amenities.map((a) => (
                      <span key={a} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">{a}</span>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Income Req</p>
                    <p className="font-semibold text-gray-900">{infoBuilding.incomeReq}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Credit Req</p>
                    <p className="font-semibold text-gray-900">{infoBuilding.creditReq}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Guarantor</p>
                    <p className="font-semibold text-gray-900">{infoBuilding.guarantor ? 'Accepted' : 'Not Accepted'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Hold Period</p>
                    <p className="font-semibold text-gray-900">{infoBuilding.holdDays.join('/')} days</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-2">Fees</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Deposit</span><span className="font-medium">{infoBuilding.fees.deposit}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Application</span><span className="font-medium">{infoBuilding.fees.application}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Admin Fee</span><span className="font-medium">{infoBuilding.fees.admin}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Parking</span><span className="font-medium">{infoBuilding.fees.parking}</span></div>
                    {infoBuilding.fees.misc !== 'None' && infoBuilding.fees.misc !== 'TBD' && (
                      <div className="flex justify-between"><span className="text-gray-600">Other</span><span className="font-medium">{infoBuilding.fees.misc}</span></div>
                    )}
                  </div>
                </div>
                
                <button onClick={() => { openWhatsApp(infoBuilding); }} className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 mt-4">Text About This Building</button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* PIN Modal for Agent Mode */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4 text-center">Enter Agent PIN</h2>
            <input 
              type="password" 
              value={pinInput} 
              onChange={(e) => setPinInput(e.target.value)} 
              placeholder="Enter PIN" 
              className="w-full px-4 py-3 border rounded-lg text-center text-2xl tracking-widest mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={4}
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowPinModal(false); setPinInput(''); }} className="flex-1 py-3 rounded-lg border border-gray-300 font-semibold hover:bg-gray-50">Cancel</button>
              <button onClick={handlePinSubmit} className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">Unlock</button>
            </div>
          </div>
        </div>
      )}

      {/* Map Filter Modal */}
      <MapFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
      />

      {/* Full-Screen Building Detail View */}
      {selectedBuildingForDetail && (
        <BuildingDetailView 
          building={selectedBuildingForDetail} 
          onBack={() => setSelectedBuildingForDetail(null)} 
        />
      )}
    </div>
  );
}
