'use client';

import React, { useState, useRef, useEffect } from 'react';

export const MapPinTooltip = ({ 
  building, 
  onViewDetails, 
  isVisible 
}: { 
  building: any; 
  onViewDetails: (building: any) => void;
  isVisible: boolean;
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  if (!isVisible || !building) return null;

  // Calculate price range display
  const priceMax = Math.round(building.priceMin * 1.45); // Rough estimate
  const priceDisplay = `$${building.priceMin.toLocaleString()} - $${priceMax.toLocaleString()}/mo`;

  return (
    <div
      ref={tooltipRef}
      className="fixed z-50 pointer-events-auto"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Tooltip Container */}
      <div className="animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Arrow pointing down to pin */}
        <div 
          className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white border-b border-r border-gray-300 rotate-45"
          style={{ boxShadow: '-1px -1px 0 rgba(0,0,0,0.1)' }}
        />

        {/* Main Tooltip */}
        <div className="bg-white rounded-lg border border-gray-300 p-4 w-72 shadow-lg" style={{
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          borderWidth: '0.5px',
        }}>
          {/* Building Photo */}
          <div className="mb-3 -mx-4 -mt-4 overflow-hidden rounded-t-lg">
            <img
              src={building.images?.[0] || 'https://via.placeholder.com/288x100'}
              alt={building.name}
              className="w-full h-24 object-cover"
            />
          </div>

          {/* Building Name */}
          <h3 className="text-sm font-bold text-gray-900 mb-1">
            {building.name}
          </h3>

          {/* Neighborhood */}
          <p className="text-xs text-gray-500 mb-2">
            {building.neighborhood}
          </p>

          {/* Price Range */}
          <p className="text-sm font-bold text-blue-600 mb-3">
            {priceDisplay}
          </p>

          {/* View Details Button */}
          <button
            onClick={() => onViewDetails(building)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 px-3 rounded transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};
