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
import { buildings as BUILDINGS } from '@/lib/buildings';
import { neighborhoodCenters } from '@/lib/neighborhood-centers';
const NEIGHBORHOODS = ['Brickell', 'Downtown', 'Edgewater', 'Midtown', 'Wynwood', 'Miami Design District', 'North Miami', 'North Miami Beach', 'Aventura', 'Hollywood', 'Dania Beach', 'Allapattah', 'Little Havana', 'Doral', 'Coconut Grove', 'Las Olas'];

// Ticker Component
const Ticker = () => (
  <div style={{ background: '#FF4D8D', color: '#fff', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: 700, fontSize: '12.5px', letterSpacing: '.06em', textTransform: 'uppercase', padding: '8px 0' }}>
    <div style={{ display: 'inline-block', animation: 'scroll 32s linear infinite', paddingRight: '100px' }}>
      <span style={{ marginRight: '20px' }}><b style={{ color: '#0B1220' }}>LIVE</b> Flow Brickell — 1BD from $2,841 · 2 months free ✦</span>
      <span style={{ marginRight: '20px' }}><b style={{ color: '#0B1220' }}>LIVE</b> CMPND Downtown — from $1,950 · brand new ✦</span>
      <span style={{ marginRight: '20px' }}><b style={{ color: '#0B1220' }}>LIVE</b> The Dorsey Wynwood — from $2,100 · 6 weeks free ✦</span>
      <span style={{ marginRight: '20px' }}><b style={{ color: '#0B1220' }}>LIVE</b> Parkline — from $2,120 · waived admin ✦</span>
      <span style={{ marginRight: '20px' }}><b style={{ color: '#0B1220' }}>LIVE</b> Flow Brickell — 1BD from $2,841 · 2 months free ✦</span>
      <span style={{ marginRight: '20px' }}><b style={{ color: '#0B1220' }}>LIVE</b> CMPND Downtown — from $1,950 · brand new ✦</span>
    </div>
    <style jsx>{`
      @keyframes scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    `}</style>
  </div>
);

