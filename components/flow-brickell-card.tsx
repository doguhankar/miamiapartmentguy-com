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
  const [refreshing, setRefreshing] = useState(false);

  const fetchPricing = async () => {
    try {
      setRefreshing(true);
      setError(null);
      console.log('[v0] Fetching Flow Brickell pricing from /api/prices/flow-brickell...');
      
      // Add cache-busting timestamp to force fresh fetch
      const timestamp = new Date().getTime();
      const res = await fetch(`/api/prices/flow-brickell?t=${timestamp}`);
      console.log('[v0] API response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('[v0] API error response:', errorText);
        setError('Error loading pricing. Please try again.');
        setUnits([]);
        return;
      }
      
      const data: PricingData = await res.json();
      console.log('[v0] API response data:', data);
      console.log('[v0] API buildingId:', data.buildingId);
      console.log('[v0] API updatedAt:', data.updatedAt);
      console.log('[v0] API units count:', data.units?.length || 0);
      
      const unitList = data.units || [];
      console.log('[v0] Full units array:', unitList);
      console.log('[v0] First 5 units:', unitList.slice(0, 5));
      console.log('[v0] Last 5 units:', unitList.slice(-5));
      
      setUnits(unitList);
      setError(null);
      
      // Find minimum price
      if (unitList.length > 0) {
        const prices = unitList.map(u => u.price);
        console.log('[v0] All prices:', prices);
        const min = Math.min(...prices);
        setMinPrice(min);
        console.log('[v0] Minimum price:', min);
        console.log('[v0] Successfully loaded', unitList.length, 'units');
      } else {
        console.warn('[v0] No units in API response');
        setError('No units available');
      }
    } catch (err) {
      console.error('[v0] Error fetching Flow Brickell pricing:', err);
      setError('Error loading pricing. Please try again.');
      setUnits([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    console.log('[v0] FlowBrickellCard component mounted, fetching pricing...');
    fetchPricing();
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
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-semibold text-gray-900">Available Units</p>
          <button
            onClick={fetchPricing}
            disabled={refreshing || loading}
            className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        
        {loading && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded text-center">
            <p className="text-sm text-blue-700">Loading units...</p>
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-700 font-medium">{error}</p>
            {!loading && (
              <button
                onClick={fetchPricing}
                disabled={refreshing}
                className="mt-2 text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                Try Again
              </button>
            )}
          </div>
        )}
        
        {!loading && !error && units.length === 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-center">
            <p className="text-sm text-yellow-800">No units available yet. Check back soon.</p>
          </div>
        )}
        
        {!loading && !error && units.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded p-2 bg-white">
            {units.map((unit, idx) => {
              const unitTypeLabel = unit.floorPlanType === 'Studio' 
                ? 'Studio' 
                : unit.beds ? `${unit.beds} Bedroom${unit.beds > 1 ? 's' : ''}` 
                : unit.floorPlanType;
              
              return (
                <div key={idx} className="p-3 bg-white border border-gray-200 rounded-lg">
                  {/* Top Row: Price (left) and Availability (right) */}
                  <div className="flex justify-between items-start gap-3 mb-2">
                    <div>
                      <p className="text-xl font-bold text-blue-600">${unit.price.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">/month</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded">{unit.availableDate}</p>
                    </div>
                  </div>
                  
                  {/* Bottom Row: Unit Type (left) and Sqft (right) */}
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{unitTypeLabel}</p>
                    </div>
                    <div className="text-right">
                      {unit.sqft && (
                        <p className="text-sm text-gray-700">{unit.sqft.toLocaleString()} sqft</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
