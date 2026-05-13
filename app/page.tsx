'use client';

import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const BUILDINGS = [
  {
    id: 1,
    name: 'Flow Brickell',
    neighborhood: 'Brickell',
    address: '275 SW 6th St, Miami, FL 33130',
    lat: 25.7580,
    lng: -80.1933,
    priceMin: 2790,
    priceTier: '$$',
    concession: '1 month free on select units',
    units: ['Studio', '1B', '2B', '3B'],
    incomeReq: '2.5x',
    creditReq: '>650',
    guarantor: true,
    holdDays: [30, 60, 90],
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'],
    amenities: ['Pool', 'Gym', 'Concierge', 'Parking', 'Rooftop'],
  },
  {
    id: 2,
    name: 'Modera Riverside',
    neighborhood: 'Brickell',
    address: '300 SW 2nd Ave, Miami, FL 33130',
    lat: 25.7576,
    lng: -80.1949,
    priceMin: 2500,
    priceTier: '$$',
    concession: '50% off first 60 days',
    units: ['Studio', '1B', '2B'],
    incomeReq: '2.5x',
    creditReq: '>650',
    guarantor: true,
    holdDays: [30, 60],
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'],
    amenities: ['Pool', 'Gym', 'Parking'],
  },
  {
    id: 3,
    name: 'Maizon',
    neighborhood: 'Brickell',
    address: '221 SW 12th St, Miami, FL 33130',
    lat: 25.7554,
    lng: -80.1944,
    priceMin: 2235,
    priceTier: '$',
    concession: '$500 move-in credit',
    units: ['Studio', '1B', '2B'],
    incomeReq: '2.5x',
    creditReq: '>650',
    guarantor: true,
    holdDays: [14, 30, 60],
    images: ['https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'],
    amenities: ['Pool', 'Gym', 'Lounge'],
  },
  {
    id: 4,
    name: 'Solitair',
    neighborhood: 'Brickell',
    address: '86 SW 8th St, Miami, FL 33130',
    lat: 25.7585,
    lng: -80.1936,
    priceMin: 2654,
    priceTier: '$$',
    concession: 'Free first month + parking',
    units: ['Studio', '1B', '2B', '3B'],
    incomeReq: '3x',
    creditReq: '>650',
    guarantor: false,
    holdDays: [30, 60, 90],
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'],
    amenities: ['Pool', 'Gym', 'Bar Lounge', 'Billiards'],
  },
  {
    id: 5,
    name: 'Miro Brickell',
    neighborhood: 'Brickell',
    address: '255 SW 11th St, Miami, FL 33130',
    lat: 25.7560,
    lng: -80.1920,
    priceMin: 2425,
    priceTier: '$',
    concession: '1 month free on leases 12+ months',
    units: ['Studio', '1B', '2B'],
    incomeReq: '2.5x',
    creditReq: '>650',
    guarantor: true,
    holdDays: [14, 30, 60],
    images: ['https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'],
    amenities: ['Pool', 'Gym', 'Dog Wash', 'Yoga Studio'],
  },
  {
    id: 6,
    name: 'Brickell First',
    neighborhood: 'Brickell',
    address: '110 SW 12th St, Miami, FL 33130',
    lat: 25.7555,
    lng: -80.1945,
    priceMin: 3045,
    priceTier: '$$',
    concession: '2 months free on 12-month lease',
    units: ['1B', '2B', '3B'],
    incomeReq: '3x',
    creditReq: '>650',
    guarantor: false,
    holdDays: [30, 60],
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'],
    amenities: ['Pool', 'Spa', 'Gym', 'Concierge', 'Valet'],
  },
  {
    id: 7,
    name: 'CMPND',
    neighborhood: 'Downtown',
    address: '55 NE 2nd St, Miami, FL 33132',
    lat: 25.7650,
    lng: -80.1866,
    priceMin: 1950,
    priceTier: '$',
    concession: 'Two months free on select units',
    units: ['Studio', '1B', '2B'],
    incomeReq: '3x',
    creditReq: '>650',
    guarantor: true,
    holdDays: [14, 30, 60, 90],
    images: ['https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'],
    amenities: ['Pool', 'Gym', 'Pet-Friendly', 'Coworking'],
  },
  {
    id: 8,
    name: 'Miami World Tower',
    neighborhood: 'Downtown',
    address: '710 NE 1st Ave, Miami, FL 33132',
    lat: 25.7650,
    lng: -80.1866,
    priceMin: 2410,
    priceTier: '$$',
    concession: 'Up to two months free on select apartments',
    units: ['Studio', '1B', '2B'],
    incomeReq: '3x',
    creditReq: '>650',
    guarantor: true,
    holdDays: [30],
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'],
    amenities: ['Pool', 'Gym', 'Concierge', 'Parking', 'Rooftop'],
  },
  {
    id: 9,
    name: 'Muze at Met',
    neighborhood: 'Downtown',
    address: '340 SE 3rd St, Miami, FL 33131',
    lat: 25.7594,
    lng: -80.1850,
    priceMin: 2627,
    priceTier: '$$',
    concession: '1.5 months free on 1Bs, 1 month on 2/3 beds',
    units: ['Studio', '1B', '2B', '3B'],
    incomeReq: '3x',
    creditReq: '>650',
    guarantor: true,
    holdDays: [14],
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'],
    amenities: ['Pool', 'Gym', 'Concierge', 'Parking', 'Rooftop'],
  },
  {
    id: 10,
    name: 'Flow Miami World',
    neighborhood: 'Downtown',
    address: '698 NE 1st Ave, Miami, FL 33132',
    lat: 25.7660,
    lng: -80.1870,
    priceMin: 2223,
    priceTier: '$$',
    concession: '3 months free on all apartments',
    units: ['Studio', '1B', '2B', '3B'],
    incomeReq: '3x',
    creditReq: '>650',
    guarantor: true,
    holdDays: [30],
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'],
    amenities: ['Pool', 'Gym', 'Concierge', 'Parking', 'Rooftop'],
  },
  {
    id: 11,
    name: 'Monarc at Met',
    neighborhood: 'Downtown',
    address: '201 SE 2nd Ave, Miami, FL 33131',
    lat: 25.7580,
    lng: -80.1840,
    priceMin: 2692,
    priceTier: '$$',
    concession: 'No current concessions',
    units: ['Studio', '1B', '2B'],
    incomeReq: '3x',
    creditReq: '>650',
    guarantor: true,
    holdDays: [14],
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'],
    amenities: ['Pool', 'Gym', 'Concierge', 'Parking', 'Rooftop'],
  },
  {
    id: 12,
    name: 'Parkline',
    neighborhood: 'Downtown',
    address: '100 NW 6th St, Miami, FL 33136',
    lat: 25.7700,
    lng: -80.1900,
    priceMin: 2120,
    priceTier: '$',
    concession: 'Up to 3 months free',
    units: ['Studio', '1B', '2B', '3B'],
    incomeReq: '3x',
    creditReq: '>650',
    guarantor: false,
    holdDays: [14],
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'],
    amenities: ['Pool', 'Gym', 'Concierge', 'Parking', 'Rooftop'],
  },
];

