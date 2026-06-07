'use client';

import React, { useState, useEffect } from 'react';

interface PricingUnit {
  floorPlanType: string;
  price: number;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  availableDate: string;
}

interface PricingData {
  buildingId: string;
  updatedAt: string;
  units: PricingUnit[];
}

export function FlowBrickellCard({ onOpenModal }: { onOpenModal: () => void }) {
  const [units, setUnits] = useState<PricingUnit[]>([]);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/prices/flow-brickell');
        if (!res.ok) {
          setError('Pricing data unavailable');
          setUnits([]);
          return;
        }
        const data: PricingData = await res.json();
        const unitList = data.units || [];
        setUnits(unitList);
        
        // Find minimum price
        if (unitList.length > 0) {
          const min = Math.min(...unitList.map(u => u.price));
          setMinPrice(min);
        }
      } catch (err) {
        console.error('Error fetching Flow Brickell pricing:', err);
        setError('Unable to load pricing');
      } finally {
        setLoading(false);
      }
    };

    fetchPricing();
    
    // Refresh every 24 hours (86400000 ms)
    const interval = setInterval(fetchPricing, 86400000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">Flow Brickell</h2>
        <p className="text-xs text-gray-600">Brickell</p>
        <p className="text-xs text-gray-600 mt-1">275 SW 6th St, Miami, FL 33130</p>
      </div>

      {/* Starting Price */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500 font-medium mb-1">Starting Price</p>
        <p className="text-2xl font-bold text-gray-900">
          {minPrice ? `$${minPrice.toLocaleString()}/mo` : 'Loading...'}
        </p>
      </div>

      {/* Special Offer */}
      <div className="p-3 bg-blue-50 border border-blue-300 rounded-lg">
        <p className="text-xs font-semibold text-blue-900">Special Offer</p>
        <p className="text-sm font-bold text-blue-600">6 weeks free on select units</p>
      </div>

      {/* Available Units */}
      <div>
        <p className="text-sm font-semibold text-gray-900 mb-2">Available Units</p>
        {loading && <p className="text-xs text-gray-600">Loading units...</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
        {!loading && units.length === 0 && (
          <p className="text-xs text-gray-600">No units available yet. Check back soon.</p>
        )}
        {!loading && units.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {units.map((unit, idx) => (
              <div key={idx} className="p-2 bg-gray-50 rounded text-xs">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <span className="font-semibold text-gray-900">{unit.floorPlanType}</span>
                  <span className="text-blue-600 font-bold">${unit.price.toLocaleString()}</span>
                </div>
                <div className="flex gap-3 text-gray-600">
                  {unit.sqft && <span>{unit.sqft} sqft</span>}
                  <span>{unit.availableDate}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Requirements & Fees */}
      <div className="space-y-2">
        <div className="p-2 bg-gray-50 rounded">
          <p className="text-xs text-gray-600">Income Requirement</p>
          <p className="text-sm font-semibold text-gray-900">2.5x monthly rent</p>
        </div>
        <div className="p-2 bg-gray-50 rounded">
          <p className="text-xs text-gray-600">Credit Requirement</p>
          <p className="text-sm font-semibold text-gray-900">650+</p>
        </div>
        <div className="p-2 bg-gray-50 rounded">
          <p className="text-xs text-gray-600">Guarantor</p>
          <p className="text-sm font-semibold text-gray-900">Accepted</p>
        </div>
        <div className="p-2 bg-gray-50 rounded">
          <p className="text-xs text-gray-600">Hold Days</p>
          <p className="text-sm font-semibold text-gray-900">30/60/90 days</p>
        </div>
      </div>

      {/* Fees */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-sm font-semibold text-gray-900 mb-2">Fees</p>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Security Deposit</span>
            <span className="font-semibold">$2,465</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Application Fee</span>
            <span className="font-semibold">$75</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Admin Fee</span>
            <span className="font-semibold">$150</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Pet Fee (monthly)</span>
            <span className="font-semibold">$35</span>
          </div>
        </div>
      </div>

      {/* Button */}
      <button 
        onClick={onOpenModal} 
        className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
      >
        Text Don About Flow Brickell
      </button>
    </div>
  );
}
