'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

const BUILDINGS = [
  { id: 1, name: 'Flow Brickell', neighborhood: 'Brickell', address: '123 Main St', priceMin: 2790, concession: '1 month free on select units', incomeReq: '30x rent', creditReq: '650+', guarantor: true, holdDays: [1, 3], units: ['1BR', '2BR', '3BR'], amenities: ['Pool', 'Gym', 'Parking'], fees: { app: 75, admin: 100 }, images: ['/building1.jpg'] },
  { id: 2, name: 'Moderna Riverside', neighborhood: 'Brickell', address: '456 Oak Ave', priceMin: 2500, concession: '50% off first 60 days', incomeReq: '30x rent', creditReq: '650+', guarantor: true, holdDays: [1, 3], units: ['1BR', '2BR'], amenities: ['Gym', 'Parking'], fees: { app: 75, admin: 100 }, images: ['/building2.jpg'] },
  { id: 3, name: 'Maizon', neighborhood: 'Brickell', address: '789 Pine Rd', priceMin: 2235, concession: '$500 move-in credit', incomeReq: '30x rent', creditReq: '650+', guarantor: false, holdDays: [1, 3], units: ['Studio', '1BR'], amenities: ['Pool'], fees: { app: 50, admin: 75 }, images: ['/building3.jpg'] },
  { id: 4, name: 'Solitair', neighborhood: 'Brickell', address: '321 Elm St', priceMin: 2654, concession: 'Free first month + parking', incomeReq: '30x rent', creditReq: '650+', guarantor: true, holdDays: [1, 3], units: ['1BR', '2BR', '3BR'], amenities: ['Pool', 'Gym', 'Concierge'], fees: { app: 75, admin: 100 }, images: ['/building4.jpg'] },
  { id: 5, name: 'Miro Brickell', neighborhood: 'Brickell', address: '654 Maple Ln', priceMin: 2425, concession: '2 weeks free', incomeReq: '30x rent', creditReq: '650+', guarantor: true, holdDays: [1, 3], units: ['1BR', '2BR'], amenities: ['Gym', 'Parking'], fees: { app: 75, admin: 100 }, images: ['/building5.jpg'] },
  { id: 6, name: 'CMPND', neighborhood: 'Downtown', address: '100 First Ave', priceMin: 1950, concession: 'Two months free on select units', incomeReq: '30x rent', creditReq: '650+', guarantor: false, holdDays: [1, 3, 5], units: ['Studio', '1BR'], amenities: ['Pool'], fees: { app: 50, admin: 75 }, images: ['/building6.jpg'] },
  { id: 7, name: 'Miami World Tower', neighborhood: 'Downtown', address: '201 Second Ave', priceMin: 2410, concession: 'Up to two months free on select apartments', incomeReq: '30x rent', creditReq: '650+', guarantor: true, holdDays: [1, 3], units: ['1BR', '2BR', '3BR'], amenities: ['Pool', 'Gym', 'Concierge'], fees: { app: 75, admin: 100 }, images: ['/building7.jpg'] },
];

const NEIGHBORHOODS = ['Brickell', 'Downtown', 'Midtown', 'Edgewater', 'Wynwood'];

const ImageCarousel = ({ images }) => {
  const [current, setCurrent] = useState(0);
  const next = () => setCurrent((current + 1) % images.length);
  const prev = () => setCurrent((current - 1 + images.length) % images.length);
  
  if (!images?.length) return <div className="w-full h-40 bg-gray-200 rounded-lg" />;
  
  return (
    <div className="relative group w-full h-40 bg-gray-200 rounded-lg overflow-hidden">
      {images[current] && <Image src={images[current]} alt="Building" fill className="object-cover" />}
      {images.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition z-10">←</button>
          <button onClick={next} className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition z-10">→</button>
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">{current + 1}/{images.length}</div>
        </>
      )}
    </div>
  );
};

const Tooltip = () => <span className="text-xs text-gray-500 ml-1">ⓘ</span>;