const InfoTooltip = ({ text }: { text: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <button className="w-5 h-5 rounded-full border border-gray-400 text-gray-600 text-xs flex items-center justify-center hover:border-gray-600" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>i</button>
      {show && <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-xs p-2 rounded shadow-lg z-50">{text}</div>}
    </div>
  );
};

const ImageCarousel = ({ images }: { images: string[] }) => {
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

const TalkTodonModal = ({ building, onClose }: { building: (typeof BUILDINGS)[0]; onClose: () => void }) => {
  const [step, setStep] = useState('form');
  const [formData, setFormData] = useState({ income: '', credit: '', moveInDate: '', firstName: '', phone: '' });
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
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

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const leadData = {
      buildingName: building.name,
      income: parseInt(formData.income),
      creditScore: parseInt(formData.credit),
      moveInDate: formData.moveInDate,
      qualificationStatus: result,
      firstName: formData.firstName,
      phone: formData.phone,
      timestamp: new Date().toISOString(),
    };
    console.log('Lead captured:', leadData);
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
              {result === 'qualify' && (<><div className="text-5xl mb-3">✓</div><h2 className="text-3xl font-bold text-green-600">You Qualify!</h2><p className="text-gray-600 mt-2">Great news — you meet the requirements for {building.name}</p></>)}
              {result === 'close' && (<><div className="text-5xl mb-3">⚠</div><h2 className="text-3xl font-bold text-yellow-600">You&apos;re Close</h2><p className="text-gray-600 mt-2">You&apos;re close on income. Let&apos;s talk about your options</p></>)}
              {result === 'not-fit' && (<><div className="text-5xl mb-3">✗</div><h2 className="text-3xl font-bold text-red-600">Not a Fit</h2><p className="text-gray-600 mt-2">This building may not be the right fit right now. We have other options</p></>)}
            </div>
            <button onClick={() => setStep('contact')} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 mb-3">Continue</button>
            <button onClick={onClose} className="w-full text-gray-600 py-2 hover:text-gray-900">Back</button>
          </>
        )}
        {step === 'contact' && !result && (
          <>
            <h2 className="text-2xl font-bold mb-2">One more thing...</h2>
            <p className="text-gray-600 mb-6">Don will reach out directly with personalized options based on your situation.</p>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input type="text" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="John" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="(305) 555-0000" />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">Submit</button>
            </form>
            <button onClick={() => setStep('results')} className="mt-4 w-full text-gray-600 py-2 hover:text-gray-900">Back</button>
          </>
        )}
        {step === 'contact' && result && (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">✓</div>
            <h3 className="text-xl font-bold mb-2">Thanks, {formData.firstName}!</h3>
            <p className="text-gray-600 mb-6">Don will reach out soon with next steps for {building.name}</p>
            <button onClick={onClose} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">Back to Buildings</button>
          </div>
        )}
      </div>
    </div>
  );
};

