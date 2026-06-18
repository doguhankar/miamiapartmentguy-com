'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface MapFilterState {
  bedrooms: string[];
  price: string[];
  moveInDate: string[];
}

interface MapFilterCardProps {
  filters: MapFilterState;
  onFilterChange: (filters: MapFilterState) => void;
  onClearAll: () => void;
}

export function MapFilterCard({ filters, onFilterChange, onClearAll }: MapFilterCardProps) {
  const [openDropdown, setOpenDropdown] = useState<'bedrooms' | 'price' | 'moveIn' | null>(null);

  const bedroomOptions = ['All bedrooms', 'Studio', '1 Bedroom', '2 Bedrooms', '3+ Bedrooms'];
  const priceOptions = ['All prices', '$0-$2,000', '$2,000-$4,000', '$4,000+'];
  const moveInOptions = ['Any date', 'ASAP', 'Within 30 days', 'Flexible'];

  const toggleBedroom = (option: string) => {
    if (option === 'All bedrooms') {
      onFilterChange({ ...filters, bedrooms: [] });
    } else {
      const newBedrooms = filters.bedrooms.includes(option)
        ? filters.bedrooms.filter(b => b !== option)
        : [...filters.bedrooms, option];
      onFilterChange({ ...filters, bedrooms: newBedrooms });
    }
  };

  const togglePrice = (option: string) => {
    if (option === 'All prices') {
      onFilterChange({ ...filters, price: [] });
    } else {
      const newPrice = filters.price.includes(option)
        ? filters.price.filter(p => p !== option)
        : [...filters.price, option];
      onFilterChange({ ...filters, price: newPrice });
    }
  };

  const toggleMoveIn = (option: string) => {
    if (option === 'Any date') {
      onFilterChange({ ...filters, moveInDate: [] });
    } else {
      const newMoveIn = filters.moveInDate.includes(option)
        ? filters.moveInDate.filter(m => m !== option)
        : [...filters.moveInDate, option];
      onFilterChange({ ...filters, moveInDate: newMoveIn });
    }
  };

  const hasActiveFilters = filters.bedrooms.length > 0 || filters.price.length > 0 || filters.moveInDate.length > 0;

  const getSelectedLabel = (type: 'bedrooms' | 'price' | 'moveIn'): string => {
    if (type === 'bedrooms') {
      if (filters.bedrooms.length === 0) return 'Bedroom Size';
      if (filters.bedrooms.length === 1) return filters.bedrooms[0];
      return `${filters.bedrooms.length} selected`;
    } else if (type === 'price') {
      if (filters.price.length === 0) return 'Price';
      if (filters.price.length === 1) {
        // Format price display nicely
        const priceStr = filters.price[0];
        if (priceStr === '$0-$2,000') return '$0 - $2,000';
        if (priceStr === '$2,000-$4,000') return '$2,000 - $4,000';
        if (priceStr === '$4,000+') return '$4,000+';
        return priceStr;
      }
      return `${filters.price.length} selected`;
    } else {
      if (filters.moveInDate.length === 0) return 'Move in Date';
      if (filters.moveInDate.length === 1) return filters.moveInDate[0];
      return `${filters.moveInDate.length} selected`;
    }
  };

  return (
    <div className="absolute top-6 left-6 z-10 flex gap-4 items-center">
      {/* Bedrooms Dropdown */}
      <div className="relative">
        <button
          onClick={() => setOpenDropdown(openDropdown === 'bedrooms' ? null : 'bedrooms')}
          className="flex items-center justify-between px-3 py-2 w-40 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors shadow-sm"
        >
          <span className="text-sm font-medium text-gray-700 truncate">{getSelectedLabel('bedrooms')}</span>
          <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform flex-shrink-0 ${openDropdown === 'bedrooms' ? 'rotate-180' : ''}`} />
        </button>
        {openDropdown === 'bedrooms' && (
          <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-300 rounded-md shadow-lg z-20">
            {bedroomOptions.map(option => (
              <button
                key={option}
                onClick={() => toggleBedroom(option)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={option === 'All bedrooms' ? filters.bedrooms.length === 0 : filters.bedrooms.includes(option)}
                  readOnly
                  className="rounded"
                />
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Price Dropdown */}
      <div className="relative">
        <button
          onClick={() => setOpenDropdown(openDropdown === 'price' ? null : 'price')}
          className="flex items-center justify-between px-3 py-2 w-40 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors shadow-sm"
        >
          <span className="text-sm font-medium text-gray-700 truncate">{getSelectedLabel('price')}</span>
          <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform flex-shrink-0 ${openDropdown === 'price' ? 'rotate-180' : ''}`} />
        </button>
        {openDropdown === 'price' && (
          <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-300 rounded-md shadow-lg z-20">
            {priceOptions.map(option => (
              <button
                key={option}
                onClick={() => togglePrice(option)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={option === 'All prices' ? filters.price.length === 0 : filters.price.includes(option)}
                  readOnly
                  className="rounded"
                />
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Move-in Date Dropdown */}
      <div className="relative">
        <button
          onClick={() => setOpenDropdown(openDropdown === 'moveIn' ? null : 'moveIn')}
          className="flex items-center justify-between px-3 py-2 w-40 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors shadow-sm"
        >
          <span className="text-sm font-medium text-gray-700 truncate">{getSelectedLabel('moveIn')}</span>
          <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform flex-shrink-0 ${openDropdown === 'moveIn' ? 'rotate-180' : ''}`} />
        </button>
        {openDropdown === 'moveIn' && (
          <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-300 rounded-md shadow-lg z-20">
            {moveInOptions.map(option => (
              <button
                key={option}
                onClick={() => toggleMoveIn(option)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={option === 'Any date' ? filters.moveInDate.length === 0 : filters.moveInDate.includes(option)}
                  readOnly
                  className="rounded"
                />
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <button
          onClick={onClearAll}
          className="px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium text-gray-700"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
