'use client';

import React, { useState, useMemo } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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
    console.log('Lead captured:', { building: building.name, ...formData });
    onClose();
  };

  if (!building) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-8 w-full max-w-2xl max-h-screen overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Talk to Don - {building.name}</h2>
          <button onClick={onClose} className="text-2xl font-bold text-gray-500 hover:text-gray-700">×</button>
        </div>

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Annual Income</label>
              <input type="number" required value={formData.income} onChange={(e) => setFormData({ ...formData, income: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="$50,000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credit Score</label>
              <input type="number" required value={formData.credit} onChange={(e) => setFormData({ ...formData, credit: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" placeholder="650" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Move-in Date</label>
              <input type="date" required value={formData.moveInDate} onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700">Check Qualification</button>
          </form>
        )}

        {step === 'results' && (
          <div className="space-y-6">
            <div className={`p-6 rounded-lg text-center ${result === 'qualify' ? 'bg-green-50 border-2 border-green-200' : result === 'close' ? 'bg-yellow-50 border-2 border-yellow-200' : 'bg-red-50 border-2 border-red-200'}`}>
              <p className={`text-lg font-bold ${result === 'qualify' ? 'text-green-700' : result === 'close' ? 'text-yellow-700' : 'text-red-700'}`}>
                {result === 'qualify' ? '✓ You Qualify!' : result === 'close' ? '⚠ You\'re Close' : '✗ Not a Good Fit'}
              </p>
              <p className="text-sm mt-2 text-gray-600">
                {result === 'qualify' ? 'Great news! You meet the requirements.' : result === 'close' ? 'You\'re close! Contact Don to discuss options.' : 'We recommend finding a different property.'}
              </p>
            </div>

            {(result === 'qualify' || result === 'close') && (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700">Let Don Contact Me</button>
              </form>
            )}

            <button onClick={onClose} className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50">Close</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function MiamiRentals() {
  const [filters, setFilters] = useState({ price: 'all', units: [], income: 'all', credit: 'all', guarantor: false, holdDays: 'all' });
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedBuildingForModal, setSelectedBuildingForModal] = useState(null);
  const [viewState, setViewState] = useState({ longitude: -80.195, latitude: 25.760, zoom: 13 });

  const filteredBuildings = useMemo(() => {
    return BUILDINGS.filter(b => {
      if (filters.price !== 'all' && b.priceTier !== filters.price) return false;
      if (filters.units.length > 0 && !filters.units.some(u => b.units.includes(u))) return false;
      if (filters.income !== 'all' && b.incomeReq !== filters.income) return false;
      if (filters.credit !== 'all' && b.creditReq !== filters.credit) return false;
      if (filters.guarantor && !b.guarantor) return false;
      if (filters.holdDays !== 'all' && !b.holdDays.includes(parseInt(filters.holdDays))) return false;
      return true;
    });
  }, [filters]);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Miami Rentals</h1>
        <input type="text" placeholder="Search buildings..." className="flex-1 max-w-md border border-gray-300 rounded-lg px-4 py-2 text-sm" />
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price Tier</label>
            <select value={filters.price} onChange={(e) => setFilters({ ...filters, price: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="all">All Prices</option>
              <option value="$">$ (Budget)</option>
              <option value="$$">$$ (Mid-Range)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">Units <InfoTooltip text="Filter by apartment unit types" /></label>
            <div className="space-y-2">
              {['Studio', '1B', '2B', '3B'].map(unit => (
                <label key={unit} className="flex items-center gap-2">
                  <input type="checkbox" checked={filters.units.includes(unit)} onChange={(e) => setFilters({ ...filters, units: e.target.checked ? [...filters.units, unit] : filters.units.filter(u => u !== unit) })} />
                  <span className="text-sm">{unit}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Income Requirement</label>
            <select value={filters.income} onChange={(e) => setFilters({ ...filters, income: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="all">All</option>
              <option value="2.5x">2.5x</option>
              <option value="3x">3x</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hold Days</label>
            <select value={filters.holdDays} onChange={(e) => setFilters({ ...filters, holdDays: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="all">All</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
            </select>
          </div>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={filters.guarantor} onChange={(e) => setFilters({ ...filters, guarantor: e.target.checked })} />
            <span className="text-sm">Guarantor Support</span>
          </label>
        </div>

        <div className="flex-1 relative">
          {mapboxToken ? (
            <Map
              {...viewState}
              onMove={evt => setViewState(evt.viewState)}
              style={{ width: '100%', height: '100%' }}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              mapboxAccessToken={mapboxToken}
            >
              {filteredBuildings.map(building => (
                <Marker
                  key={building.id}
                  longitude={building.lng}
                  latitude={building.lat}
                  anchor="bottom"
                  onClick={() => setSelectedBuilding(building)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer transition ${selectedBuilding?.id === building.id ? 'bg-orange-500 ring-2 ring-orange-300' : 'bg-blue-500'}`}>
                    {building.id}
                  </div>
                </Marker>
              ))}
              {selectedBuilding && (
                <Popup
                  longitude={selectedBuilding.lng}
                  latitude={selectedBuilding.lat}
                  anchor="top"
                  onClose={() => setSelectedBuilding(null)}
                  closeButton={false}
                  closeOnClick={false}
                >
                  <div className="p-3 bg-white rounded max-w-xs">
                    <h3 className="font-bold text-sm">{selectedBuilding.name}</h3>
                    <p className="text-xs text-gray-600">${selectedBuilding.priceMin}/mo</p>
                  </div>
                </Popup>
              )}
            </Map>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-200 text-gray-600">
              <p>Mapbox token not configured. Please add NEXT_PUBLIC_MAPBOX_TOKEN to your environment variables.</p>
            </div>
          )}
        </div>

        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto p-4 space-y-4">
          <h2 className="text-lg font-bold">Buildings</h2>
          {filteredBuildings.length === 0 ? (
            <p className="text-gray-600 text-sm">No buildings match your filters.</p>
          ) : (
            <div className="space-y-2">
              {filteredBuildings.map(building => (
                <div
                  key={building.id}
                  onClick={() => setSelectedBuilding(building)}
                  className={`p-3 rounded-lg cursor-pointer transition ${selectedBuilding?.id === building.id ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-50 border border-gray-200 hover:border-gray-300'}`}
                >
                  <h3 className="font-bold text-sm">{building.name}</h3>
                  <p className="text-xs text-gray-600">{building.neighborhood}</p>
                  <p className="text-sm font-semibold text-blue-600">From ${building.priceMin}/mo</p>
                </div>
              ))}
            </div>
          )}

          {selectedBuilding && (
            <div className="border-t-2 pt-4 mt-4">
              <h3 className="font-bold text-lg mb-3">{selectedBuilding.name}</h3>
              <ImageCarousel images={selectedBuilding.images} />
              <div className="mt-3 space-y-2 text-sm">
                <p><strong>Address:</strong> {selectedBuilding.address}</p>
                <p><strong>Price:</strong> From ${selectedBuilding.priceMin}/mo</p>
                <p><strong>Move-in Special:</strong> {selectedBuilding.concession}</p>
                <p><strong>Units:</strong> {selectedBuilding.units.join(', ')}</p>
                <p><strong>Amenities:</strong> {selectedBuilding.amenities.join(', ')}</p>
                <p><strong>Requirements:</strong> {selectedBuilding.incomeReq} income, {selectedBuilding.creditReq} credit</p>
              </div>
              <button onClick={() => setSelectedBuildingForModal(selectedBuilding)} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 mt-4">Talk to Don</button>
            </div>
          )}
        </div>
      </div>

      {selectedBuildingForModal && (
        <TalkTodonModal building={selectedBuildingForModal} onClose={() => setSelectedBuildingForModal(null)} />
      )}
    </div>
  );
}