const MapComponent = ({ buildings, selectedBuilding, onBuildingClick }: { buildings: (typeof BUILDINGS); selectedBuilding: (typeof BUILDINGS)[0] | null; onBuildingClick: (building: (typeof BUILDINGS)[0]) => void }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: number]: { marker: L.Marker; element: HTMLElement } }>({});

  useEffect(() => {
    if (!mapRef.current) return;

    try {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapRef.current).setView([25.760, -80.195], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      buildings.forEach((building) => {
        const blueIcon = L.divIcon({
          html: `<div class="w-10 h-10 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs">${building.id}</div>`,
          className: 'custom-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const marker = L.marker([building.lat, building.lng], { icon: blueIcon })
          .bindPopup(`<div class="text-sm font-semibold">${building.name}</div>`)
          .on('click', () => onBuildingClick(building))
          .addTo(map);

        markersRef.current[building.id] = { marker, element: marker._icon as HTMLElement };
      });

      mapInstanceRef.current = map;

      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }
      };
    } catch (error) {
      console.error('Map error:', error);
    }
  }, [buildings, onBuildingClick]);

  useEffect(() => {
    Object.values(markersRef.current).forEach(({ element }) => {
      if (element) {
        element.style.filter = 'brightness(1)';
      }
    });

    if (selectedBuilding && markersRef.current[selectedBuilding.id]?.element) {
      markersRef.current[selectedBuilding.id].element.style.filter = 'brightness(0.5) saturate(2) hue-rotate(-30deg)';
    }
  }, [selectedBuilding]);

  return <div ref={mapRef} className="w-full h-full" />;
};

