'use client';

import React, { useState, useEffect, useRef } from 'react';

const BUILDINGS = [
  { id: 1, name: 'Flow Brickell', neighborhood: 'Brickell', address: '275 SW 6th St, Miami, FL 33130', lat: 25.7684, lng: -80.1990, priceMin: 2790, priceTier: '$$', concession: '1 month free on select units', units: ['Studio', '1B', '2B', '3B'], incomeReq: '2.5x', creditReq: '>650', guarantor: true, holdDays: [30, 60, 90], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Concierge', 'Parking', 'Rooftop'], fees: { deposit: '$2,790', application: '$75', admin: '$150', parking: '$150/car', misc: 'Pet fee: $35/mo' } },
  { id: 2, name: 'Modera Riverside', neighborhood: 'Brickell', address: '300 SW 2nd Ave, Miami, FL 33130', lat: 25.7561, lng: -80.1954, priceMin: 2500, priceTier: '$$', concession: '50% off first 60 days', units: ['Studio', '1B', '2B'], incomeReq: '2.5x', creditReq: '>650', guarantor: true, holdDays: [30, 60], images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Parking'], fees: { deposit: '$2,500', application: '$50', admin: '$100', parking: '$125/car', misc: 'Renters insurance required' } },
  { id: 3, name: 'Maizon', neighborhood: 'Brickell', address: '221 SW 12th St, Miami, FL 33130', lat: 25.7528, lng: -80.1958, priceMin: 2235, priceTier: '$', concession: '$500 move-in credit', units: ['Studio', '1B', '2B'], incomeReq: '2.5x', creditReq: '>650', guarantor: true, holdDays: [14, 30, 60], images: ['https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Lounge'], fees: { deposit: '$2,235', application: '$60', admin: '$120', parking: '$140/car', misc: 'None' } },
  { id: 4, name: 'Solitair', neighborhood: 'Brickell', address: '86 SW 8th St, Miami, FL 33130', lat: 25.7662, lng: -80.1946, priceMin: 2654, priceTier: '$$', concession: 'Free first month + parking', units: ['Studio', '1B', '2B', '3B'], incomeReq: '3x', creditReq: '>650', guarantor: false, holdDays: [30, 60, 90], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Bar Lounge', 'Billiards'], fees: { deposit: '$2,654', application: '$75', admin: '$150', parking: 'Free', misc: 'Concierge fee: $25/mo' } },
  { id: 5, name: 'Miro Brickell', neighborhood: 'Brickell', address: '255 SW 11th St, Miami, FL 33130', lat: 25.7626, lng: -80.1943, priceMin: 2425, priceTier: '$', concession: '1 month free on leases 12+ months', units: ['Studio', '1B', '2B'], incomeReq: '2.5x', creditReq: '>650', guarantor: true, holdDays: [14, 30, 60], images: ['https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Dog Wash', 'Yoga Studio'], fees: { deposit: '$2,425', application: '$65', admin: '$130', parking: '$135/car', misc: 'Pet fee: $50/mo' } },
  { id: 6, name: 'Brickell First', neighborhood: 'Brickell', address: '110 SW 12th St, Miami, FL 33130', lat: 25.7622, lng: -80.1958, priceMin: 3045, priceTier: '$$', concession: '2 months free on 12-month lease', units: ['1B', '2B', '3B'], incomeReq: '3x', creditReq: '>650', guarantor: false, holdDays: [30, 60], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Spa', 'Gym', 'Concierge', 'Valet'], fees: { deposit: '$3,045', application: '$100', admin: '$200', parking: '$175/car', misc: 'Valet required: $60/mo' } },
  { id: 7, name: 'CMPND', neighborhood: 'Downtown', address: '55 NE 2nd St, Miami, FL 33132', lat: 25.7751, lng: -80.1924, priceMin: 1950, priceTier: '$', concession: 'Two months free on select units', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [14, 30, 60, 90], images: ['https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Pet-Friendly', 'Coworking'], fees: { deposit: '$1,950', application: '$50', admin: '$100', parking: '$120/car', misc: 'None' } },
  { id: 8, name: 'Miami World Tower', neighborhood: 'Downtown', address: '710 NE 1st Ave, Miami, FL 33132', lat: 25.7765, lng: -80.1933, priceMin: 2410, priceTier: '$$', concession: 'Up to two months free on select apartments', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Concierge', 'Parking', 'Rooftop'], fees: { deposit: '$2,410', application: '$75', admin: '$150', parking: '$160/car', misc: 'Concierge fee: $30/mo' } },
  { id: 9, name: 'Muze at Met', neighborhood: 'Downtown', address: '340 SE 3rd St, Miami, FL 33131', lat: 25.7679, lng: -80.1892, priceMin: 2627, priceTier: '$$', concession: '1.5 months free on 1Bs, 1 month on 2/3 beds', units: ['Studio', '1B', '2B', '3B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [14], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Concierge', 'Parking', 'Rooftop'], fees: { deposit: '$2,627', application: '$80', admin: '$160', parking: '$165/car', misc: 'Pet fee: $40/mo' } },
  { id: 10, name: 'Flow Miami World', neighborhood: 'Downtown', address: '698 NE 1st Ave, Miami, FL 33132', lat: 25.7763, lng: -80.1931, priceMin: 2223, priceTier: '$$', concession: '3 months free on all apartments', units: ['Studio', '1B', '2B', '3B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Concierge', 'Parking', 'Rooftop'], fees: { deposit: '$2,223', application: '$70', admin: '$140', parking: '$145/car', misc: 'None' } },
  { id: 11, name: 'Monarc at Met', neighborhood: 'Downtown', address: '201 SE 2nd Ave, Miami, FL 33131', lat: 25.7667, lng: -80.1883, priceMin: 2692, priceTier: '$$', concession: 'No current concessions', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [14], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Concierge', 'Parking', 'Rooftop'], fees: { deposit: '$2,692', application: '$85', admin: '$170', parking: '$170/car', misc: 'Concierge fee: $35/mo' } },
  { id: 12, name: 'Parkline', neighborhood: 'Downtown', address: '100 NW 6th St, Miami, FL 33136', lat: 25.7781, lng: -80.1997, priceMin: 2120, priceTier: '$', concession: 'Up to 3 months free', units: ['Studio', '1B', '2B', '3B'], incomeReq: '3x', creditReq: '>650', guarantor: false, holdDays: [14], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Concierge', 'Parking', 'Rooftop'], fees: { deposit: '$2,120', application: '$60', admin: '$120', parking: '$130/car', misc: 'None' } },
];

const NEIGHBORHOODS = ['Brickell', 'Downtown', 'Midtown', 'Edgewater', 'Wynwood'];

const Tooltip = ({ text }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <button className="w-5 h-5 rounded-full border border-gray-400 text-gray-600 text-xs flex items-center justify-center hover:border-gray-600" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>i</button>
      {show && <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-xs p-2 rounded shadow-lg z-50">A co-signer on your lease who guarantees payment if you can't pay rent.</div>}
    </div>
  );
};

const ImageCarousel = ({ images }) => {
  const [current, setCurrent] = useState(0);
  const next = () => setCurrent((current + 1) % images.length);
  const prev = () => setCurrent((current - 1 + images.length) % images.length);
  return (
    <div className="relative w-full h-64 bg-gray-200 rounded-lg overflow-hidden group">
      <img src={images[current]} alt={`Building ${current + 1}`} className="w-full h-full object-cover" />
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

const MapComponent = ({ expandedNeighborhoods, selectedBuilding, onPinClick }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);

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
          center: [-80.188, 25.765],
          zoom: 13,
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

  useEffect(() => {
    if (!map.current || !window.mapboxgl) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    BUILDINGS.forEach((building) => {
      const el = document.createElement('div');
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.backgroundColor = selectedBuilding?.id === building.id ? '#FF8C00' : '#3B82F6';
      el.style.borderRadius = '50%';
      el.style.cursor = 'pointer';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      el.style.transition = 'all 0.2s';
      el.onclick = () => {
        setSelectedBuilding(building);
        setIsBottomSheetExpanded(true);
      };

      const marker = new window.mapboxgl.Marker(el)
        .setLngLat([building.lng, building.lat])
        .addTo(map.current);
      
      markersRef.current.push(marker);
    });
  }, [selectedBuilding]);

  return <div ref={mapContainer} className="w-full h-full" />;
};

export default function MiamiApp() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedNeighborhoods, setExpandedNeighborhoods] = useState([]);
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);
  const bottomSheetRef = useRef(null);
  const touchStartY = useRef(0);

  const toggleNeighborhood = (neighborhood) => {
    setExpandedNeighborhoods(prev =>
      prev.includes(neighborhood)
        ? prev.filter(n => n !== neighborhood)
        : [...prev, neighborhood]
    );
  };

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
          zoom: 14,
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

  const addPins = () => {
    if (!map.current || !window.mapboxgl) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    BUILDINGS.forEach((building) => {
      const el = document.createElement('div');
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.backgroundColor = selectedBuilding?.id === building.id ? '#FF8C00' : '#3B82F6';
      el.style.borderRadius = '50%';
      el.style.cursor = 'pointer';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      el.style.transition = 'all 0.2s';
      el.onclick = () => {
        setSelectedBuilding(building);
        setIsBottomSheetExpanded(true);
      };

      const marker = new window.mapboxgl.Marker(el)
        .setLngLat([building.lng, building.lat])
        .addTo(map.current);
      
      markersRef.current.push(marker);
    });
  };

  useEffect(() => {
    if (map.current) {
      addPins();
    }
  }, [selectedBuilding]);

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center px-6 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold">M</span></div>
          <h1 className="text-xl font-semibold">Miami Rentals</h1>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex md:hidden flex-col w-full h-full bg-white min-h-screen">
        <div className={`flex-1 relative w-full h-full overflow-hidden transition-opacity ${isBottomSheetExpanded ? 'pointer-events-none opacity-50' : 'pointer-events-auto'}`}>
          <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
          <div className="absolute top-4 left-4 right-4 z-20 flex gap-3 items-center pointer-events-none">
            <input type="text" placeholder="Search buildings, price..." className="flex-1 px-4 py-3 rounded-full bg-white border border-gray-200 text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 pointer-events-auto" />
            <button className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-700 pointer-events-auto">⚙</button>
          </div>
        </div>

        <div ref={bottomSheetRef} onTouchStart={handleBottomSheetDrag} onTouchEnd={handleBottomSheetDrag} className={`fixed left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-40 transition-all duration-300 overflow-hidden flex flex-col cursor-grab active:cursor-grabbing ${isBottomSheetExpanded ? 'bottom-0 h-[65vh]' : 'bottom-0 h-20'}`}>
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 flex-shrink-0"></div>
          
          {!isBottomSheetExpanded && !selectedBuilding && <div className="px-4 pt-2"><h2 className="text-sm font-semibold text-gray-900">Swipe up to browse neighborhoods</h2></div>}
          {!isBottomSheetExpanded && selectedBuilding && <div className="px-4 pt-2"><h2 className="text-sm font-semibold text-gray-900 truncate">{selectedBuilding.name}</h2><p className="text-xs text-gray-600">${selectedBuilding.priceMin}+/mo</p></div>}

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
                  
                  <div className="mb-4">
                    <FeesDropdown fees={selectedBuilding.fees} />
                  </div>
                  
                  <button onClick={() => setShowModal(true)} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 mb-4">Talk to Don</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex flex-1">
        <div className="flex-1 relative">
          <MapComponent expandedNeighborhoods={expandedNeighborhoods} selectedBuilding={selectedBuilding} onPinClick={setSelectedBuilding} />
        </div>

        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
          {!selectedBuilding ? (
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-6">Neighborhoods</h2>
              <div className="space-y-2">
                {NEIGHBORHOODS.map((neighborhood) => {
                  const buildings = getNeighborhoodBuildings(neighborhood);
                  const isExpanded = expandedNeighborhoods.includes(neighborhood);
                  return (
                    <div key={neighborhood}>
                      <button
                        onClick={() => toggleNeighborhood(neighborhood)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                      >
                        <span className="font-semibold text-gray-900">{neighborhood} ({buildings.length})</span>
                        <span className={`text-gray-600 transition transform ${isExpanded ? 'rotate-90' : ''}`}>›</span>
                      </button>
                      {isExpanded && (
                        <div className="ml-4 mt-2 space-y-2">
                          {buildings.map((building) => (
                            <div
                              key={building.id}
                              onClick={() => setSelectedBuilding(building)}
                              className="p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition"
                            >
                              <h3 className="font-semibold text-gray-900">{building.name}</h3>
                              <p className="text-sm font-semibold text-gray-900">${building.priceMin}+</p>
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
            <div className="p-6">
              <button onClick={() => setSelectedBuilding(null)} className="text-blue-600 hover:text-blue-700 text-sm mb-4">← Back</button>
              <ImageCarousel images={selectedBuilding.images} />
              <h1 className="text-2xl font-bold mt-4 mb-2">{selectedBuilding.name}</h1>
              <div className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-medium mb-4">{selectedBuilding.neighborhood}</div>
              <p className="text-gray-600 text-sm mb-6">�� {selectedBuilding.address}</p>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-gray-900">${selectedBuilding.priceMin}+/mo</p>
              </div>
              
              <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-500 rounded-lg">
                <p className="text-sm font-semibold text-blue-900">Current Offer</p>
                <p className="text-lg font-bold text-blue-600">{selectedBuilding.concession}</p>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Income Requirement</p>
                <p className="font-semibold text-gray-900">{selectedBuilding.incomeReq}</p>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Credit Requirement</p>
                <p className="font-semibold text-gray-900">{selectedBuilding.creditReq}</p>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm text-gray-600">Works w/ Guarantors</p>
                  <Tooltip />
                </div>
                <p className="font-semibold text-gray-900">{selectedBuilding.guarantor ? 'Yes' : 'No'}</p>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Hold Days</p>
                <p className="font-semibold text-gray-900">{selectedBuilding.holdDays.join(', ')} days</p>
              </div>

              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-900 mb-2">Bedrooms</p>
                <div className="flex gap-2 flex-wrap">
                  {selectedBuilding.units.map((unit) => (
                    <span key={unit} className="text-xs bg-gray-100 px-3 py-1 rounded">{unit}</span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-900 mb-2">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {selectedBuilding.amenities.map((a) => (
                    <span key={a} className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded">{a}</span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <FeesDropdown fees={selectedBuilding.fees} />
              </div>

              <button onClick={() => setShowModal(true)} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">Talk to Don</button>
            </div>
          )}
        </div>
      </div>

      {showModal && <TalkTodonModal building={selectedBuilding} onClose={() => setShowModal(false)} />}
    </div>
  );
}
