'use client';

import React, { useState, useEffect, useRef } from 'react';

const BUILDINGS = [
  { id: 1, name: 'Flow Brickell', neighborhood: 'Brickell', address: '275 SW 6th St, Miami, FL 33130', lat: 25.7580, lng: -80.1933, priceMin: 2790, priceTier: '$$', concession: '1 month free on select units', units: ['Studio', '1B', '2B', '3B'], incomeReq: '2.5x', creditReq: '>650', guarantor: true, holdDays: [30, 60, 90], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Concierge', 'Parking', 'Rooftop'] },
  { id: 2, name: 'Modera Riverside', neighborhood: 'Brickell', address: '300 SW 2nd Ave, Miami, FL 33130', lat: 25.7576, lng: -80.1949, priceMin: 2500, priceTier: '$$', concession: '50% off first 60 days', units: ['Studio', '1B', '2B'], incomeReq: '2.5x', creditReq: '>650', guarantor: true, holdDays: [30, 60], images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Parking'] },
  { id: 3, name: 'Maizon', neighborhood: 'Brickell', address: '221 SW 12th St, Miami, FL 33130', lat: 25.7554, lng: -80.1944, priceMin: 2235, priceTier: '$', concession: '$500 move-in credit', units: ['Studio', '1B', '2B'], incomeReq: '2.5x', creditReq: '>650', guarantor: true, holdDays: [14, 30, 60], images: ['https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Lounge'] },
  { id: 4, name: 'Solitair', neighborhood: 'Brickell', address: '86 SW 8th St, Miami, FL 33130', lat: 25.7585, lng: -80.1936, priceMin: 2654, priceTier: '$$', concession: 'Free first month + parking', units: ['Studio', '1B', '2B', '3B'], incomeReq: '3x', creditReq: '>650', guarantor: false, holdDays: [30, 60, 90], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Bar Lounge', 'Billiards'] },
  { id: 5, name: 'Miro Brickell', neighborhood: 'Brickell', address: '255 SW 11th St, Miami, FL 33130', lat: 25.7560, lng: -80.1920, priceMin: 2425, priceTier: '$', concession: '1 month free on leases 12+ months', units: ['Studio', '1B', '2B'], incomeReq: '2.5x', creditReq: '>650', guarantor: true, holdDays: [14, 30, 60], images: ['https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Dog Wash', 'Yoga Studio'] },
  { id: 6, name: 'Brickell First', neighborhood: 'Brickell', address: '110 SW 12th St, Miami, FL 33130', lat: 25.7555, lng: -80.1945, priceMin: 3045, priceTier: '$$', concession: '2 months free on 12-month lease', units: ['1B', '2B', '3B'], incomeReq: '3x', creditReq: '>650', guarantor: false, holdDays: [30, 60], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Spa', 'Gym', 'Concierge', 'Valet'] },
  { id: 7, name: 'CMPND', neighborhood: 'Downtown', address: '55 NE 2nd St, Miami, FL 33132', lat: 25.7650, lng: -80.1866, priceMin: 1950, priceTier: '$', concession: 'Two months free on select units', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [14, 30, 60, 90], images: ['https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Pet-Friendly', 'Coworking'] },
  { id: 8, name: 'Miami World Tower', neighborhood: 'Downtown', address: '710 NE 1st Ave, Miami, FL 33132', lat: 25.7660, lng: -80.1875, priceMin: 2410, priceTier: '$$', concession: 'Up to two months free on select apartments', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Concierge', 'Parking', 'Rooftop'] },
  { id: 9, name: 'Muze at Met', neighborhood: 'Downtown', address: '340 SE 3rd St, Miami, FL 33131', lat: 25.7594, lng: -80.1850, priceMin: 2627, priceTier: '$$', concession: '1.5 months free on 1Bs, 1 month on 2/3 beds', units: ['Studio', '1B', '2B', '3B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [14], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Concierge', 'Parking', 'Rooftop'] },
  { id: 10, name: 'Flow Miami World', neighborhood: 'Downtown', address: '698 NE 1st Ave, Miami, FL 33132', lat: 25.7670, lng: -80.1880, priceMin: 2223, priceTier: '$$', concession: '3 months free on all apartments', units: ['Studio', '1B', '2B', '3B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [30], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Concierge', 'Parking', 'Rooftop'] },
  { id: 11, name: 'Monarc at Met', neighborhood: 'Downtown', address: '201 SE 2nd Ave, Miami, FL 33131', lat: 25.7580, lng: -80.1840, priceMin: 2692, priceTier: '$$', concession: 'No current concessions', units: ['Studio', '1B', '2B'], incomeReq: '3x', creditReq: '>650', guarantor: true, holdDays: [14], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Concierge', 'Parking', 'Rooftop'] },
  { id: 12, name: 'Parkline', neighborhood: 'Downtown', address: '100 NW 6th St, Miami, FL 33136', lat: 25.7700, lng: -80.1900, priceMin: 2120, priceTier: '$', concession: 'Up to 3 months free', units: ['Studio', '1B', '2B', '3B'], incomeReq: '3x', creditReq: '>650', guarantor: false, holdDays: [14], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], amenities: ['Pool', 'Gym', 'Concierge', 'Parking', 'Rooftop'] },
];

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
    const leadData = { buildingName: building.name, income: parseInt(formData.income), creditScore: parseInt(formData.credit), moveInDate: formData.moveInDate, qualificationStatus: result, firstName: formData.firstName, phone: formData.phone, timestamp: new Date().toISOString() };
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
                <input
                  type="number"
                  required
                  value={formData.income}
                  onChange={(e) => setFormData({ ...formData, income: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g., 5000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Credit Score</label>
                <input
                  type="number"
                  required
                  value={formData.credit}
                  onChange={(e) => setFormData({ ...formData, credit: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g., 680"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Move-In Date</label>
                <input
                  type="date"
                  required
                  value={formData.moveInDate}
                  onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
                Get My Results
              </button>
            </form>
            <button onClick={onClose} className="mt-4 w-full text-gray-600 py-2 hover:text-gray-900">
              Close
            </button>
          </>
        )}
        {step === 'results' && (
          <>
            <div className="text-center mb-6">
              {result === 'qualify' && (
                <>
                  <div className="text-5xl mb-3">✓</div>
                  <h2 className="text-3xl font-bold text-green-600">You Qualify!</h2>
                  <p className="text-gray-600 mt-2">Great news — you meet the requirements for {building.name}</p>
                </>
              )}
              {result === 'close' && (
                <>
                  <div className="text-5xl mb-3">⚠</div>
                  <h2 className="text-3xl font-bold text-yellow-600">You're Close</h2>
                  <p className="text-gray-600 mt-2">You're slightly below requirements. Let us help you find solutions!</p>
                </>
              )}
              {result === 'not-fit' && (
                <>
                  <div className="text-5xl mb-3">✗</div>
                  <h2 className="text-3xl font-bold text-red-600">Not a Fit</h2>
                  <p className="text-gray-600 mt-2">You don't currently meet the requirements for {building.name}</p>
                </>
              )}
            </div>
            <form onSubmit={handleContactSubmit} className="space-y-4 mt-6">
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="(305) 123-4567"
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
                Get Callback
              </button>
            </form>
            <button onClick={onClose} className="mt-4 w-full text-gray-600 py-2 hover:text-gray-900">
              Close
            </button>
          </>
        )}
        {step === 'contact' && (
          <div className="text-center">
            <div className="text-5xl mb-3">✓</div>
            <h2 className="text-2xl font-bold text-green-600">Thanks {formData.firstName}!</h2>
            <p className="text-gray-600 mt-2">We'll call you soon at {formData.phone}</p>
            <button onClick={onClose} className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const MapComponent = ({ buildings, selectedBuilding, onBuildingClick }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);

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
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [-80.195, 25.76],
          zoom: 13,
        });

        buildings.forEach((building) => {
          const el = document.createElement('div');
          el.className = 'w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:bg-blue-800';
          el.textContent = building.id;
          el.style.border = selectedBuilding?.id === building.id ? '3px solid yellow' : 'none';
          
          new window.mapboxgl.Marker({ element: el })
            .setLngLat([building.lng, building.lat])
            .addTo(map.current)
            .getElement()
            .addEventListener('click', () => onBuildingClick(building));
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
  }, [buildings, selectedBuilding, onBuildingClick]);

  return <div ref={mapContainer} className="w-full h-full" />;
};

export default function Home() {
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    price: 'all',
    units: [],
    income: 'all',
    credit: 'all',
    guarantor: false,
    holdDays: 'all',
  });

  const filtered = BUILDINGS.filter((b) => {
    if (searchTerm && !b.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filters.price !== 'all') {
      const [min, max] = filters.price.split('-').map(Number);
      if (b.priceMin > max) return false;
    }
    if (filters.units.length > 0 && !filters.units.some((u) => b.units.includes(u))) return false;
    if (filters.income !== 'all' && b.incomeReq !== filters.income) return false;
    if (filters.credit !== 'all' && b.creditReq !== filters.credit) return false;
    if (filters.guarantor && !b.guarantor) return false;
    if (filters.holdDays !== 'all' && !b.holdDays.includes(parseInt(filters.holdDays))) return false;
    return true;
  });

  return (
    <div className="h-screen flex flex-col bg-white">
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Miami Rentals</h1>
        <input
          type="text"
          placeholder="Search buildings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 border-r bg-gray-50 p-4 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Price Range</label>
              <select
                value={filters.price}
                onChange={(e) => setFilters({ ...filters, price: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="all">All</option>
                <option value="0-2500">$0 - $2,500</option>
                <option value="2500-3500">$2,500 - $3,500</option>
                <option value="3500-999999">$3,500+</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Unit Type</label>
              <div className="space-y-2">
                {['Studio', '1B', '2B', '3B'].map((unit) => (
                  <label key={unit} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.units.includes(unit)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters({ ...filters, units: [...filters.units, unit] });
                        } else {
                          setFilters({ ...filters, units: filters.units.filter((u) => u !== unit) });
                        }
                      }}
                    />
                    {unit}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Guarantor Support</label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.guarantor}
                  onChange={(e) => setFilters({ ...filters, guarantor: e.target.checked })}
                />
                Required
              </label>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-3">Buildings ({filtered.length})</h3>
              <div className="space-y-2">
                {filtered.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBuilding(b)}
                    className={`w-full text-left p-3 rounded-lg transition ${
                      selectedBuilding?.id === b.id ? 'bg-blue-100 border-2 border-blue-600' : 'bg-white border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-semibold">{b.name}</div>
                    <div className="text-sm text-gray-600">${b.priceMin.toLocaleString()}/mo</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <MapComponent buildings={filtered} selectedBuilding={selectedBuilding} onBuildingClick={setSelectedBuilding} />
        </div>

        {selectedBuilding && (
          <div className="w-80 border-l bg-white p-4 overflow-y-auto">
            <button onClick={() => setSelectedBuilding(null)} className="text-gray-500 mb-4">
              X
            </button>
            <div>
              <h2 className="text-2xl font-bold mb-2">{selectedBuilding.name}</h2>
              <p className="text-gray-600 text-sm mb-4">{selectedBuilding.address}</p>

              <div className="mb-4 h-40 bg-gray-200 rounded-lg overflow-hidden">
                <img src={selectedBuilding.images[0]} alt={selectedBuilding.name} className="w-full h-full object-cover" />
              </div>

              <div className="space-y-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Price Range</div>
                  <div className="font-bold">${selectedBuilding.priceMin.toLocaleString()} - ${selectedBuilding.priceMin + 1500}/mo</div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Requirements</div>
                  <div className="font-bold">{selectedBuilding.incomeReq} income • {selectedBuilding.creditReq} credit</div>
                </div>

                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Concession</div>
                  <div className="font-bold">{selectedBuilding.concession}</div>
                </div>

                <div>
                  <div className="text-sm font-semibold mb-2">Amenities</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedBuilding.amenities.map((a) => (
                      <span key={a} className="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setShowModal(true)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
                >
                  Talk To Don
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showModal && <TalkTodonModal building={selectedBuilding} onClose={() => setShowModal(false)} />}
    </div>
  );
}
