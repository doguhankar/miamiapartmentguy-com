'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { AgentModeControl, useAgentMode } from '@/components/agent-mode-provider';
import { CommissionPill } from '@/components/commission-pill';

import { MapFilterCard, type MapFilterState } from '@/components/map-filter-card';
import { copyToClipboard, showToast } from '@/lib/toast-utils';
import { Heart, Star } from 'lucide-react';
import { useSaveList } from '@/components/save-list-provider';
import { createClient } from '@/lib/supabase/client';
import { buildings as BUILDINGS, type Building } from '@/lib/buildings';
import { getPriceRange } from '@/lib/price-range';
import {
  type AvailableUnit,
  BEDROOM_MIN_BY_FILTER,
  unitMatchesSize,
  unitMatchesBedroomFilter,
  unitMatchesBathroomFilter,
  unitAvailableByDate,
} from '@/lib/unit-filters';

type PricingInventory = Record<string, { units: AvailableUnit[] }>;

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
  const [formData, setFormData] = useState({ income: '', credit: '', apartmentSize: '', moveInDate: '', firstName: '', phone: '' });
  const [errors, setErrors] = useState({ credit: '', apartmentSize: '', moveInDate: '' });
  const [result, setResult] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const today = new Date();
    const todayValue = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const moveInValue = formData.moveInDate ? new Date(`${formData.moveInDate}T00:00:00`) : null;
    const nextErrors = {
      credit: !formData.credit ? 'Credit score is required.' : Number(formData.credit) < 300 || Number(formData.credit) > 850 ? 'Enter a credit score between 300 and 850.' : '',
      apartmentSize: !formData.apartmentSize.trim() ? 'Apartment size is required.' : '',
      moveInDate: !formData.moveInDate ? 'Move-in date is required.' : moveInValue && moveInValue < todayValue ? 'Choose today or a future date.' : '',
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

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
                <input type="number" required min="300" max="850" value={formData.credit} onChange={(e) => setFormData({ ...formData, credit: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF4D8D] focus:outline-none" placeholder="e.g., 680" aria-invalid={Boolean(errors.credit)} aria-describedby={errors.credit ? 'credit-error' : undefined} />
                {errors.credit && <p id="credit-error" className="mt-1 text-sm text-red-400">{errors.credit}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Apartment Size</label>
                <input type="text" required value={formData.apartmentSize} onChange={(e) => setFormData({ ...formData, apartmentSize: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF4D8D] focus:outline-none" placeholder="e.g., 1BR, 2BR, Studio" aria-invalid={Boolean(errors.apartmentSize)} aria-describedby={errors.apartmentSize ? 'apartment-size-error' : undefined} />
                {errors.apartmentSize && <p id="apartment-size-error" className="mt-1 text-sm text-red-400">{errors.apartmentSize}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Move-In Date</label>
                <input type="date" required min={new Date().toISOString().split('T')[0]} value={formData.moveInDate} onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF4D8D] focus:outline-none" aria-invalid={Boolean(errors.moveInDate)} aria-describedby={errors.moveInDate ? 'move-in-date-error' : undefined} />
                {errors.moveInDate && <p id="move-in-date-error" className="mt-1 text-sm text-red-400">{errors.moveInDate}</p>}
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

const MapComponent = ({ expandedNeighborhoods, selectedBuilding, highlightedBuilding, onPinClick, geocodedBuildings, allBuildingIds, setSelectedBuilding, setInfoBuilding: setInfoBuildingFromMap, onMapReady, onPricingDataChange, onImageDataChange, onBuildingsInView }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const popupsRef = useRef([]);
  const markerMetaRef = useRef(new Map());
  const [pricingData, setPricingData] = useState<PricingInventory>({});
  const [buildingImages, setBuildingImages] = useState<Record<string, string[]>>({});
  const buildingCoordinatesKey = useMemo(
    () => geocodedBuildings.map((building: any) => `${building.id}:${building.lng}:${building.lat}`).join('|'),
    [geocodedBuildings],
  );
  const markerBuildings = useMemo(() => geocodedBuildings, [buildingCoordinatesKey]);

  // This component is mounted twice at once (mobile layout + desktop layout,
  // toggled with CSS only), so two instances of this effect are always alive
  // together. It must key off the full, stable building-id list (allBuildingIds,
  // derived from the parent's unfiltered geocodedBuildings state) rather than this
  // component's own `geocodedBuildings` prop, which is the FILTERED list
  // (visibleFilteredBuildings) and is itself derived from pricingInventory — the
  // very state this effect writes back via onPricingDataChange. Keying off the
  // filtered list created a cycle: fetch -> setPricingInventory -> filtered list
  // changes -> refetch, and with two instances racing to overwrite the same
  // parent state, that cycle showed up as buildings/pins continuously flashing.
  // Keying off the full, filter-independent id list breaks the cycle outright:
  // this key never changes as a result of anything this effect produces, so
  // pricing is fetched once per building's actual identity, not once per re-render.
  const buildingIdsKey = useMemo(() => [...allBuildingIds].sort().join(','), [allBuildingIds]);

  useEffect(() => {
    let cancelled = false;

    const loadPricing = async () => {
      const unitsByBuilding = new Map<string, AvailableUnit[]>();

      const supabase = createClient();
      const buildingIds = allBuildingIds;

      // PostgREST caps a single response at 1000 rows by default. The units
      // table has 3500+ rows across all buildings, so an unbounded select
      // silently truncated to the first 1000 rows — dropping every building
      // whose rows fell past that cutoff (e.g. Miami World Tower) entirely
      // out of pricingInventory. Missing pricing/unit data for a building is
      // then (correctly) treated as "no data yet" and shown unfiltered,
      // which is what let those buildings bypass bedroom/price filters.
      // Page through with .range() until a page comes back short.
      const PAGE_SIZE = 1000;
      for (let page = 0; !cancelled; page++) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const { data: unitRows, error } = await supabase
          .from('units')
          .select('building_id, price, beds, baths, sqft, availabilitydate, unittype')
          .in('building_id', buildingIds)
          .not('building_id', 'is', null)
          .range(from, to);

        if (error || !unitRows) break;

        unitRows.forEach((row) => {
          if (!row.building_id) return;
          const key = String(row.building_id);
          const unit: AvailableUnit = {
            floorPlanType: row.unittype ?? undefined,
            beds: row.beds ?? undefined,
            baths: row.baths ?? undefined,
            price: typeof row.price === 'number' ? row.price : undefined,
            sqft: typeof row.sqft === 'number' ? row.sqft : undefined,
            availableDate: row.availabilitydate ?? null,
          };
          const existing = unitsByBuilding.get(key);
          if (existing) existing.push(unit);
          else unitsByBuilding.set(key, [unit]);
        });

        if (unitRows.length < PAGE_SIZE) break;
      }

      const entries: Array<readonly [string, { units: AvailableUnit[] }] | null> = Array.from(
        unitsByBuilding.entries(),
      ).map(([id, units]) => [id, { units }] as const);

      const { data: imageRows } = await supabase
        .from('building_images')
        .select('building_id, image_url, sort_order')
        .in('building_id', allBuildingIds)
        .order('sort_order', { ascending: true });

      if (!cancelled) {
        const nextPricingData = Object.fromEntries(entries.filter(Boolean) as Array<readonly [string, { units: AvailableUnit[] }]>);
        setPricingData(nextPricingData);
        onPricingDataChange?.(nextPricingData);
        const nextBuildingImages = (imageRows ?? []).reduce((images, row) => {
          const buildingId = String(row.building_id);
          if (!images[buildingId]) images[buildingId] = [];
          if (typeof row.image_url === 'string' && row.image_url.trim()) images[buildingId].push(row.image_url);
          return images;
        }, {} as Record<string, string[]>);
        setBuildingImages(nextBuildingImages);
        onImageDataChange?.(nextBuildingImages);
      }
    };

    loadPricing();
    return () => { cancelled = true };
  }, [buildingIdsKey]);

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
        zoom: 12.5,
      });

      // Tune Mapbox's built-in pan inertia without affecting sheet or marker gestures.
      map.current.dragPan.enable({
        deceleration: 1200,
        maxSpeed: 1400,
        linearity: 0.2,
        easing: (t: number) => t * (2 - t),
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
      
      const updateBuildingsInView = () => {
        if (!map.current) return;
        const bounds = map.current.getBounds();
        onBuildingsInView?.(geocodedBuildings.filter((building: any) => (
          building.lat >= bounds.getSouth() &&
          building.lat <= bounds.getNorth() &&
          building.lng >= bounds.getWest() &&
          building.lng <= bounds.getEast()
        )));
      };

      map.current.on('load', updateBuildingsInView);
      map.current.on('moveend', updateBuildingsInView);

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
    // Only bail when the map itself isn't ready. An empty markerBuildings list
    // is a valid filtered state (e.g. no buildings match) and must still fall
    // through to clear any stale markers left over from a previous filter.
    if (!map.current) return;

    // Remove existing markers and popups
    markersRef.current.forEach((marker) => marker.remove());
    popupsRef.current.forEach((popup) => popup.remove());
    markersRef.current = [];
    popupsRef.current = [];
    markerMetaRef.current.clear();

    // Add new markers
    markerBuildings.forEach((building: any) => {
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
        onPinClick(building);
      };

      // Create the target popup card. Keep this DOM-built because Mapbox owns popup placement.
      const popupContent = document.createElement('div');
      popupContent.className = 'popup-content';
      popupContent.style.position = 'relative';
      popupContent.style.width = '250px';
      popupContent.style.padding = '0';
      popupContent.style.overflow = 'hidden';
      popupContent.style.borderRadius = '14px';
      popupContent.style.backgroundColor = '#FFFFFF';
      popupContent.style.boxShadow = '0 12px 30px rgba(15, 23, 42, 0.22)';

      const media = document.createElement('div');
      media.style.position = 'relative';
      media.style.height = '136px';
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

      const closeButton = document.createElement('button');
      closeButton.type = 'button';
      closeButton.setAttribute('aria-label', `Close ${building.name} popup`);
      closeButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '8px';
      closeButton.style.right = '8px';
      closeButton.style.width = '30px';
      closeButton.style.height = '30px';
      closeButton.style.display = 'flex';
      closeButton.style.alignItems = 'center';
      closeButton.style.justifyContent = 'center';
      closeButton.style.padding = '0';
      closeButton.style.border = '0';
      closeButton.style.borderRadius = '50%';
      closeButton.style.background = 'rgba(11, 18, 32, 0.82)';
      closeButton.style.color = '#FFFFFF';
      closeButton.style.cursor = 'pointer';
      closeButton.style.zIndex = '2';
      closeButton.onclick = (event) => {
        event.stopPropagation();
        touchOpened = false;
        popup.remove();
        popupsRef.current = popupsRef.current.filter((openPopup) => openPopup !== popup);
      };
      popupContent.appendChild(closeButton);

      const content = document.createElement('div');
      content.style.padding = '12px 13px 13px';

      const titleRow = document.createElement('div');
      titleRow.style.display = 'flex';
      titleRow.style.alignItems = 'flex-start';
      titleRow.style.justifyContent = 'space-between';
      titleRow.style.gap = '10px';

      const title = document.createElement('div');
      title.textContent = building.name;
      title.style.color = '#172033';
      title.style.fontSize = '17px';
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
      price.style.marginTop = '12px';
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
      button.style.marginTop = '12px';
      button.style.padding = '9px 10px';
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
        popupsRef.current.forEach((openPopup) => {
          if (openPopup !== popup) openPopup.remove();
        });
        popupsRef.current = [popup];
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
      markerMetaRef.current.set(String(building.id), { building, el, media, placeholder, price });
    });
  }, [markerBuildings]);

  // Update marker DOM in place as selection, pricing, or images change.
  useEffect(() => {
    markerMetaRef.current.forEach(({ building, el, media, placeholder, price }) => {
      el.style.backgroundColor = selectedBuilding?.id === building.id ? '#FF8C00' : '#3B82F6';

      const liveUnits = pricingData[building.id]?.units?.filter((unit) => typeof unit.price === 'number' && Number.isFinite(unit.price)) || [];
      const prices = liveUnits.map((unit) => unit.price as number);
      const lowestPrice = prices.length ? Math.min(...prices) : building.priceMin;
      const highestPrice = prices.length ? Math.max(...prices) : building.priceMax || building.priceMin;
      const formatPrice = (value: number) => `$${Math.round(value).toLocaleString()}`;
      price.textContent = lowestPrice === highestPrice
        ? formatPrice(lowestPrice)
        : `${formatPrice(lowestPrice)} – ${formatPrice(highestPrice)}`;

      const imageUrls = buildingImages[String(building.id)]?.length
        ? buildingImages[String(building.id)]
        : (Array.isArray(building.image_urls) ? building.image_urls : building.images);
      const imageUrl = imageUrls?.find((url: unknown) => typeof url === 'string' && url.trim());
      const currentImage = media.querySelector('img');
      if (imageUrl) {
        if (currentImage) {
          if (currentImage.src !== imageUrl) currentImage.src = imageUrl;
        } else {
          const img = document.createElement('img');
          img.src = imageUrl;
          img.alt = `${building.name} building`;
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'cover';
          img.onerror = () => { img.remove(); placeholder.style.display = 'flex'; };
          placeholder.style.display = 'none';
          media.appendChild(img);
        }
      } else if (currentImage) {
        currentImage.remove();
        placeholder.style.display = 'flex';
      }
    });
  }, [selectedBuilding, pricingData, buildingImages]);

  return <div ref={mapContainer} className="w-full h-full" />;
};

export interface AgentMapExperienceConfig {
  /** agent_id value stored on leads submitted through this route */
  agentId: string;
  /** source value stored on leads submitted through this route */
  source: string;
  /** Slack channel that should receive lead notifications for this route */
  slackChannel: string;
  /** Whether this route should skip agent selection in the lead form */
  skipAgentSelection?: boolean;
  /** Display name used in visible agent labels */
  agentDisplayName?: string;
}

export function AgentMapExperience({ agentId, source, slackChannel, skipAgentSelection, agentDisplayName = 'Don' }: AgentMapExperienceConfig) {
  const { hasAccess } = useAgentMode();
  const { savedIds, toggleSave } = useSaveList();
  const heartButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  useEffect(() => {
    const stopHeartEvent = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      const button = event.currentTarget as HTMLButtonElement;
      void toggleSave(button.dataset.buildingId ?? '');
    };
    const buttons = Object.values(heartButtonRefs.current).filter(Boolean) as HTMLButtonElement[];
    buttons.forEach((button) => button.addEventListener('click', stopHeartEvent, { capture: true }));
    return () => buttons.forEach((button) => button.removeEventListener('click', stopHeartEvent, { capture: true }));
  }, [savedIds]);
  const geocodeCache = useRef(new Map());
  const [geocodedBuildings, setGeocodedBuildings] = useState(BUILDINGS);
  // The full, unfiltered building-id set. Geocoding only fills in lat/lng on the
  // same buildings, so this list's identity is stable across that update; it's
  // passed to MapComponent so its pricing fetch keys off "every building" rather
  // than the filtered list, which would reintroduce a fetch/filter feedback loop.
  const allBuildingIds = useMemo(() => geocodedBuildings.map((building) => String(building.id)), [geocodedBuildings]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [highlightedBuilding, setHighlightedBuilding] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedNeighborhoods, setExpandedNeighborhoods] = useState(['Brickell', 'Downtown']);
  const [searchQuery, setSearchQuery] = useState('');
  const [infoBuilding, setInfoBuilding] = useState(null);
  const [starredBuildings, setStarredBuildings] = useState<Set<string>>(new Set());
  const [isSavingList, setIsSavingList] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showMoveWithDonModal, setShowMoveWithDonModal] = useState(false);
  const [mobileBuildingImages, setMobileBuildingImages] = useState<Record<string, string[]>>({});
  const [viewportBuildings, setViewportBuildings] = useState<Building[]>([]);

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
  const [activeFilters, setActiveFilters] = useState<FilterState>({ unitSize: [], priceRange: [], moveIn: [], neighborhoods: [] });
  const [pricingInventory, setPricingInventory] = useState<PricingInventory>({});
  const [buildingImages, setBuildingImages] = useState<Record<string, string[]>>({});
  const [visibleBuildingIds, setVisibleBuildingIds] = useState<number[]>(BUILDINGS.map(b => b.id));

  const [mapFilters, setMapFilters] = useState<MapFilterState>({ bedrooms: [], bathrooms: [], price: [], moveInDate: [], neighborhood: [] });
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);

  // Mobile bottom sheet state: peek is the default view, with sliver and expanded snap points.
  const [mobileSheetState, setMobileSheetState] = useState<'sliver' | 'peek' | 'expanded'>('peek');
  const mobileTouchStartY = useRef(0);
  const mobileTouchCurrentY = useRef(0);
  const mobileTouchDidDrag = useRef(false);
  const mobileSheetEl = useRef<HTMLDivElement>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load filters from URL params on mount
  useEffect(() => {
    const neighborhoods = searchParams.getAll('neighborhood');
    const bedsParam = searchParams.get('beds');
    const priceMinParam = searchParams.get('priceMin');
    const priceMaxParam = searchParams.get('priceMax');
    const moveInDateParam = searchParams.get('moveInDate');

    const newFilters: MapFilterState = { bedrooms: [], bathrooms: [], price: [], moveInDate: [], neighborhood: [] };

    if (neighborhoods.length > 0) {
      newFilters.neighborhood = neighborhoods.map((value) => value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' '));
    }
    if (bedsParam) {
      // bedsParam is the raw filter token written by updateUrlWithFilters below
      // (e.g. 'Studio+', '1+', '2+'). parseInt('4+') silently truncates to the
      // number 4, which doesn't match any key in BEDROOM_MIN_BY_FILTER and made
      // every bedroom filter a permissive no-op once it round-tripped through
      // the URL. Keep it as the original string.
      newFilters.bedrooms = [bedsParam];
    }
    const urlPrice = getPriceRange(priceMinParam, priceMaxParam);
    if (urlPrice.min !== null || urlPrice.max !== null) {
      newFilters.price = [`${urlPrice.min ?? ''}-${urlPrice.max ?? ''}`];
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
    
    newFilters.neighborhood.forEach((neighborhood) => {
      params.append('neighborhood', neighborhood.toLowerCase().replace(/ /g, '-'));
    });
    if (newFilters.bedrooms && newFilters.bedrooms.length > 0) {
      params.set('beds', newFilters.bedrooms[0].toString());
    }
    if (newFilters.price && newFilters.price.length > 0) {
      const selectedPrice = newFilters.price[0];
      const priceRange = getPriceRange(selectedPrice);
      if (priceRange.min !== null) params.set('priceMin', priceRange.min.toString());
      if (priceRange.max !== null) params.set('priceMax', priceRange.max.toString());
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
    setMapFilters({ bedrooms: [], bathrooms: [], price: [], moveInDate: [], neighborhood: [] });
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
  if (mapFilters.neighborhood.length > 0 && !mapFilters.neighborhood.includes(building.neighborhood)) {
    return false;
  }

    // If no filters are active, include all buildings
    if (mapFilters.bedrooms.length === 0 && mapFilters.bathrooms.length === 0 && mapFilters.price.length === 0 && mapFilters.moveInDate.length === 0) {
      return true;
    }

    // Check bedrooms filter. Like the price pre-filter above, this is a coarse
    // check against the building's static unit-type list (e.g. ['Studio','1B','2B']);
    // the precise per-unit check against live pricing data happens downstream. It
    // must never reject a building the unit-level check would still accept, so an
    // unrecognized unit type or filter value passes through rather than excluding.
    if (mapFilters.bedrooms.length > 0) {
      const bedroomMatch = mapFilters.bedrooms.some(filter => {
        const min = BEDROOM_MIN_BY_FILTER[filter];
        if (min === undefined) return true;
        if (!building.units || building.units.length === 0) return true;
        return building.units.some(unitType => {
          if (unitType === 'Studio') return min <= 0;
          const match = unitType.match(/^(\d+)B$/i);
          if (!match) return true;
          return Number(match[1]) >= min;
        });
      });
      if (!bedroomMatch) return false;
    }

    // Check price filter. This is a coarse, building-level pre-filter based on the
    // building's cheapest advertised unit (priceMin); the precise per-unit check
    // against live pricing data happens downstream in visibleFilteredBuildings.
    // It must never reject a building the unit-level check would still accept, so
    // only reject here when the building's floor price is above every requested max.
    if (mapFilters.price.length > 0) {
      const priceMatch = mapFilters.price.some(filter => {
        const range = getPriceRange(filter);
        if (range.max !== null && building.priceMin > range.max) return false;
        return true;
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

  // Keep map markers and both building lists in sync with every active filter.
  // Each active filter category must be satisfied by the SAME unit at once —
  // not by separate units each satisfying one filter in isolation. Checking
  // categories in independent `.some()` passes let a building pass when, say,
  // its cheapest Studio matched the price filter while a different, pricier
  // 1-bed matched the bedroom filter — no single unit actually matched both.
  const visibleFilteredBuildings = useMemo(() => {
    return filteredBuildings.filter((building) => {
      const units = pricingInventory[String(building.id)]?.units ?? [];
      const hasActiveFilter =
        mapFilters.bedrooms.length > 0 ||
        mapFilters.bathrooms.length > 0 ||
        mapFilters.price.length > 0 ||
        mapFilters.moveInDate.length > 0;

      if (!hasActiveFilter || units.length === 0) return true;

      return units.some((unit) => {
        if (mapFilters.bedrooms.length > 0 && !mapFilters.bedrooms.some((filter) => unitMatchesBedroomFilter(unit, filter))) return false;

        if (mapFilters.bathrooms.length > 0 && !mapFilters.bathrooms.some((filter) => unitMatchesBathroomFilter(unit, filter))) return false;

        if (mapFilters.price.length > 0) {
          if (typeof unit.price !== 'number') return false;
          const priceMatch = mapFilters.price.some((filter) => {
            const range = getPriceRange(filter);
            return (range.min === null || unit.price >= range.min) && (range.max === null || unit.price <= range.max);
          });
          if (!priceMatch) return false;
        }

        if (mapFilters.moveInDate.length > 0 && !mapFilters.moveInDate.some((filter) => unitAvailableByDate(unit, filter))) return false;

        return true;
      });
    });
  }, [filteredBuildings, mapFilters, pricingInventory]);

  const apartmentCount = useMemo(() => {
    if (Object.keys(pricingInventory).length === 0) return 0;

    return filteredBuildings.reduce((total, building) => {
      const units = pricingInventory[String(building.id)]?.units ?? [];
      return total + units.filter((unit) => {
        if (activeFilters.unitSize.length > 0 && !activeFilters.unitSize.some((size) => unitMatchesSize(unit, size))) return false;

  if (activeFilters.priceRange.length > 0) {
  const range = getPriceRange(activeFilters.priceRange[0]);
  if ((range.min !== null || range.max !== null) && (typeof unit.price !== 'number' || (range.min !== null && unit.price < range.min) || (range.max !== null && unit.price > range.max))) return false;
  }

        if (activeFilters.moveIn.length > 0 && !unitAvailableByDate(unit, activeFilters.moveIn[0])) return false;
        if (mapFilters.bedrooms.length > 0 && !mapFilters.bedrooms.some((filter) => unitMatchesBedroomFilter(unit, filter))) return false;

  if (mapFilters.price.length > 0) {
  const priceMatch = typeof unit.price === 'number' && mapFilters.price.some((filter) => {
  const range = getPriceRange(filter);
  return (range.min === null || unit.price >= range.min) && (range.max === null || unit.price <= range.max);
  });
  if (!priceMatch) return false;
  }

        if (mapFilters.moveInDate.length > 0 && !unitAvailableByDate(unit, mapFilters.moveInDate[0])) return false;
        return true;
      }).length;
    }, 0);
  }, [activeFilters, filteredBuildings, mapFilters, pricingInventory]);

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

  const handleApplyFilters = async (filters: FilterState) => {
    setActiveFilters(filters);
    
    const matchesNeighborhood = (building: any) => filters.neighborhoods.length === 0 || filters.neighborhoods.includes(building.neighborhood);

    // If no filters selected, show all buildings
    if (filters.unitSize.length === 0 && filters.priceRange.length === 0 && filters.moveIn.length === 0 && filters.neighborhoods.length === 0) {
      setVisibleBuildingIds(BUILDINGS.map(b => b.id));
      return;
    }

    if (Object.keys(pricingInventory).length > 0) {
      const matchingBuildingIds = geocodedBuildings
        .filter((building) => matchesNeighborhood(building) && (pricingInventory[String(building.id)]?.units ?? []).some((unit) => {
          if (filters.unitSize.length > 0 && !filters.unitSize.some((size) => unitMatchesSize(unit, size))) return false;
  const range = filters.priceRange.length > 0 ? getPriceRange(filters.priceRange[0]) : { min: null, max: null };
  if ((range.min !== null || range.max !== null) && (typeof unit.price !== 'number' || (range.min !== null && unit.price < range.min) || (range.max !== null && unit.price > range.max))) return false;
          if (filters.moveIn.length > 0 && !unitAvailableByDate(unit, filters.moveIn[0])) return false;
          return true;
        }))
        .map((building) => building.id);
      setVisibleBuildingIds(matchingBuildingIds);
      return;
    }

    const matchingBuildingIds: number[] = [];

    for (const building of geocodedBuildings) {
      try {
        if (!matchesNeighborhood(building)) continue;
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
          const range = getPriceRange(filters.priceRange[0]);
          const min = range.min ?? 0;
          const max = range.max ?? Number.POSITIVE_INFINITY;
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
      <MoveWithDon
      isOpen={showMoveWithDonModal}
      onClose={() => setShowMoveWithDonModal(false)}
      agentId={agentId}
      source={source}
      slackChannel={slackChannel}
      skipAgentSelection={skipAgentSelection}
      agentDisplayName={agentDisplayName}
    />

      {/* ── MOBILE LAYOUT (< md) ──────────────────────���─────────────────── */}
      <div
        className="md:hidden"
        style={{
          position: 'fixed', inset: 0, overflow: 'hidden', background: '#0B1220',
          overscrollBehavior: 'none',
        }}
      >

  {/* Full-screen map */}
  <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
  <MapComponent
  expandedNeighborhoods={expandedNeighborhoods}
  selectedBuilding={selectedBuilding}
  highlightedBuilding={highlightedBuilding}
  onPinClick={(b) => router.push(`/buildings/${b.id}`)}
                  geocodedBuildings={visibleFilteredBuildings}
                  allBuildingIds={allBuildingIds}
  setSelectedBuilding={setSelectedBuilding}
  setInfoBuilding={setInfoBuilding}
  onMapReady={handleMapReady}
  onPricingDataChange={setPricingInventory}
  onImageDataChange={setBuildingImages}
  onBuildingsInView={setViewportBuildings}
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
          pointerEvents: 'auto',
          zIndex: 30,
          display: 'flex',
            flexDirection: 'column',
            transform: 'translateY(0)',
            transition: 'transform 280ms ease-out, height 280ms ease-out',
          }}
        >
          {/* Full sheet header: the handle and count row share the drag gesture area. */}
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
            style={{ flexShrink: 0, cursor: 'pointer', touchAction: 'none' }}
          >
            <div style={{ padding: '10px 0 4px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 34, height: 4, background: '#E2E4E9', borderRadius: 999 }} />
            </div>

            {mobileSheetState === 'sliver' ? (
              <div style={{ padding: '0 16px 8px', textAlign: 'center', fontSize: 10, color: '#B6BAC4', fontWeight: 500, letterSpacing: '0.02em' }}>
                ▲ Tap to view listings
              </div>
            ) : (
              /* Count line */
              <div style={{ padding: '5px 16px 10px', fontSize: 11.5, color: '#6B7280', fontWeight: 500 }}>
  <b style={{ color: '#0A0F1C', fontWeight: 700 }}>{viewportBuildings.length > 0 ? viewportBuildings.length : filteredBuildings.length}</b>{' '}
  in view
              </div>
            )}
          </div>

          {mobileSheetState !== 'sliver' && (
            <>
              {/* Scrollable content */}
              <div id="mobile-listing-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehaviorY: 'contain', padding: '0 14px max(16px, env(safe-area-inset-bottom))' }}>


            {/* Building cards — v17 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(viewportBuildings.length > 0 ? viewportBuildings : filteredBuildings).map((building) => {
                const imageUrl = mobileBuildingImages[String(building.id)]?.[0] ?? building.images?.[0];
                const imageCount = (mobileBuildingImages[String(building.id)]?.length ?? building.images?.length ?? 0);
                const hasSpecial = !!(building.concession && building.concession !== 'None' && building.concession !== '');
                return (
                  <div
                    key={building.id}
                    onClick={() => router.push(`/buildings/${building.id}`)}
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
                        ref={(button) => { heartButtonRefs.current[String(building.id)] = button; }}
                        data-building-id={String(building.id)}
                        type="button"
                        aria-label={savedIds.includes(String(building.id)) ? 'Remove saved building' : 'Save building'}
                        aria-pressed={savedIds.includes(String(building.id))}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        style={{
                          position: 'absolute', top: 8, right: 8, zIndex: 20,
                          width: 32, height: 32, borderRadius: 999,
                          background: '#FFFFFF', border: 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(10,15,28,0.12)',
                          color: savedIds.includes(String(building.id)) ? '#EF4444' : '#6B7280',
                        }}
                      >
                        <Heart size={16} fill={savedIds.includes(String(building.id)) ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    {/* Card body */}
                    <div style={{ padding: '12px 14px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', fontFamily: 'var(--font-archivo), Archivo, sans-serif', fontWeight: 700, fontSize: 15.5, color: '#0A0F1C', marginBottom: 3 }}>
                        <span>{building.name}</span>
                        <CommissionPill buildingName={building.name} />
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
            onClick={() => setMobileSheetState('sliver')}
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

        {/* Show list FAB — visible when sheet is collapsed */}
        {mobileSheetState === 'sliver' && (
          <button
            onClick={() => setMobileSheetState('peek')}
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
      {/* ── END MOBILE LAYOUT ─────────────────────────����───────────────────── */}

      {/* Desktop Header - Fixed at Top */}
      <div className="hidden md:flex items-center justify-between px-8 py-7 bg-white flex-shrink-0 border-b border-[#E8EBF0]" style={{ height: '74px' }}>
        {/* Wordmark */}
        <Link href="/" style={{ textDecoration: 'none', cursor: 'pointer' }}>
          <div className="flex items-center gap-1">
            <h1 className="font-black tracking-tighter uppercase text-[#0A0F1C]" style={{ fontFamily: 'Archivo', letterSpacing: '-0.02em', fontSize: '20px', lineHeight: '1' }}>
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
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1', height: '100%' }}>Move with {agentDisplayName}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar - Full Width */}
      <div className="hidden md:block w-full bg-white border-b border-[#E8EBF0] sticky z-50" style={{ top: '74px' }}>
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
            onPinClick={(b) => router.push(`/buildings/${b.id}`)}
                            geocodedBuildings={visibleFilteredBuildings}
                  allBuildingIds={allBuildingIds}
            setSelectedBuilding={setSelectedBuilding}
  setInfoBuilding={setInfoBuilding}
  onMapReady={handleMapReady}
            onPricingDataChange={setPricingInventory}
            onImageDataChange={setBuildingImages}
            onBuildingsInView={setViewportBuildings}
          />
        </div>

        {/* Cards Panel - 36% of width */}
        <div className="basis-[36%] bg-[#F8F9FB] border-l border-[#E8EBF0] overflow-hidden flex flex-col" style={{ position: 'relative', zIndex: 20, pointerEvents: 'auto', background: 'white' }}>
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
              {visibleFilteredBuildings.map((building) => (
                <DesktopBuildingCard
                  key={building.id}
                  building={building}
                  supabaseImages={buildingImages[String(building.id)] ?? []}
                  units={pricingInventory[String(building.id)]?.units ?? []}
                  mapFilters={mapFilters}
                  isAgentMode={hasAccess}
                  isHighlighted={selectedBuilding?.id === building.id}
                                  isStarred={starredBuildings.has(String(building.id))}
                  onHover={setHighlightedBuilding}
                  onClick={() => router.push(`/buildings/${building.id}`)}
                  onStar={(b) => {
                    const newStarred = new Set(starredBuildings);
                    if (newStarred.has(String(b.id))) {
                      newStarred.delete(String(b.id));
                    } else {
                      newStarred.add(String(b.id));
                    }
                    setStarredBuildings(newStarred);
                  }}
                                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {showModal && <TalkTodonModal building={selectedBuilding} onClose={() => setShowModal(false)} />}
      


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
