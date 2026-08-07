'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import mapboxgl from 'mapbox-gl';
import { HowItWorksModal } from '@/components/how-it-works-modal';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ImageCarousel } from '@/components/image-carousel';
import { MapFilterModal, type FilterState } from '@/components/map-filter-modal';
import { FlowBrickellCard } from '@/components/flow-brickell-card';
import { MoveWithDon } from '@/components/move-with-don';
import { DesktopBuildingCard } from '@/components/desktop-building-card';

import { BuildingDetailModal } from '@/components/building-detail-modal';
import { MapFilterCard, type MapFilterState } from '@/components/map-filter-card';
import { copyToClipboard, showToast } from '@/lib/toast-utils';
import { Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
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

const MapComponent = ({ expandedNeighborhoods, selectedBuilding, highlightedBuilding, onPinClick, geocodedBuildings, setSelectedBuilding, setBottomSheetSnapPoint, setInfoBuilding: setInfoBuildingFromMap, onMapReady }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const popupsRef = useRef([]);
  const [pricingData, setPricingData] = useState<Record<string, { units: Array<{ floorPlanType?: string; beds?: string | number; price?: number }> }>>({});
  const [buildingImages, setBuildingImages] = useState<Record<string, string[]>>({});

  useEffect(() => {
    let cancelled = false;

    const loadPricing = async () => {
      const entries = await Promise.all(
        geocodedBuildings.map(async (building: any) => {
          try {
            const response = await fetch(`/api/prices/${building.id}`);
            if (!response.ok) return null;
            const data = await response.json();
            return data?.units?.length ? [building.id, { units: data.units }] as const : null;
          } catch {
            return null;
          }
        }),
      );

      const supabase = createClient();
      const { data: imageRows } = await supabase
        .from('building_images')
        .select('building_id, image_url, sort_order')
        .in('building_id', geocodedBuildings.map((building: any) => String(building.id)))
        .order('sort_order', { ascending: true });

      if (!cancelled) {
        setPricingData(Object.fromEntries(entries.filter(Boolean) as Array<readonly [string, { units: Array<{ floorPlanType?: string; beds?: string | number; price?: number }> }]>));
        setBuildingImages((imageRows ?? []).reduce((images, row) => {
          const buildingId = String(row.building_id);
          if (!images[buildingId]) images[buildingId] = [];
          if (typeof row.image_url === 'string' && row.image_url.trim()) images[buildingId].push(row.image_url);
          return images;
        }, {} as Record<string, string[]>));
      }
    };

    loadPricing();
    return () => { cancelled = true };
  }, [geocodedBuildings]);

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

      let touchInteraction = false;
      el.onclick = (e) => {
        e.stopPropagation();
        // iOS Safari synthesizes a click after touchend. The touch handler
        // owns that interaction; avoid changing React state and rebuilding
        // the Mapbox markers while the popup is being opened.
        if (touchInteraction) {
          touchInteraction = false;
          return;
        }
        setSelectedBuilding(building);
        setBottomSheetSnapPoint(1);
      };

      // Create the target popup card. Keep this DOM-built because Mapbox owns popup placement.
      const popupContent = document.createElement('div');
      popupContent.className = 'popup-content';
      popupContent.style.width = '292px';
      popupContent.style.padding = '0';
      popupContent.style.overflow = 'hidden';
      popupContent.style.borderRadius = '14px';
      popupContent.style.backgroundColor = '#FFFFFF';
      popupContent.style.boxShadow = '0 12px 30px rgba(15, 23, 42, 0.22)';

      const media = document.createElement('div');
      media.style.position = 'relative';
      media.style.height = '160px';
      media.style.background = '#E8ECF2';
      media.style.display = 'flex';
      media.style.alignItems = 'center';
      media.style.justifyContent = 'center';
      const imageUrls = buildingImages[String(building.id)]?.length
        ? buildingImages[String(building.id)]
        : (Array.isArray(building.image_urls) ? building.image_urls : building.images);
      const imageUrl = imageUrls?.find((url: unknown) => typeof url === 'string' && url.trim());

      const placeholder = document.createElement('div');
      placeholder.innerHTML = `<svg width="42" height="42" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 21h18M5 21V5.5L12 3l7 2.5V21M8 8h1M15 8h1M8 12h1M15 12h1M8 16h1M15 16h1" stroke="#94A3B8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      placeholder.style.display = imageUrl ? 'none' : 'flex';
      placeholder.style.alignItems = 'center';
      placeholder.style.justifyContent = 'center';
      media.appendChild(placeholder);

      if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = `${building.name} building`;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.onerror = () => {
          img.remove();
          placeholder.style.display = 'flex';
        };
        media.appendChild(img);
      }

      const tourTag = document.createElement('div');
      tourTag.textContent = 'Videos • Virtual tours';
      tourTag.style.position = 'absolute';
      tourTag.style.left = '10px';
      tourTag.style.bottom = '10px';
      tourTag.style.padding = '5px 8px';
      tourTag.style.borderRadius = '5px';
      tourTag.style.background = 'rgba(15, 23, 42, 0.82)';
      tourTag.style.color = '#FFFFFF';
      tourTag.style.fontSize = '10px';
      tourTag.style.fontWeight = '600';
      media.appendChild(tourTag);
      popupContent.appendChild(media);

      const content = document.createElement('div');
      content.style.padding = '14px 15px 15px';

      const titleRow = document.createElement('div');
      titleRow.style.display = 'flex';
      titleRow.style.alignItems = 'flex-start';
      titleRow.style.justifyContent = 'space-between';
      titleRow.style.gap = '10px';

      const title = document.createElement('div');
      title.textContent = building.name;
      title.style.color = '#172033';
      title.style.fontSize = '20px';
      title.style.fontWeight = '750';
      title.style.lineHeight = '1.15';
      titleRow.appendChild(title);

      const saveButton = document.createElement('button');
      saveButton.type = 'button';
      saveButton.setAttribute('aria-label', `Save ${building.name}`);
      saveButton.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.8 8.7c0 5.3-8.8 10.3-8.8 10.3S3.2 14 3.2 8.7A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
      saveButton.style.color = '#172033';
      saveButton.style.background = 'transparent';
      saveButton.style.border = '0';
      saveButton.style.padding = '0';
      saveButton.style.cursor = 'pointer';
      saveButton.onclick = (event) => {
        event.stopPropagation();
        saveButton.style.color = saveButton.style.color === 'rgb(255, 77, 141)' ? '#172033' : '#FF4D8D';
      };
      titleRow.appendChild(saveButton);
      content.appendChild(titleRow);

      const location = document.createElement('div');
      location.textContent = `${building.neighborhood} • Miami, FL`;
      location.style.marginTop = '5px';
      location.style.color = '#7B8799';
      location.style.fontSize = '13px';
      content.appendChild(location);

      const liveUnits = pricingData[building.id]?.units?.filter((unit) => typeof unit.price === 'number' && Number.isFinite(unit.price)) || [];
      const prices = liveUnits.map((unit) => unit.price as number);
      const lowestPrice = prices.length ? Math.min(...prices) : building.priceMin;
      const highestPrice = prices.length ? Math.max(...prices) : building.priceMax || building.priceMin;
      const formatPrice = (value: number) => `$${Math.round(value).toLocaleString()}`;

      const price = document.createElement('div');
      price.textContent = lowestPrice === highestPrice
        ? formatPrice(lowestPrice)
        : `${formatPrice(lowestPrice)} – ${formatPrice(highestPrice)}`;
      price.style.marginTop = '15px';
      price.style.color = '#172033';
      price.style.fontSize = '20px';
      price.style.fontWeight = '750';
      content.appendChild(price);

      const unitLabels = Array.from(new Set(liveUnits.map((unit) => {
        const beds = String(unit.beds ?? unit.floorPlanType ?? '').toLowerCase();
        if (beds.includes('studio') || beds === '0') return 'Studio';
        const match = beds.match(/[1-5]/);
        return match ? `${match[0]} Bed${match[0] === '1' ? '' : 's'}` : '';
      }).filter(Boolean)));
      const unitOrder = ['Studio', '1 Bed', '2 Beds', '3 Beds', '4 Beds', '5 Beds'];
      const sortedUnits = unitLabels.sort((a, b) => unitOrder.indexOf(a) - unitOrder.indexOf(b));
      const unitRange = sortedUnits.length > 1 ? `${sortedUnits[0]} – ${sortedUnits[sortedUnits.length - 1]}` : sortedUnits[0] || building.units.map((unit: string) => unit === '1B' ? '1 Bed' : unit === '2B' ? '2 Beds' : unit === '3B' ? '3 Beds' : unit).join(' – ');
      const units = document.createElement('div');
      units.textContent = unitRange;
      units.style.marginTop = '4px';
      units.style.color = '#7B8799';
      units.style.fontSize = '13px';
      content.appendChild(units);

      const button = document.createElement('button');
      button.textContent = 'View details';
      button.style.width = '100%';
      button.style.marginTop = '15px';
      button.style.padding = '11px 12px';
      button.style.backgroundColor = '#FF4D8D';
      button.style.color = '#FFFFFF';
      button.style.border = 'none';
      button.style.borderRadius = '8px';
      button.style.fontSize = '13px';
      button.style.fontWeight = '700';
      button.style.cursor = 'pointer';
      button.onmouseover = () => button.style.backgroundColor = '#E53A73';
      button.onmouseout = () => button.style.backgroundColor = '#FF4D8D';
      button.onclick = () => {
        setInfoBuildingFromMap(building);
        popup.remove();
      };
      content.appendChild(button);
      popupContent.appendChild(content);

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: [0, -15],
        closeButton: false,
        closeOnClick: false,
        className: 'mag-map-popup',
      }).setDOMContent(popupContent);

      // Track hide timeout and whether this popup was opened by a touch.
      // Touch taps can synthesize mouseenter/mouseleave on iOS Safari; keep
      // touch-opened popups independent from the desktop hover lifecycle.
      let hideTimeout: NodeJS.Timeout | null = null;
      let touchOpened = false;

      const showPopup = () => {
        if (hideTimeout) clearTimeout(hideTimeout);
        popup.setLngLat([building.lng, building.lat]).addTo(map.current);
        
        // Remove Mapbox's default content box so only the card shadow is visible.
        const popupElement = popup.getElement();
        if (popupElement) {
          const popupChrome = popupElement.querySelector('.mapboxgl-popup-content') as HTMLElement | null;
          if (popupChrome) {
            popupChrome.style.padding = '0';
            popupChrome.style.background = 'transparent';
            popupChrome.style.boxShadow = 'none';
          }
          const popupTip = popupElement.querySelector('.mapboxgl-popup-tip') as HTMLElement | null;
          if (popupTip) popupTip.style.display = 'none';
        }

        // Add hover listeners to popup element after it's rendered
        setTimeout(() => {
          const popupElement = popup.getElement();
          if (popupElement) {
            (popupElement as HTMLElement).onmouseenter = () => {
              if (hideTimeout) clearTimeout(hideTimeout);
            };
            (popupElement as HTMLElement).onmouseleave = () => {
              if (!touchOpened) hidePopup();
            };
          }
        }, 0);
      };

      const hidePopup = () => {
        if (touchOpened) return;
        hideTimeout = setTimeout(() => {
          popup.remove();
        }, 200);
      };

      const togglePopupFromTouch = (event: Event) => {
        event.stopPropagation();
        const mapEvent = event as Event & { originalEvent?: Event };
        mapEvent.originalEvent?.stopPropagation();
        if (touchOpened) {
          touchOpened = false;
          popup.remove();
          return;
        }
        touchOpened = true;
        showPopup();
      };

      el.addEventListener('touchstart', (event) => {
        touchInteraction = true;
        event.stopPropagation();
        const mapEvent = event as Event & { originalEvent?: Event };
        mapEvent.originalEvent?.stopPropagation();
      }, { passive: true });
      el.addEventListener('touchend', togglePopupFromTouch, { passive: true });

      // Keep the synthesized iOS click from changing React state after touchend.
      el.addEventListener('click', (event) => {
        if (touchInteraction) {
          touchInteraction = false;
          event.stopPropagation();
        }
      });

      // Add hover handlers to marker
      el.onmouseenter = () => {
        showPopup();
      };

      el.onmouseleave = () => {
        if (!touchOpened) hidePopup();
      };

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([building.lng, building.lat])
        .addTo(map.current);

      markersRef.current.push(marker);
      popupsRef.current.push(popup);
    });
  }, [geocodedBuildings, selectedBuilding, pricingData, buildingImages]);

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
  const [mobileBuildingImages, setMobileBuildingImages] = useState<Record<string, string[]>>({});

  // Auto-open the intake modal once per browser session
  useEffect(() => {
    if (!sessionStorage.getItem('mwd_shown')) {
      setShowMoveWithDonModal(true);
      sessionStorage.setItem('mwd_shown', '1');
    }
  }, []);

  // Fetch building images for mobile cards
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from('building_images')
      .select('building_id, image_url, sort_order')
      .in('building_id', BUILDINGS.map((b: any) => String(b.id)))
      .order('sort_order', { ascending: true })
      .then(({ data: imageRows }) => {
        if (cancelled) return;
        setMobileBuildingImages(
          (imageRows ?? []).reduce((acc, row) => {
            const id = String(row.building_id);
            if (!acc[id]) acc[id] = [];
            if (typeof row.image_url === 'string' && row.image_url.trim()) acc[id].push(row.image_url);
            return acc;
          }, {} as Record<string, string[]>)
        );
      });
    return () => { cancelled = true; };
  }, []);
  const [activeFilters, setActiveFilters] = useState<FilterState>({ unitSize: [], priceRange: [], moveIn: [] });
  const [visibleBuildingIds, setVisibleBuildingIds] = useState<number[]>(BUILDINGS.map(b => b.id));

  const [mapFilters, setMapFilters] = useState<MapFilterState>({ bedrooms: [], price: [], moveInDate: [], neighborhood: null });
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);

  // Mobile bottom sheet state: peek is the default view, with sliver and expanded snap points.
  const [mobileSheetState, setMobileSheetState] = useState<'sliver' | 'peek' | 'expanded'>('peek');
  const [mobileSheetOpen, setMobileSheetOpen] = useState(true);
  const mobileTouchStartY = useRef(0);
  const mobileTouchCurrentY = useRef(0);
  const mobileTouchDidDrag = useRef(false);
  const mobileSheetEl = useRef<HTMLDivElement>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load filters from URL params on mount
  useEffect(() => {
    const neighborhood = searchParams.get('neighborhood');
    const bedsParam = searchParams.get('beds');
    const priceMinParam = searchParams.get('priceMin');
    const priceMaxParam = searchParams.get('priceMax');
    const moveInDateParam = searchParams.get('moveInDate');

    const newFilters: MapFilterState = { bedrooms: [], price: [], moveInDate: [], neighborhood: null };

    if (neighborhood) {
      newFilters.neighborhood = neighborhood.charAt(0).toUpperCase() + neighborhood.slice(1).replace(/-/g, ' ');
    }
    if (bedsParam) {
      newFilters.bedrooms = [parseInt(bedsParam)];
    }
    if (priceMinParam && priceMaxParam) {
      newFilters.price = [{ min: parseInt(priceMinParam), max: parseInt(priceMaxParam) }];
    }
    if (moveInDateParam) {
      newFilters.moveInDate = [moveInDateParam];
    }

    if (Object.values(newFilters).some(v => v !== null && (Array.isArray(v) ? v.length > 0 : false))) {
      setMapFilters(newFilters);
    }
  }, [searchParams]);

  // Update URL when filters change
  const updateUrlWithFilters = (newFilters: MapFilterState) => {
    const params = new URLSearchParams();
    
    if (newFilters.neighborhood) {
      params.set('neighborhood', newFilters.neighborhood.toLowerCase().replace(/ /g, '-'));
    }
    if (newFilters.bedrooms && newFilters.bedrooms.length > 0) {
      params.set('beds', newFilters.bedrooms[0].toString());
    }
    if (newFilters.price && newFilters.price.length > 0) {
      params.set('priceMin', newFilters.price[0].min.toString());
      params.set('priceMax', newFilters.price[0].max.toString());
    }
    if (newFilters.moveInDate && newFilters.moveInDate.length > 0) {
      params.set('moveInDate', newFilters.moveInDate[0]);
    }
    
    const newUrl = `/map${params.toString() ? '?' + params.toString() : ''}`;
    router.push(newUrl);
  };

  // Wrapper for filter changes that also updates URL
  const handleFilterChange = (newFilters: MapFilterState) => {
    setMapFilters(newFilters);
    updateUrlWithFilters(newFilters);
  };

  const handleClearAllFilters = () => {
    setMapFilters({ bedrooms: [], price: [], moveInDate: [], neighborhood: null });
    router.push('/map');
  };

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

  // Mobile bottom sheet touch drag handlers. Each swipe advances one snap point,
  // so dragging down from expanded passes through peek before reaching the sliver.
  const finishMobileTouch = () => {
    const diff = mobileTouchCurrentY.current - mobileTouchStartY.current;
    if (Math.abs(diff) < 40) return;

    const states = ['sliver', 'peek', 'expanded'] as const;
    const currentIndex = states.indexOf(mobileSheetState);
    const nextIndex = diff < 0
      ? Math.min(states.length - 1, currentIndex + 1)
      : Math.max(0, currentIndex - 1);
    setMobileSheetState(states[nextIndex]);
    setMobileSheetOpen(true);
  };

  const handleMobileTouchStart = (e: React.TouchEvent) => {
    mobileTouchStartY.current = e.touches[0].clientY;
    mobileTouchCurrentY.current = e.touches[0].clientY;
    mobileTouchDidDrag.current = false;
  };

  const handleMobileTouchMove = (e: React.TouchEvent) => {
    mobileTouchCurrentY.current = e.touches[0].clientY;
    if (Math.abs(mobileTouchCurrentY.current - mobileTouchStartY.current) > 10) {
      mobileTouchDidDrag.current = true;
    }
  };

  const handleMobileTouchEnd = () => {
    finishMobileTouch();
    window.setTimeout(() => {
      mobileTouchDidDrag.current = false;
    }, 350);
  };

  const handleMobileTouchCancel = () => {
    mobileTouchStartY.current = 0;
    mobileTouchCurrentY.current = 0;
    mobileTouchDidDrag.current = false;
  };

  // Lock body scroll when the sheet is expanded so iOS Safari cannot rubber-band
  // the underlying page. Restore the saved scroll position on collapse/unmount.
  const savedScrollY = useRef(0);
  useEffect(() => {
    if (mobileSheetState === 'expanded') {
      savedScrollY.current = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollY.current}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
    } else {
      if (document.body.style.position === 'fixed') {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, savedScrollY.current);
      }
    }
    return () => {
      if (document.body.style.position === 'fixed') {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, savedScrollY.current);
      }
    };
  }, [mobileSheetState]);

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

        // Check the modal's live dual-handle price range.
        if (filters.priceRange.length > 0 && hasMatchingUnits) {
          const range = filters.priceRange[0].match(/(\d[\d,]*)\s*[-–]\s*(\d[\d,]*)/);
          const min = range ? Number(range[1].replace(/,/g, '')) : 0;
          const max = range ? Number(range[2].replace(/,/g, '')) : Number.POSITIVE_INFINITY;
          hasMatchingUnits = hasMatchingUnits && building.priceMin >= min && building.priceMin <= max;
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
      el.onclick = (event) => {
        event.stopPropagation();
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
    <div className="flex flex-col h-screen bg-[#0B1220]">
      <MoveWithDon isOpen={showMoveWithDonModal} onClose={() => setShowMoveWithDonModal(false)} />

      {/* ── MOBILE LAYOUT (< md) ────────────────────────────────────────── */}
      {/* When expanded, inject a global CSS rule that re-enables pan-y scrolling
          on the list element alone. This is the only reliable way to punch a hole
          through a touch-action:none ancestor in Safari — inline styles on the
          child are silently ignored when the parent carries touch-action:none. */}
      {mobileSheetState === 'expanded' && (
        <style>{`#mobile-listing-scroll { touch-action: pan-y !important; }`}</style>
      )}
      <div
        className="md:hidden"
        style={{
          position: 'fixed', inset: 0, overflow: 'hidden', background: '#0B1220',
          overscrollBehavior: 'none',
          /* Deny-by-default: block every touch on the outer wrapper when expanded.
             The #mobile-listing-scroll rule above re-enables only the list. */
          touchAction: mobileSheetState === 'expanded' ? 'none' : 'auto',
        }}
      >

        {/* Full-screen map */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
          <MapComponent
            expandedNeighborhoods={expandedNeighborhoods}
            selectedBuilding={selectedBuilding}
            highlightedBuilding={highlightedBuilding}
            onPinClick={(b) => { setSelectedBuilding(b); setInfoBuilding(b); }}
            geocodedBuildings={geocodedBuildings}
            setSelectedBuilding={setSelectedBuilding}
            setBottomSheetSnapPoint={setBottomSheetSnapPoint}
            setInfoBuilding={setInfoBuilding}
            onMapReady={handleMapReady}
          />
        </div>

        {/* Floating pill search bar — v17 */}
        <div style={{
          position: 'absolute', top: 'max(20px, env(safe-area-inset-top))',
          left: 16, right: 16, zIndex: 50,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 9,
            background: '#ffffff', borderRadius: 999,
            padding: '11px 16px',
            boxShadow: '0 4px 20px rgba(10,15,28,0.14), 0 1px 2px rgba(10,15,28,0.06)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A7ADB8" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search a place..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1, border: 'none', background: 'transparent',
                fontFamily: 'var(--font-space-grotesk), Space Grotesk, sans-serif',
                fontSize: 13.5, color: '#0A0F1C', outline: 'none',
              }}
            />
          </div>
          <button
            onClick={() => setShowFilterModal(true)}
            style={{
              width: 40, height: 40, borderRadius: 999,
              background: '#0B1220', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(10,15,28,0.24)',
              flexShrink: 0, cursor: 'pointer',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round">
              <line x1="5" y1="4" x2="5" y2="20"/>
              <line x1="12" y1="4" x2="12" y2="20"/>
              <line x1="19" y1="4" x2="19" y2="20"/>
              <circle cx="5" cy="8" r="2" fill="#0B1220" stroke="#ffffff" strokeWidth="1.8"/>
              <circle cx="12" cy="15" r="2" fill="#0B1220" stroke="#ffffff" strokeWidth="1.8"/>
              <circle cx="19" cy="10" r="2" fill="#0B1220" stroke="#ffffff" strokeWidth="1.8"/>
            </svg>
          </button>
        </div>

        {/* Bottom Sheet — v17 */}
        <div
          ref={mobileSheetEl}
          onClick={(e) => {
            if (mobileSheetState === 'sliver') setMobileSheetState('peek');
          }}
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30,
            background: '#ffffff',
            borderRadius: '22px 22px 0 0',
            boxShadow: '0 -8px 30px rgba(10,15,28,0.16)',
            height: mobileSheetState === 'sliver' ? '34px' : mobileSheetState === 'peek' ? '336px' : 'calc(100dvh - 78px)',
            display: 'flex',
            flexDirection: 'column',
            transform: mobileSheetOpen ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 280ms ease-out, height 280ms ease-out',
          }}
        >
          {/* Drag handle: the only region that captures sheet gestures; the list remains scrollable on iOS. */}
          <div
            onClick={() => {
              if (mobileTouchDidDrag.current) {
                mobileTouchDidDrag.current = false;
                return;
              }
              setMobileSheetState(mobileSheetState === 'sliver' ? 'peek' : mobileSheetState === 'expanded' ? 'peek' : 'expanded');
            }}
            onTouchStart={handleMobileTouchStart}
            onTouchMove={handleMobileTouchMove}
            onTouchEnd={handleMobileTouchEnd}
            onTouchCancel={handleMobileTouchCancel}
            style={{ padding: '10px 0 4px', display: 'flex', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', touchAction: 'none' }}
          >
            <div style={{ width: 34, height: 4, background: '#E2E4E9', borderRadius: 999 }} />
          </div>

          {mobileSheetState === 'sliver' ? (
            <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', fontSize: 10, color: '#B6BAC4', fontWeight: 500, letterSpacing: '0.02em', pointerEvents: 'none' }}>
              ▲ Tap to view listings
            </div>
          ) : (
            <>
              {/* Count line */}
              <div style={{ padding: '5px 16px 10px', fontSize: 11.5, color: '#6B7280', fontWeight: 500, flexShrink: 0 }}>
                <b style={{ color: '#0A0F1C', fontWeight: 700 }}>{filteredBuildings.length}</b>{' '}
                apartment{filteredBuildings.length !== 1 ? 's' : ''}{mapFilters.neighborhood ? ` in ${mapFilters.neighborhood}` : ' in South Florida'}
              </div>

              {/* Scrollable content */}
              <div id="mobile-listing-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'contain', padding: '0 14px max(16px, env(safe-area-inset-bottom))' }}>


            {/* Building cards — v17 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredBuildings.map((building) => {
                const imageUrl = mobileBuildingImages[String(building.id)]?.[0] ?? building.images?.[0];
                const imageCount = (mobileBuildingImages[String(building.id)]?.length ?? building.images?.length ?? 0);
                const hasSpecial = !!(building.concession && building.concession !== 'None' && building.concession !== '');
                return (
                  <div
                    key={building.id}
                    onClick={() => { setSelectedBuilding(building); setInfoBuilding(building); }}
                    style={{
                      background: '#ffffff',
                      borderRadius: 16,
                      overflow: 'hidden',
                      boxShadow: '0 1px 2px rgba(10,15,28,0.04), 0 0 0 1px #ECEDF2',
                      cursor: 'pointer',
                    }}
                  >
                    {/* Image area */}
                    <div style={{ position: 'relative', width: '100%', height: 176, background: '#F8F8FA' }}>
                      {imageUrl && (
                        <img
                          src={imageUrl}
                          alt={building.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      )}
                      {/* Neighborhood tag */}
                      <div style={{
                        position: 'absolute', top: 10, left: 10,
                        background: 'rgba(10,15,28,0.75)', color: '#fff',
                        fontFamily: 'var(--font-archivo), Archivo, sans-serif',
                        fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em',
                        padding: '5px 10px', borderRadius: 6,
                        backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
                        textTransform: 'uppercase',
                      }}>
                        {building.neighborhood}
                      </div>
                      {/* Swipe dots — only when multiple images */}
                      {imageCount > 1 && (
                        <div style={{
                          position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
                          display: 'flex', gap: 4,
                          background: 'rgba(10,15,28,0.35)', padding: '5px 8px', borderRadius: 999,
                        }}>
                          {Array.from({ length: Math.min(imageCount, 4) }).map((_, i) => (
                            <div key={i} style={{ width: 4.5, height: 4.5, borderRadius: 999, background: i === 0 ? '#ffffff' : 'rgba(255,255,255,0.45)' }} />
                          ))}
                        </div>
                      )}
                      {/* Heart button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setStarredBuildings(prev => { const n = new Set(prev); n.has(String(building.id)) ? n.delete(String(building.id)) : n.add(String(building.id)); return n; }); }}
                        style={{
                          position: 'absolute', top: 8, right: 8,
                          width: 32, height: 32, borderRadius: 999,
                          background: 'rgba(255,255,255,0.92)', border: 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 15, cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(10,15,28,0.12)',
                          color: starredBuildings.has(String(building.id)) ? '#FF3D82' : '#FF3D82',
                        }}
                      >
                        {starredBuildings.has(String(building.id)) ? '♥' : '♡'}
                      </button>
                    </div>

                    {/* Card body */}
                    <div style={{ padding: '12px 14px 14px' }}>
                      <div style={{ fontFamily: 'var(--font-archivo), Archivo, sans-serif', fontWeight: 700, fontSize: 15.5, color: '#0A0F1C', marginBottom: 3 }}>
                        {building.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 10 }}>
                        {building.address}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontFamily: 'var(--font-archivo), Archivo, sans-serif', fontSize: 15, fontWeight: 700, color: '#0A0F1C' }}>
                          ${building.priceMin?.toLocaleString()}+
                        </div>
                        {hasSpecial && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center',
                            background: '#FFF6E5', color: '#92660B',
                            fontSize: 9.5, fontWeight: 700, letterSpacing: '0.02em',
                            padding: '4px 9px', borderRadius: 6, whiteSpace: 'nowrap',
                            textTransform: 'uppercase',
                          }}>
                            {building.concession}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
            </>
          )}
        </div>

        {mobileSheetState === 'peek' && (
          <button
            onClick={() => setMobileSheetState('expanded')}
            style={{
              position: 'absolute', bottom: 22, left: '50%', transform: 'translateX(-50%)', zIndex: 60,
              background: '#0B1220', color: '#fff', border: 'none',
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '11px 18px', borderRadius: 999,
              fontFamily: 'var(--font-space-grotesk), Space Grotesk, sans-serif',
              fontSize: 12.5, fontWeight: 600,
              boxShadow: '0 8px 24px rgba(10,15,28,0.35)', cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 15l-6-6-6 6" />
            </svg>
            View all listings
          </button>
        )}

        {mobileSheetState === 'expanded' && (
          <button
            onClick={() => setMobileSheetState('peek')}
            style={{
              position: 'absolute', bottom: 22, left: '50%', transform: 'translateX(-50%)', zIndex: 60,
              background: '#0B1220', color: '#fff', border: 'none',
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '11px 18px', borderRadius: 999,
              fontFamily: 'var(--font-space-grotesk), Space Grotesk, sans-serif',
              fontSize: 12.5, fontWeight: 600,
              boxShadow: '0 8px 24px rgba(10,15,28,0.35)', cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
            Collapse
          </button>
        )}

        {/* Show list FAB — visible when sheet is closed */}
        {!mobileSheetOpen && (
          <button
            onClick={() => setMobileSheetOpen(true)}
            style={{
              position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              zIndex: 35, background: '#FF4D8D', color: '#fff',
              border: 'none', borderRadius: 999, padding: '10px 22px',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(255,77,141,0.4)',
              whiteSpace: 'nowrap',
            }}
          >
            Show list
          </button>
        )}
      </div>
      {/* ── END MOBILE LAYOUT ─────────────────────────────────────────────── */}

      {/* Ticker — desktop only */}
      <div className="hidden md:block">
        <Ticker />
      </div>

      {/* Desktop Header - Fixed at Top */}
      <div className="hidden md:flex items-center justify-between px-8 py-7 bg-[#0B1220] flex-shrink-0" style={{ height: '74px' }}>
        {/* Wordmark */}
        <Link href="/" style={{ textDecoration: 'none', cursor: 'pointer' }}>
          <div className="flex items-center gap-1">
            <h1 className="font-black tracking-tighter uppercase text-white" style={{ fontFamily: 'Archivo', letterSpacing: '-0.02em', fontSize: '20px', lineHeight: '1' }}>
              Miami Apartment
            </h1>
            <span className="font-black uppercase" style={{ color: '#FF4D8D', fontFamily: 'Archivo', letterSpacing: '-0.02em', fontSize: '20px', lineHeight: '1' }}>
              Guy<sup className="align-top relative" style={{ fontSize: '11px', top: '-3px', marginLeft: '2px' }}>™</sup>
            </span>
          </div>
        </Link>
        
        {/* Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* How it Works Button */}
          <button 
            onClick={() => setShowHowItWorksModal(true)}
            style={{
              background: 'transparent',
              border: '1px solid #19C6C0',
              color: '#19C6C0',
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(25,198,192,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            How it works
          </button>

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
      </div>

      {/* Filter Bar - Full Width */}
      <div className="hidden md:block w-full bg-[#0B1220] border-b border-[#0B1220] sticky z-50" style={{ top: '74px' }}>
        <MapFilterCard 
          filters={mapFilters}
          onFilterChange={handleFilterChange}
          onClearAll={handleClearAllFilters}
          buildingCount={BUILDINGS.length}
          onNeighborhoodFlyTo={handleNeighborhoodFlyTo}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Desktop Layout - Zillow Style */}
      <div className="hidden md:flex flex-1 gap-0 h-full overflow-hidden">
        {/* Map - 64% of width */}
        <div className="flex-1 basis-[64%] relative h-full w-full">
          <MapComponent 
            expandedNeighborhoods={expandedNeighborhoods} 
            selectedBuilding={selectedBuilding} 
            highlightedBuilding={highlightedBuilding}
            onPinClick={(b) => { setSelectedBuilding(b); setInfoBuilding(b); }}
            geocodedBuildings={geocodedBuildings}
            setSelectedBuilding={setSelectedBuilding}
            setBottomSheetSnapPoint={setBottomSheetSnapPoint}
            setInfoBuilding={setInfoBuilding}
            onMapReady={handleMapReady}
          />
        </div>

        {/* Cards Panel - 36% of width */}
        <div className="basis-[36%] bg-[#0B1220] border-l border-[rgba(255,255,255,0.06)] overflow-hidden flex flex-col">
          {/* Save list button — only visible when buildings are starred */}
          {starredBuildings.size > 0 && (
            <div className="px-4 pt-3 pb-0 flex justify-end">
              <button
                onClick={() => handleSaveList()}
                disabled={isSavingList}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors"
              >
                Save list ({starredBuildings.size})
              </button>
            </div>
          )}

          {/* Scrollable Cards - Vertical Stack — flush from top */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 flex flex-col gap-3">
              {filteredBuildings.map((building) => (
                <DesktopBuildingCard
                  key={building.id}
                  building={building}
                  isHighlighted={selectedBuilding?.id === building.id}
                  isAgentMode={isAgentMode}
                  isStarred={starredBuildings.has(String(building.id))}
                  onHover={setHighlightedBuilding}
                  onClick={(b) => {
                    setSelectedBuilding(b);
                    setInfoBuilding(b);
                  }}
                  onStar={(b) => {
                    const newStarred = new Set(starredBuildings);
                    if (newStarred.has(String(b.id))) {
                      newStarred.delete(String(b.id));
                    } else {
                      newStarred.add(String(b.id));
                    }
                    setStarredBuildings(newStarred);
                  }}
                  onViewDetails={setInfoBuilding}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {showModal && <TalkTodonModal building={selectedBuilding} onClose={() => setShowModal(false)} />}
      
      {/* Info Modal - Quote Drop Stats */}
      {infoBuilding && (
        <BuildingDetailModal
          building={infoBuilding}
          onClose={() => setInfoBuilding(null)}
        />
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
        initialFilters={activeFilters}
      />


      {/* How It Works Modal */}
      <HowItWorksModal
        isOpen={showHowItWorksModal}
        onClose={() => setShowHowItWorksModal(false)}
      />
    </div>
  );
}
