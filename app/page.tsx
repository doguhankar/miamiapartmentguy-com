'use client';

import React, { useState, useEffect, useRef } from 'react';

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
    lat: 25.7660,
    lng: -80.1875,
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
    lat: 25.7670,
    lng: -80.1880,
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

const InfoTooltip = ({ text }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <button className="w-5 h-5 rounded-full border border-gray-400 text-gray-600 text-xs flex items-center justify-center hover:border-gray-600" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>i</button>
      {show && <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-xs p-2 rounded shadow-lg z-50">{text}</div>}
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
              {result === 'close' && (<><div className="text-5xl mb-3">⚠</div><h2 className="text-3xl font-bold text-yellow-600">You're Close</h2><p className="text-gray-600 mt-2">You're close on income. Let's talk about your options</p></>)}
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

const SimpleMap = ({ buildings, selectedBuilding, onBuildingClick }) => {
  const mapRef = useRef(null);
  const [mapWidth, setMapWidth] = useState(0);

  useEffect(() => {
    if (mapRef.current) {
      setMapWidth(mapRef.current.offsetWidth);
    }
  }, []);

  return (
    <div ref={mapRef} className="w-full h-full bg-gray-300 relative flex items-center justify-center">
      <iframe
        width="100%"
        height="100%"
        frameBorder="0"
        src={`https://www.google.com/maps/embed/v1/view?key=AIzaSyAqVnVKF0lqjGkYEpFnkcV6rLIydveSQsw&center=${25.765},-${80.188}&zoom=13`}
        style={{ border: 0 }}
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      ></iframe>
      
      <div className="absolute inset-0 pointer-events-none">
        {buildings.map((building) => {
          const mapHeight = window.innerHeight;
          const centerLat = 25.765;
          const centerLng = -80.188;
          
          const latRange = 40.315;
          const lngRange = 68.75;
          
          const pixelsPerDegreeLat = mapHeight / latRange;
          const pixelsPerDegreeLng = mapWidth / lngRange;
          
          const x = ((building.lng - (centerLng - lngRange / 2)) * pixelsPerDegreeLng);
          const y = (((centerLat + latRange / 2) - building.lat) * pixelsPerDegreeLat);
          
          const isSelected = selectedBuilding?.id === building.id;
          
          return (
            <button
              key={building.id}
              onClick={() => onBuildingClick(building)}
              className={`absolute w-10 h-10 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition pointer-events-auto ${
                isSelected ? 'bg-orange-500 ring-4 ring-orange-300 scale-125' : 'bg-blue-500 hover:scale-110'
              }`}
              style={{ left: `${x}px`, top: `${y}px` }}
              title={building.name}
            >
              <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">{building.id}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default function MiamiApp() {
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [showTalkToDonModal, setShowTalkToDonModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [selectedUnits, setSelectedUnits] = useState([]);
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
          <div className="w-8 h-8 bg-blue-600 rounded text-white flex items-center justify-center font-bold">M</div>
          <h1 className="text-xl font-bold">Miami Rentals</h1>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <input type="text" placeholder="Search buildings..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        </div>
      </div>

      <div className="mt-16 flex flex-1 gap-0">
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold">Price</h3>
              <InfoTooltip text="Filter buildings by price tier" />
            </div>
            <div className="space-y-2">
              {['all', '$', '$$'].map((price) => (
                <label key={price} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="price" value={price} checked={selectedPrice === price} onChange={(e) => setSelectedPrice(e.target.value)} className="w-4 h-4" />
                  <span className="text-sm">{price === 'all' ? 'All Prices' : price}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold">Unit Type</h3>
              <InfoTooltip text="Select unit sizes available" />
            </div>
            <div className="space-y-2">
              {['Studio', '1B', '2B', '3B'].map((unit) => (
                <label key={unit} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selectedUnits.includes(unit)} onChange={(e) => setSelectedUnits(e.target.checked ? [...selectedUnits, unit] : selectedUnits.filter((u) => u !== unit))} className="w-4 h-4" />
                  <span className="text-sm">{unit}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold">Income</h3>
              <InfoTooltip text="Income multiplier requirement (e.g., 3x means income should be 3x rent)" />
            </div>
            <div className="space-y-2">
              {['all', '2.5x', '3x'].map((income) => (
                <label key={income} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="income" value={income} checked={selectedIncome === income} onChange={(e) => setSelectedIncome(e.target.value)} className="w-4 h-4" />
                  <span className="text-sm">{income === 'all' ? 'All Income' : income}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold">Credit Score</h3>
              <InfoTooltip text="Minimum credit score requirement" />
            </div>
            <div className="space-y-2">
              {['all', '>650'].map((credit) => (
                <label key={credit} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="credit" value={credit} checked={selectedCredit === credit} onChange={(e) => setSelectedCredit(e.target.value)} className="w-4 h-4" />
                  <span className="text-sm">{credit === 'all' ? 'All Credit' : credit}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={guarantorOnly} onChange={(e) => setGuarantorOnly(e.target.checked)} className="w-4 h-4" />
              <span className="text-sm font-medium">Guarantor Accepted</span>
            </label>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold">Hold Days</h3>
              <InfoTooltip text="How many days you can hold the unit" />
            </div>
            <div className="space-y-2">
              {['all', '14', '30', '60', '90'].map((hold) => (
                <label key={hold} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="hold" value={hold} checked={selectedHold === hold} onChange={(e) => setSelectedHold(e.target.value)} className="w-4 h-4" />
                  <span className="text-sm">{hold === 'all' ? 'All Hold Days' : `${hold} days`}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <SimpleMap buildings={filtered} selectedBuilding={selectedBuilding} onBuildingClick={setSelectedBuilding} />
        </div>

        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto p-6 space-y-6">
          {selectedBuilding ? (
            <>
              <ImageCarousel images={selectedBuilding.images} />
              <div>
                <h2 className="text-2xl font-bold">{selectedBuilding.name}</h2>
                <p className="text-sm text-gray-600">{selectedBuilding.address}</p>
                <div className="mt-2 inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded">{selectedBuilding.neighborhood}</div>
              </div>

              <div>
                <p className="text-3xl font-bold text-blue-600">${selectedBuilding.priceMin}/mo</p>
                <p className="text-sm text-gray-600">{selectedBuilding.concession}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs text-gray-600">Income</p>
                  <p className="font-semibold">{selectedBuilding.incomeReq}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs text-gray-600">Credit</p>
                  <p className="font-semibold">{selectedBuilding.creditReq}</p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-sm mb-2">Units</p>
                <div className="flex flex-wrap gap-2">
                  {selectedBuilding.units.map((unit) => (
                    <span key={unit} className="bg-gray-200 text-gray-800 text-xs px-3 py-1 rounded">{unit}</span>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-semibold text-sm mb-2">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {selectedBuilding.amenities.map((amenity) => (
                    <span key={amenity} className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded">{amenity}</span>
                  ))}
                </div>
              </div>

              <button onClick={() => setShowTalkToDonModal(true)} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">Talk to Don</button>
            </>
          ) : (
            <div className="text-center text-gray-600 py-8">Select a building on the map to view details</div>
          )}
        </div>
      </div>

      {showTalkToDonModal && selectedBuilding && <TalkTodonModal building={selectedBuilding} onClose={() => setShowTalkToDonModal(false)} />}
    </div>
  );
}