export default function MiamiApp() {
  const [selectedBuilding, setSelectedBuilding] = useState<(typeof BUILDINGS)[0] | null>(null);
  const [showTalkToDonModal, setShowTalkToDonModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [selectedIncome, setSelectedIncome] = useState('all');
  const [selectedCredit, setSelectedCredit] = useState('all');
  const [guarantorOnly, setGuarantorOnly] = useState(false);
  const [selectedHold, setSelectedHold] = useState('all');

  const filtered = BUILDINGS.filter((b) => {
    if (searchTerm && !b.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (selectedPrice !== 'all' && b.priceTier !== selectedPrice) return false;
    if (selectedUnits.length > 0 && !selectedUnits.some((u) => b.units.includes(u))) return false;
    if (selectedIncome !== 'all' && b.incomeReq !== selectedIncome) return false;
    if (selectedCredit !== 'all' && b.creditReq !== selectedCredit) return false;
    if (guarantorOnly && !b.guarantor) return false;
    if (selectedHold !== 'all' && !b.holdDays.includes(parseInt(selectedHold))) return false;
    return true;
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center px-6 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-sm">M</span></div>
          <h1 className="text-xl font-semibold text-gray-900">Miami Rentals</h1>
        </div>
        <div className="flex-1 mx-8">
          <input type="text" placeholder="Search buildings..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full max-w-md px-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-6 text-sm">
          <button className="text-gray-700 hover:text-gray-900 font-medium">Map</button>
          <button className="text-gray-700 hover:text-gray-900 font-medium">Qualify</button>
          <button className="w-8 h-8 rounded-full bg-gray-200"></button>
        </div>
      </div>

      <div className="flex flex-1 mt-16">
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto p-6">
          <h2 className="text-lg font-semibold mb-6 text-gray-900">Filters</h2>
          <div className="mb-6"><label className="block text-sm font-medium text-gray-900 mb-3">Pricing</label><div className="space-y-2">{['$', '$$', '$$$'].map((price) => (<label key={price} className="flex items-center gap-3 cursor-pointer"><input type="radio" name="price" value={price} checked={selectedPrice === price} onChange={(e) => setSelectedPrice(e.target.value)} className="w-4 h-4" /><span className="text-sm text-gray-700">{price}</span></label>))}<label className="flex items-center gap-3 cursor-pointer"><input type="radio" name="price" value="all" checked={selectedPrice === 'all'} onChange={(e) => setSelectedPrice(e.target.value)} className="w-4 h-4" /><span className="text-sm text-gray-700">All</span></label></div></div>
          <div className="mb-6"><label className="block text-sm font-medium text-gray-900 mb-3">Unit Type</label><div className="space-y-2">{['Studio', '1B', '2B', '3B'].map((unit) => (<label key={unit} className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={selectedUnits.includes(unit)} onChange={(e) => { if (e.target.checked) { setSelectedUnits([...selectedUnits, unit]); } else { setSelectedUnits(selectedUnits.filter((u) => u !== unit)); } }} className="w-4 h-4" /><span className="text-sm text-gray-700">{unit}</span></label>))}</div></div>
          <div className="mb-6"><label className="block text-sm font-medium text-gray-900 mb-3">Income Requirement</label><div className="space-y-2">{['2.5x', '3x'].map((income) => (<label key={income} className="flex items-center gap-3 cursor-pointer"><input type="radio" name="income" value={income} checked={selectedIncome === income} onChange={(e) => setSelectedIncome(e.target.value)} className="w-4 h-4" /><span className="text-sm text-gray-700">{income}</span></label>))}<label className="flex items-center gap-3 cursor-pointer"><input type="radio" name="income" value="all" checked={selectedIncome === 'all'} onChange={(e) => setSelectedIncome(e.target.value)} className="w-4 h-4" /><span className="text-sm text-gray-700">All</span></label></div></div>
          <div className="mb-6"><label className="block text-sm font-medium text-gray-900 mb-3">Credit Requirement</label><div className="space-y-2">{['>650', '>600'].map((credit) => (<label key={credit} className="flex items-center gap-3 cursor-pointer"><input type="radio" name="credit" value={credit} checked={selectedCredit === credit} onChange={(e) => setSelectedCredit(e.target.value)} className="w-4 h-4" /><span className="text-sm text-gray-700">{credit}</span></label>))}<label className="flex items-center gap-3 cursor-pointer"><input type="radio" name="credit" value="all" checked={selectedCredit === 'all'} onChange={(e) => setSelectedCredit(e.target.value)} className="w-4 h-4" /><span className="text-sm text-gray-700">All</span></label></div></div>
          <div className="mb-6"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={guarantorOnly} onChange={(e) => setGuarantorOnly(e.target.checked)} className="w-4 h-4" /><span className="text-sm font-medium text-gray-700">Works w/ Guarantors</span></label></div>
          <div className="mb-6"><label className="block text-sm font-medium text-gray-900 mb-3">Hold Duration</label><div className="space-y-2">{[14, 30, 60, 90].map((days) => (<label key={days} className="flex items-center gap-3 cursor-pointer"><input type="radio" name="hold" value={String(days)} checked={selectedHold === String(days)} onChange={(e) => setSelectedHold(e.target.value)} className="w-4 h-4" /><span className="text-sm text-gray-700">{days} days</span></label>))}<label className="flex items-center gap-3 cursor-pointer"><input type="radio" name="hold" value="all" checked={selectedHold === 'all'} onChange={(e) => setSelectedHold(e.target.value)} className="w-4 h-4" /><span className="text-sm text-gray-700">All</span></label></div></div>
        </div>

        <div className="flex-1 relative">
          <MapComponent buildings={filtered} selectedBuilding={selectedBuilding} onBuildingClick={setSelectedBuilding} />
        </div>

        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
          {!selectedBuilding ? (
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Buildings ({filtered.length})</h2>
              <div className="space-y-3">
                {filtered.map((building) => (
                  <div key={building.id} onClick={() => setSelectedBuilding(building)} className="p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-gray-900">{building.name}</h3>
                      <span className="text-sm font-bold">{building.priceTier}</span>
                    </div>
                    <p className="text-xs text-gray-600">{building.neighborhood}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">${building.priceMin}+</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6">
              <button onClick={() => setSelectedBuilding(null)} className="text-blue-600 hover:text-blue-700 text-sm mb-4">← Back to List</button>
              <ImageCarousel images={selectedBuilding.images} />
              <h1 className="text-2xl font-bold mt-4 mb-2">{selectedBuilding.name}</h1>
              <div className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-medium mb-4">{selectedBuilding.neighborhood}</div>
              <div className="flex items-center gap-2 text-gray-600 text-sm mb-6"><span>📍</span><span>{selectedBuilding.address}</span></div>
              <div className="mb-6 p-4 bg-gray-50 rounded-lg"><div className="flex items-center gap-2 mb-2"><span className="text-2xl">$</span><span className="text-sm text-gray-600">Starting Price</span><InfoTooltip text="Pricing fluctuates daily based on neighborhood market rates" /></div><p className="text-xl font-bold text-gray-900">${selectedBuilding.priceMin}+</p></div>
              <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-500 rounded-lg"><p className="text-sm font-semibold text-blue-900">Current Offer</p><p className="text-lg font-bold text-blue-600">{selectedBuilding.concession}</p></div>
              <div className="mb-6 p-4 bg-gray-50 rounded-lg"><p className="text-sm text-gray-600 mb-1">Requirements</p><p className="font-semibold text-gray-900">Income: {selectedBuilding.incomeReq} | Credit: {selectedBuilding.creditReq}</p></div>
              <div className="mb-6 p-4 bg-gray-50 rounded-lg"><p className="text-sm text-gray-600 mb-1">Hold Days</p><p className="font-semibold text-gray-900">{selectedBuilding.holdDays.join(', ')} days available</p></div>
              <div className="mb-6"><p className="text-sm font-semibold text-gray-900 mb-2">Amenities</p><div className="flex flex-wrap gap-2">{selectedBuilding.amenities.map((amenity) => (<span key={amenity} className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded">{amenity}</span>))}</div></div>
              <div className="mb-6"><p className="text-sm font-semibold text-gray-900 mb-2">Available Units</p><div className="flex gap-2">{selectedBuilding.units.map((unit) => (<span key={unit} className="text-xs bg-gray-100 px-3 py-1 rounded">{unit}</span>))}</div></div>
              <button onClick={() => setShowTalkToDonModal(true)} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">Talk to Don</button>
            </div>
          )}
        </div>
      </div>

      {showTalkToDonModal && <TalkTodonModal building={selectedBuilding!} onClose={() => setShowTalkToDonModal(false)} />}
    </div>
  );
}