const Tooltip = ({ text }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <button className="w-5 h-5 rounded-full border border-[#19C6C0] text-[#B8C4D4] text-xs flex items-center justify-center hover:border-gray-600" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>i</button>
      {show && <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-[#0B1220] text-white text-xs p-2 rounded shadow-lg z-50">A co-signer on your lease who guarantees payment if you can't pay rent.</div>}
    </div>
  );
};

const FeesDropdown = ({ fees }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border rounded-lg">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-4 bg-[#0F1B30] hover:bg-[#1B2A45] transition font-semibold text-[#F6F8F9]">
        <span>Fees & Policies</span>
        <span className={`transition transform ${isOpen ? 'rotate-90' : ''}`}>›</span>
      </button>
      {isOpen && (
        <div className="p-4 space-y-3 border-t">
          <div className="flex justify-between"><span className="text-[#B8C4D4]">Deposit</span><span className="font-semibold">{fees.deposit}</span></div>
          <div className="flex justify-between"><span className="text-[#B8C4D4]">Application Fee</span><span className="font-semibold">{fees.application}</span></div>
          <div className="flex justify-between"><span className="text-[#B8C4D4]">Admin Fee</span><span className="font-semibold">{fees.admin}</span></div>
          <div className="flex justify-between"><span className="text-[#B8C4D4]">Parking (per car)</span><span className="font-semibold">{fees.parking}</span></div>
          <div className="flex justify-between"><span className="text-[#B8C4D4]">Misc Monthly Fees</span><span className="font-semibold">{fees.misc}</span></div>
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
      <div className="bg-[#0F1B30] rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {step === 'form' && (
          <>
            <h2 className="text-2xl font-bold mb-6">{building.name}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Monthly Income</label>
                <input type="number" required value={formData.income} onChange={(e) => setFormData({ ...formData, income: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF4D8D] focus:outline-none" placeholder="e.g., 5000" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Credit Score</label>
                <input type="number" required value={formData.credit} onChange={(e) => setFormData({ ...formData, credit: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF4D8D] focus:outline-none" placeholder="e.g., 680" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Move-In Date</label>
                <input type="date" required value={formData.moveInDate} onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF4D8D] focus:outline-none" />
              </div>
              <button type="submit" className="w-full bg-[#FF4D8D] text-white py-3 rounded-lg font-semibold hover:bg-[#E53A73]">Get My Results</button>
            </form>
            <button onClick={onClose} className="mt-4 w-full text-[#B8C4D4] py-2 hover:text-[#F6F8F9]">Close</button>
          </>
        )}
        {step === 'results' && (
          <>
            <div className="text-center mb-6">
              {result === 'qualify' && <><div className="text-5xl mb-3">✓</div><h2 className="text-3xl font-bold text-green-600">You Qualify!</h2></>}
              {result === 'close' && <><div className="text-5xl mb-3">⚠</div><h2 className="text-3xl font-bold text-yellow-600">You're Close</h2></>}
              {result === 'not-fit' && <><div className="text-5xl mb-3">✗</div><h2 className="text-3xl font-bold text-red-600">Not a Fit</h2></>}
            </div>
            <button onClick={() => setStep('contact')} className="w-full bg-[#FF4D8D] text-white py-3 rounded-lg font-semibold hover:bg-[#E53A73] mb-3">Continue</button>
            <button onClick={onClose} className="w-full text-[#B8C4D4] py-2 hover:text-[#F6F8F9]">Back</button>
          </>
        )}
        {step === 'contact' && !result && (
          <>
            <h2 className="text-2xl font-bold mb-2">One more thing...</h2>
            <p className="text-[#B8C4D4] mb-6">Don will reach out directly with personalized options.</p>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <input type="text" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="First Name" />
              <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="Phone" />
              <button type="submit" className="w-full bg-[#FF4D8D] text-white py-3 rounded-lg font-semibold hover:bg-[#E53A73]">Submit</button>
            </form>
          </>
        )}
        {step === 'contact' && result && (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">✓</div>
            <h3 className="text-xl font-bold mb-2">Thanks!</h3>
            <p className="text-[#B8C4D4] mb-6">Don will reach out soon.</p>
            <button onClick={onClose} className="w-full bg-[#FF4D8D] text-white py-3 rounded-lg font-semibold">Back to Buildings</button>
          </div>
        )}
      </div>
    </div>
  );
};

const MapComponent = ({ expandedNeighborhoods, selectedBuilding, highlightedBuilding, onPinClick, geocodedBuildings, setSelectedBuilding, setBottomSheetSnapPoint, setSelectedBuildingForDetail, onMapReady }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const popupsRef = useRef([]);

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
      
      // Register map instance with parent
      onMapReady?.(map.current);
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

    // Remove existing markers and popups
    markersRef.current.forEach((marker) => marker.remove());
    popupsRef.current.forEach((popup) => popup.remove());
    markersRef.current = [];
    popupsRef.current = [];

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

      // Create popup content
      const popupContent = document.createElement('div');
      popupContent.className = 'popup-content';
      popupContent.style.padding = '12px';
      popupContent.style.borderRadius = '8px';
      popupContent.style.backgroundColor = 'white';
      popupContent.style.minWidth = '200px';
      
      // Add building image if available
      if (building.images && building.images.length > 0) {
        const img = document.createElement('img');
        img.src = building.images[0];
        img.style.width = '100%';
        img.style.height = '100px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '4px';
        img.style.marginBottom = '8px';
        popupContent.appendChild(img);
      }

      // Add building name
      const name = document.createElement('div');
      name.style.fontSize = '14px';
      name.style.fontWeight = '600';
      name.style.color = '#1f2937';
      name.style.marginBottom = '4px';
      name.textContent = building.name;
      popupContent.appendChild(name);

      // Add neighborhood
      const neighborhood = document.createElement('div');
      neighborhood.style.fontSize = '12px';
      neighborhood.style.color = '#6b7280';
      neighborhood.style.marginBottom = '8px';
      neighborhood.textContent = building.neighborhood;
      popupContent.appendChild(neighborhood);

      // Add price range
      const price = document.createElement('div');
      price.style.fontSize = '13px';
      price.style.fontWeight = '500';
      price.style.color = '#FF4D8D';
      price.style.marginBottom = '12px';
      price.textContent = `$${building.priceMin?.toLocaleString()}/mo`;
      popupContent.appendChild(price);

      // Add view details button
      const button = document.createElement('button');
      button.textContent = 'View Details';
      button.style.width = '100%';
      button.style.padding = '8px 12px';
      button.style.backgroundColor = '#FF4D8D';
      button.style.color = 'white';
      button.style.border = 'none';
      button.style.borderRadius = '4px';
      button.style.fontSize = '12px';
      button.style.fontWeight = '500';
      button.style.cursor = 'pointer';
      button.style.transition = 'background-color 0.2s';
      button.onmouseover = () => button.style.backgroundColor = '#E53A73';
      button.onmouseout = () => button.style.backgroundColor = '#FF4D8D';
      button.onclick = () => {
        setSelectedBuildingForDetail(building);
        popup.remove();
      };
      popupContent.appendChild(button);

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: [0, -15],
        closeButton: false,
        closeOnClick: false,
      }).setDOMContent(popupContent);

      // Track hide timeout to delay hiding on mouse leave
      let hideTimeout: NodeJS.Timeout | null = null;

      const showPopup = () => {
        if (hideTimeout) clearTimeout(hideTimeout);
        popup.setLngLat([building.lng, building.lat]).addTo(map.current);
        
        // Add hover listeners to popup element after it's rendered
        setTimeout(() => {
          const popupElement = document.querySelector('.mapboxgl-popup');
          if (popupElement) {
            (popupElement as HTMLElement).onmouseenter = () => {
              if (hideTimeout) clearTimeout(hideTimeout);
            };
            (popupElement as HTMLElement).onmouseleave = () => {
              hidePopup();
            };
          }
        }, 0);
      };

      const hidePopup = () => {
        hideTimeout = setTimeout(() => {
          popup.remove();
        }, 200);
      };

      // Add hover handlers to marker
      el.onmouseenter = () => {
        showPopup();
      };

      el.onmouseleave = () => {
        hidePopup();
      };

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([building.lng, building.lat])
        .addTo(map.current);

      markersRef.current.push(marker);
      popupsRef.current.push(popup);
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
  const [mapFilters, setMapFilters] = useState<MapFilterState>({ bedrooms: [], price: [], moveInDate: [], neighborhood: null });
  const [mapInstance, setMapInstance] = useState<any>(null);

  // Callback to receive map instance from MapComponent
  const handleMapReady = (mapRef: any) => {
    setMapInstance(mapRef);
  };

  // Handle neighborhood selection with Mapbox flyTo
  const handleNeighborhoodFlyTo = (neighborhood: string) => {
    const center = neighborhoodCenters[neighborhood];
    
    if (!mapInstance) {
      console.log('[v0] mapInstance not yet initialized');
      return;
    }
    
    if (!center) {
      console.log('[v0] no center data found for neighborhood:', neighborhood);
      return;
    }
    
    mapInstance.flyTo({
      center: [center.lng, center.lat],
      zoom: center.zoom,
      duration: 1500
    });
  };

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
    // Check neighborhood filter first
    if (mapFilters.neighborhood !== null && building.neighborhood !== mapFilters.neighborhood) {
      return false;
    }

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
    <div className="flex flex-col h-screen bg-[#0F1B30]">
      <Ticker />
      <MoveWithDon isOpen={showMoveWithDonModal} onClose={() => setShowMoveWithDonModal(false)} />
      
      {/* Desktop Header - Fixed at Top */}
      <div className="hidden md:flex items-center justify-between px-8 py-7 bg-[#0a0e1a] flex-shrink-0" style={{ height: '74px' }}>
        {/* Wordmark */}
        <div className="flex items-center gap-1">
          <h1 className="font-black tracking-tighter uppercase text-white" style={{ fontFamily: 'Archivo', letterSpacing: '-0.02em', fontSize: '30px', lineHeight: '1' }}>
            Miami Apartment
          </h1>
          <span className="font-black uppercase" style={{ color: '#ec4899', fontFamily: 'Archivo', letterSpacing: '-0.02em', fontSize: '30px', lineHeight: '1' }}>
            Guy<sup className="align-top relative" style={{ fontSize: '14px', top: '-4px', marginLeft: '2px' }}>™</sup>
          </span>
        </div>
        
        {/* Text Don Button */}
        <button 
          onClick={() => setShowMoveWithDonModal(true)}
          className="bg-[#ec4899] hover:bg-[#db2777] text-white px-4 py-2 rounded-full font-semibold text-sm transition-colors"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: '1',
            gap: '8px',
            height: '36px'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1', height: '100%' }}>💬</span>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1', height: '100%' }}>Move with Don</span>
        </button>
      </div>

      {/* Filter Bar - Full Width */}
      <div className="hidden md:block w-full bg-[#0a0e1a] border-b border-[#0F1B30] sticky z-50" style={{ top: '74px' }}>
        <MapFilterCard 
          filters={mapFilters}
          onFilterChange={setMapFilters}
          onClearAll={() => setMapFilters({ bedrooms: [], price: [], moveInDate: [], neighborhood: null })}
          buildingCount={BUILDINGS.length}
          onNeighborhoodFlyTo={handleNeighborhoodFlyTo}
        />
      </div>

      {/* Desktop Layout - Zillow Style */}
      <div className="hidden md:flex flex-1 gap-0 h-full overflow-hidden">
        {/* Map - 55% of width */}
        <div className="flex-1 basis-[55%] relative h-full w-full">
          <MapComponent 
            expandedNeighborhoods={expandedNeighborhoods} 
            selectedBuilding={selectedBuilding} 
            highlightedBuilding={highlightedBuilding}
            onPinClick={setSelectedBuilding} 
            geocodedBuildings={geocodedBuildings}
            setSelectedBuilding={setSelectedBuilding}
            setBottomSheetSnapPoint={setBottomSheetSnapPoint}
            setSelectedBuildingForDetail={setSelectedBuildingForDetail}
            onMapReady={handleMapReady}
          />
        </div>

        {/* Cards Panel - 45% of width */}
        <div className="basis-[45%] bg-[#0F1B30] border-l border-[#19C6C0] overflow-hidden flex flex-col">
          {/* Search & Header */}
          <div className="p-5 border-b border-gray-100 bg-[#0F1B30]">
            <input 
              type="text" 
              placeholder="Search buildings..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full px-4 py-2.5 rounded-lg border border-[#19C6C0] text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#FF4D8D]" 
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
                      : 'bg-[#1B2A45] text-[#B8C4D4] hover:bg-gray-200'
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
          <div className="bg-[#0F1B30] rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#0F1B30] p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">{infoBuilding.name}</h2>
              <button onClick={() => setInfoBuilding(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1B2A45] hover:bg-gray-200 text-[#B8C4D4]">X</button>
            </div>
            
            {infoBuilding.name === 'Flow Brickell' ? (
              <FlowBrickellCard onOpenModal={() => {}} />
            ) : (
              <div className="p-4 space-y-4">
                <div className="p-4">
                  <ImageCarousel images={infoBuilding.images} />
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-[#FF4D8D] font-medium">{infoBuilding.neighborhood}</p>
                  <p className="text-sm text-[#B8C4D4] mt-1">{infoBuilding.address}</p>
                </div>
                
                <div className="bg-[#0F1B30] p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Starting at</p>
                  <p className="text-2xl font-bold text-[#F6F8F9]">${infoBuilding.priceMin}+/mo</p>
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
                  <p className="text-sm font-semibold text-[#F6F8F9] mb-2">Unit Types</p>
                  <div className="flex gap-2 flex-wrap">
                    {infoBuilding.units.map((unit) => (
                      <span key={unit} className="text-xs bg-[#1B2A45] px-3 py-1 rounded-full">{unit}</span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-semibold text-[#F6F8F9] mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {infoBuilding.amenities.map((a) => (
                      <span key={a} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">{a}</span>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#0F1B30] p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Income Req</p>
                    <p className="font-semibold text-[#F6F8F9]">{infoBuilding.incomeReq}</p>
                  </div>
                  <div className="bg-[#0F1B30] p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Credit Req</p>
                    <p className="font-semibold text-[#F6F8F9]">{infoBuilding.creditReq}</p>
                  </div>
                  <div className="bg-[#0F1B30] p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Guarantor</p>
                    <p className="font-semibold text-[#F6F8F9]">{infoBuilding.guarantor ? 'Accepted' : 'Not Accepted'}</p>
                  </div>
                  <div className="bg-[#0F1B30] p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Hold Period</p>
                    <p className="font-semibold text-[#F6F8F9]">{infoBuilding.holdDays.join('/')} days</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-semibold text-[#F6F8F9] mb-2">Fees</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-[#B8C4D4]">Deposit</span><span className="font-medium">{infoBuilding.fees.deposit}</span></div>
                    <div className="flex justify-between"><span className="text-[#B8C4D4]">Application</span><span className="font-medium">{infoBuilding.fees.application}</span></div>
                    <div className="flex justify-between"><span className="text-[#B8C4D4]">Admin Fee</span><span className="font-medium">{infoBuilding.fees.admin}</span></div>
                    <div className="flex justify-between"><span className="text-[#B8C4D4]">Parking</span><span className="font-medium">{infoBuilding.fees.parking}</span></div>
                    {infoBuilding.fees.misc !== 'None' && infoBuilding.fees.misc !== 'TBD' && (
                      <div className="flex justify-between"><span className="text-[#B8C4D4]">Other</span><span className="font-medium">{infoBuilding.fees.misc}</span></div>
                    )}
                  </div>
                </div>
                
                <button onClick={() => { openWhatsApp(infoBuilding); }} className="w-full flex items-center justify-center bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 mt-4">Text About This Building</button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* PIN Modal for Agent Mode */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0F1B30] rounded-2xl p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4 text-center">Enter Agent PIN</h2>
            <input 
              type="password" 
              value={pinInput} 
              onChange={(e) => setPinInput(e.target.value)} 
              placeholder="Enter PIN" 
              className="w-full px-4 py-3 border rounded-lg text-center text-2xl tracking-widest mb-4 focus:outline-none focus:ring-2 focus:ring-[#FF4D8D]"
              maxLength={4}
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowPinModal(false); setPinInput(''); }} className="flex-1 py-3 rounded-lg border border-[#19C6C0] font-semibold hover:bg-[#0F1B30]">Cancel</button>
              <button onClick={handlePinSubmit} className="flex-1 py-3 rounded-lg bg-[#FF4D8D] text-white font-semibold hover:bg-[#E53A73]">Unlock</button>
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