const FeesDropdown = ({ fees }) => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="w-full text-left font-semibold text-gray-900 flex items-center justify-between p-2 hover:bg-gray-50 rounded">
        Fees
        <span className={`transform transition ${open ? 'rotate-90' : ''}`}>›</span>
      </button>
      {open && <div className="p-3 bg-gray-50 rounded space-y-1 text-sm">{Object.entries(fees).map(([k, v]) => <div key={k} className="flex justify-between"><span className="text-gray-600">{k}:</span><span className="font-semibold">${v}</span></div>)}</div>}
    </div>
  );
};

const TalkTodonModal = ({ building, onClose }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-lg max-w-sm">
      <h2 className="text-xl font-bold mb-4">Talk to Don</h2>
      <p className="text-gray-600 mb-4">Get connected with Don about {building?.name}</p>
      <button onClick={onClose} className="w-full bg-blue-600 text-white py-2 rounded-lg">Close</button>
    </div>
  </div>
);

export default function MiamiApp() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const bottomSheetRef = useRef(null);
  const touchStartY = useRef(0);

  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedNeighborhoods, setExpandedNeighborhoods] = useState([]);
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);

  const toggleNeighborhood = (neighborhood) => {
    setExpandedNeighborhoods(prev => 
      prev.includes(neighborhood) 
        ? prev.filter(n => n !== neighborhood)
        : [...prev, neighborhood]
    );
  };

  const getNeighborhoodBuildings = (neighborhood) => {
    return BUILDINGS.filter(b => b.neighborhood === neighborhood);
  };

  const handleBottomSheetDrag = (e) => {
    if (e.type === 'touchstart') {
      touchStartY.current = e.touches[0].clientY;
    } else if (e.type === 'touchend' && touchStartY.current) {
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchEndY - touchStartY.current;
      
      if (diff > 30 && isBottomSheetExpanded) {
        setIsBottomSheetExpanded(false);
      } else if (diff < -30 && !isBottomSheetExpanded) {
        setIsBottomSheetExpanded(true);
      }
      touchStartY.current = 0;
    }
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
    script.async = true;

    script.onload = () => {
      const linkEl = document.createElement('link');
      linkEl.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      linkEl.rel = 'stylesheet';
      document.head.appendChild(linkEl);

      setTimeout(() => {
        if (window.mapboxgl && mapContainer.current) {
          window.mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
          
          map.current = new window.mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/light-v11',
            center: [-80.188, 25.765],
            zoom: 13,
          });

          map.current.on('load', () => {
            addPins();
          });
        }
      }, 100);
    };

    document.body.appendChild(script);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const addPins = () => {
    if (!map.current) return;
    
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    BUILDINGS.forEach(building => {
      const el = document.createElement('div');
      el.className = 'w-6 h-6 bg-blue-600 rounded-full border-2 border-white cursor-pointer hover:bg-blue-700';
      
      el.onclick = () => {
        setSelectedBuilding(building);
        setIsBottomSheetExpanded(true);
      };

      const marker = new window.mapboxgl.Marker(el)
        .setLngLat([building.coords?.lng || -80.188, building.coords?.lat || 25.765])
        .addTo(map.current);
      
      markersRef.current.push(marker);
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
          <h1 className="text-xl font-bold">Miami Apartment Guy</h1>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex md:hidden flex-col w-full h-full relative bg-white">
        <div className={`flex-1 relative w-full overflow-hidden min-h-0 transition-opacity mt-16 ${isBottomSheetExpanded ? 'pointer-events-none opacity-50' : 'pointer-events-auto'}`}>
          <div ref={mapContainer} className="w-full h-full" />
          <div className="absolute top-4 left-4 right-4 z-20 flex gap-3 items-center pointer-events-none">
            <input type="text" placeholder="Search buildings, price..." className="flex-1 px-4 py-3 rounded-full bg-white border border-gray-200 text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 pointer-events-auto" />
            <button className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-700 pointer-events-auto">⚙</button>
          </div>
        </div>

        <div ref={bottomSheetRef} onTouchStart={handleBottomSheetDrag} onTouchEnd={handleBottomSheetDrag} className={`fixed left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-40 transition-all duration-300 overflow-hidden flex flex-col cursor-grab active:cursor-grabbing ${isBottomSheetExpanded ? 'bottom-0 h-[65vh]' : 'bottom-0 h-20'}`}>
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 flex-shrink-0"></div>
          
          {!isBottomSheetExpanded && !selectedBuilding && <div className="px-4 pt-2 pb-4"><h2 className="text-sm font-semibold text-gray-900">Swipe up to browse neighborhoods</h2></div>}
          {!isBottomSheetExpanded && selectedBuilding && <div className="px-4 pt-2 pb-4"><h2 className="text-sm font-semibold text-gray-900 truncate">{selectedBuilding.name}</h2><p className="text-xs text-gray-600">${selectedBuilding.priceMin}+/mo</p></div>}

          {isBottomSheetExpanded && (
            <div className="overflow-y-auto flex-1 px-4 pb-4">
              {!selectedBuilding ? (
                <div className="pt-2">
                  <h2 className="text-lg font-semibold mb-4">Neighborhoods</h2>
                  <div className="space-y-3">
                    {NEIGHBORHOODS.map((neighborhood) => {
                      const buildings = getNeighborhoodBuildings(neighborhood);
                      const isExpanded = expandedNeighborhoods.includes(neighborhood);
                      return (
                        <div key={neighborhood}>
                          <button onClick={() => toggleNeighborhood(neighborhood)} className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                            <span className="font-semibold text-gray-900 text-sm">{neighborhood} ({buildings.length})</span>
                            <span className={`text-gray-600 transition transform ${isExpanded ? 'rotate-90' : ''}`}>›</span>
                          </button>
                          {isExpanded && (
                            <div className="mt-2 space-y-2 mb-3">
                              {buildings.map((building) => (
                                <div key={building.id} onClick={() => { setSelectedBuilding(building); setIsBottomSheetExpanded(true); }} className="p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition bg-white">
                                  <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-semibold text-gray-900 text-sm">{building.name}</h3>
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{building.neighborhood}</span>
                                  </div>
                                  <p className="text-sm font-bold text-gray-900">${building.priceMin}+/mo</p>
                                  <p className="text-xs text-gray-600 mt-1">{building.concession}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="pt-2">
                  <button onClick={() => setSelectedBuilding(null)} className="text-blue-600 hover:text-blue-700 text-sm mb-3 font-semibold">← Back</button>
                  <ImageCarousel images={selectedBuilding.images} />
                  <h1 className="text-2xl font-bold mt-4 mb-2">{selectedBuilding.name}</h1>
                  <div className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-medium mb-4">{selectedBuilding.neighborhood}</div>
                  <p className="text-gray-600 text-sm mb-6">📍 {selectedBuilding.address}</p>
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg"><p className="text-2xl font-bold text-gray-900">${selectedBuilding.priceMin}+/mo</p></div>
                  <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-500 rounded-lg"><p className="text-sm font-semibold text-blue-900">Current Offer</p><p className="text-lg font-bold text-blue-600">{selectedBuilding.concession}</p></div>
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg"><p className="text-sm text-gray-600 mb-1">Income Requirement</p><p className="font-semibold text-gray-900">{selectedBuilding.incomeReq}</p></div>
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg"><p className="text-sm text-gray-600 mb-1">Credit Requirement</p><p className="font-semibold text-gray-900">{selectedBuilding.creditReq}</p></div>
                  <div className="mb-4"><p className="text-sm font-semibold text-gray-900 mb-2">Bedrooms</p><div className="flex gap-2 flex-wrap">{selectedBuilding.units.map((unit) => (<span key={unit} className="text-xs bg-gray-100 px-3 py-1 rounded">{unit}</span>))}</div></div>
                  <div className="mb-4"><p className="text-sm font-semibold text-gray-900 mb-2">Amenities</p><div className="flex flex-wrap gap-2">{selectedBuilding.amenities.map((a) => (<span key={a} className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded">{a}</span>))}</div></div>
                  <button onClick={() => setShowModal(true)} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 mb-4">Talk to Don</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex flex-1 mt-16">
        <div className="flex-1 overflow-hidden">
          <div ref={mapContainer} className="w-full h-full" />
        </div>
        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Neighborhoods</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {NEIGHBORHOODS.map((neighborhood) => {
              const buildings = getNeighborhoodBuildings(neighborhood);
              const isExpanded = expandedNeighborhoods.includes(neighborhood);
              return (
                <div key={neighborhood}>
                  <button onClick={() => toggleNeighborhood(neighborhood)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-100 transition">
                    <span className="font-semibold text-gray-900">{neighborhood} ({buildings.length})</span>
                    <span className={`transition transform ${isExpanded ? 'rotate-90' : ''}`}>›</span>
                  </button>
                  {isExpanded && buildings.map((building) => (
                    <div key={building.id} onClick={() => setSelectedBuilding(building)} className="px-4 py-3 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition">
                      <h3 className="font-semibold text-gray-900">{building.name}</h3>
                      <p className="text-sm text-blue-600 font-bold">${building.priceMin}+/mo</p>
                      <p className="text-xs text-gray-600">{building.concession}</p>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedBuilding && !isBottomSheetExpanded && (
        <div className="hidden md:block absolute right-0 bottom-0 top-16 w-96 bg-white border-l border-gray-200 p-6 overflow-y-auto">
          <button onClick={() => setSelectedBuilding(null)} className="text-blue-600 hover:text-blue-700 text-sm mb-4 font-semibold">← Back</button>
          <ImageCarousel images={selectedBuilding.images} />
          <h1 className="text-2xl font-bold mt-4 mb-2">{selectedBuilding.name}</h1>
          <div className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-medium mb-4">{selectedBuilding.neighborhood}</div>
          <p className="text-gray-600 text-sm mb-6">📍 {selectedBuilding.address}</p>
          <div className="mb-4 p-4 bg-gray-50 rounded-lg"><p className="text-2xl font-bold text-gray-900">${selectedBuilding.priceMin}+/mo</p></div>
          <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-500 rounded-lg"><p className="text-sm font-semibold text-blue-900">Current Offer</p><p className="text-lg font-bold text-blue-600">{selectedBuilding.concession}</p></div>
          <div className="mb-4 p-4 bg-gray-50 rounded-lg"><p className="text-sm text-gray-600 mb-1">Income Requirement</p><p className="font-semibold text-gray-900">{selectedBuilding.incomeReq}</p></div>
          <div className="mb-4 p-4 bg-gray-50 rounded-lg"><p className="text-sm text-gray-600 mb-1">Credit Requirement</p><p className="font-semibold text-gray-900">{selectedBuilding.creditReq}</p></div>
          <div className="mb-4"><p className="text-sm font-semibold text-gray-900 mb-2">Bedrooms</p><div className="flex gap-2 flex-wrap">{selectedBuilding.units.map((unit) => (<span key={unit} className="text-xs bg-gray-100 px-3 py-1 rounded">{unit}</span>))}</div></div>
          <div className="mb-4"><p className="text-sm font-semibold text-gray-900 mb-2">Amenities</p><div className="flex flex-wrap gap-2">{selectedBuilding.amenities.map((a) => (<span key={a} className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded">{a}</span>))}</div></div>
          <FeesDropdown fees={selectedBuilding.fees} />
          <button onClick={() => setShowModal(true)} className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">Talk to Don</button>
        </div>
      )}

      {showModal && <TalkTodonModal building={selectedBuilding} onClose={() => setShowModal(false)} />}
    </div>
  );
}
