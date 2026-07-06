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
  buildingCount?: number;
  expandedNeighborhoods?: string[];
  onNeighborhoodToggle?: (neighborhood: string) => void;
}

export function MapFilterCard({ 
  filters, 
  onFilterChange, 
  onClearAll, 
  buildingCount = 107,
  expandedNeighborhoods = [],
  onNeighborhoodToggle 
}: MapFilterCardProps) {
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
    <div className="w-full flex items-center justify-between px-8 py-4 bg-[#0a0e1a] border-b border-[#0F1B30] gap-4">
      {/* Left side - Filter pills */}
      <div className="flex items-center gap-3">
        {/* Neighborhood Pill - Only show when at least one is selected */}
        {expandedNeighborhoods.length > 0 && (
          <div className="relative">
            <button
              onClick={() => onNeighborhoodToggle && onNeighborhoodToggle(expandedNeighborhoods[0])}
              className="flex items-center justify-between px-5 py-3 rounded-full transition-all"
              style={{
                background: 'transparent',
                border: '2px solid #5eead4',
                color: '#5eead4',
                fontSize: '15px'
              }}
            >
              <span className="font-medium truncate">Neighborhood: {expandedNeighborhoods[0]}</span>
              <span className="ml-2">▾</span>
            </button>
          </div>
        )}

        {/* Bedrooms Dropdown */}
        <div className="relative">
        <button
          onClick={() => setOpenDropdown(openDropdown === 'bedrooms' ? null : 'bedrooms')}
          className="flex items-center justify-between px-5 py-3 rounded-full transition-all"
          style={{
            background: '#0F1B30',
            border: '1px solid rgba(255,255,255,.12)',
            color: '#F6F8F9',
            fontSize: '15px',
            ...(openDropdown === 'bedrooms' ? { borderColor: '#19C6C0', color: '#19C6C0' } : {})
          }}
        >
          <span className="font-medium truncate">{getSelectedLabel('bedrooms')}</span>
          <ChevronDown className={`h-4 w-4 ml-2 transition-transform flex-shrink-0 ${openDropdown === 'bedrooms' ? 'rotate-180' : ''}`} />
        </button>
        {openDropdown === 'bedrooms' && (
          <div className="absolute top-full left-0 mt-2 w-56 rounded-lg shadow-lg z-20" style={{ background: '#0F1B30', border: '1px solid #19C6C0' }}>
            {bedroomOptions.map(option => (
              <button
                key={option}
                onClick={() => toggleBedroom(option)}
                className="w-full text-left px-4 py-2 flex items-center gap-2 text-sm transition-colors"
                style={{
                  color: (option === 'All bedrooms' ? filters.bedrooms.length === 0 : filters.bedrooms.includes(option)) ? '#19C6C0' : '#B8C4D4',
                  background: (option === 'All bedrooms' ? filters.bedrooms.length === 0 : filters.bedrooms.includes(option)) ? 'rgba(25, 198, 192, 0.1)' : 'transparent',
                  borderBottom: option !== bedroomOptions[bedroomOptions.length - 1] ? '1px solid rgba(255,255,255,.05)' : 'none'
                }}
                onMouseEnter={(e) => { if (!((option === 'All bedrooms' ? filters.bedrooms.length === 0 : filters.bedrooms.includes(option)))) e.target.style.background = 'rgba(255,255,255,.05)'; }}
                onMouseLeave={(e) => { if (!((option === 'All bedrooms' ? filters.bedrooms.length === 0 : filters.bedrooms.includes(option)))) e.target.style.background = 'transparent'; }}
              >
                <input
                  type="checkbox"
                  checked={option === 'All bedrooms' ? filters.bedrooms.length === 0 : filters.bedrooms.includes(option)}
                  readOnly
                  className="rounded"
                  style={{ accentColor: '#19C6C0' }}
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
          className="flex items-center justify-between px-5 py-3 rounded-full transition-all"
          style={{
            background: '#0F1B30',
            border: '1px solid rgba(255,255,255,.12)',
            color: '#F6F8F9',
            fontSize: '15px',
            ...(openDropdown === 'price' ? { borderColor: '#19C6C0', color: '#19C6C0' } : {})
          }}
        >
          <span className="font-medium truncate">{getSelectedLabel('price')}</span>
          <ChevronDown className={`h-4 w-4 ml-2 transition-transform flex-shrink-0 ${openDropdown === 'price' ? 'rotate-180' : ''}`} />
        </button>
        {openDropdown === 'price' && (
          <div className="absolute top-full left-0 mt-2 w-56 rounded-lg shadow-lg z-20" style={{ background: '#0F1B30', border: '1px solid #19C6C0' }}>
            {priceOptions.map(option => (
              <button
                key={option}
                onClick={() => togglePrice(option)}
                className="w-full text-left px-4 py-2 flex items-center gap-2 text-sm transition-colors"
                style={{
                  color: (option === 'All prices' ? filters.price.length === 0 : filters.price.includes(option)) ? '#19C6C0' : '#B8C4D4',
                  background: (option === 'All prices' ? filters.price.length === 0 : filters.price.includes(option)) ? 'rgba(25, 198, 192, 0.1)' : 'transparent',
                  borderBottom: option !== priceOptions[priceOptions.length - 1] ? '1px solid rgba(255,255,255,.05)' : 'none'
                }}
                onMouseEnter={(e) => { if (!((option === 'All prices' ? filters.price.length === 0 : filters.price.includes(option)))) e.target.style.background = 'rgba(255,255,255,.05)'; }}
                onMouseLeave={(e) => { if (!((option === 'All prices' ? filters.price.length === 0 : filters.price.includes(option)))) e.target.style.background = 'transparent'; }}
              >
                <input
                  type="checkbox"
                  checked={option === 'All prices' ? filters.price.length === 0 : filters.price.includes(option)}
                  readOnly
                  className="rounded"
                  style={{ accentColor: '#19C6C0' }}
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
          className="flex items-center justify-between px-5 py-3 rounded-full transition-all"
          style={{
            background: '#0F1B30',
            border: '1px solid rgba(255,255,255,.12)',
            color: '#F6F8F9',
            fontSize: '15px',
            ...(openDropdown === 'moveIn' ? { borderColor: '#19C6C0', color: '#19C6C0' } : {})
          }}
        >
          <span className="font-medium truncate">{getSelectedLabel('moveIn')}</span>
          <ChevronDown className={`h-4 w-4 ml-2 transition-transform flex-shrink-0 ${openDropdown === 'moveIn' ? 'rotate-180' : ''}`} />
        </button>
        {openDropdown === 'moveIn' && (
          <div className="absolute top-full left-0 mt-2 w-56 rounded-lg shadow-lg z-20" style={{ background: '#0F1B30', border: '1px solid #19C6C0' }}>
            {moveInOptions.map(option => (
              <button
                key={option}
                onClick={() => toggleMoveIn(option)}
                className="w-full text-left px-4 py-2 flex items-center gap-2 text-sm transition-colors"
                style={{
                  color: (option === 'Any date' ? filters.moveInDate.length === 0 : filters.moveInDate.includes(option)) ? '#19C6C0' : '#B8C4D4',
                  background: (option === 'Any date' ? filters.moveInDate.length === 0 : filters.moveInDate.includes(option)) ? 'rgba(25, 198, 192, 0.1)' : 'transparent',
                  borderBottom: option !== moveInOptions[moveInOptions.length - 1] ? '1px solid rgba(255,255,255,.05)' : 'none'
                }}
                onMouseEnter={(e) => { if (!((option === 'Any date' ? filters.moveInDate.length === 0 : filters.moveInDate.includes(option)))) e.target.style.background = 'rgba(255,255,255,.05)'; }}
                onMouseLeave={(e) => { if (!((option === 'Any date' ? filters.moveInDate.length === 0 : filters.moveInDate.includes(option)))) e.target.style.background = 'transparent'; }}
              >
                <input
                  type="checkbox"
                  checked={option === 'Any date' ? filters.moveInDate.length === 0 : filters.moveInDate.includes(option)}
                  readOnly
                  className="rounded"
                  style={{ accentColor: '#19C6C0' }}
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
            className="px-5 py-3 rounded-full transition-all font-medium flex items-center gap-2"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#7E8CA0',
              fontSize: '15px'
            }}
            onMouseEnter={(e) => { e.target.style.color = '#B8C4D4'; }}
            onMouseLeave={(e) => { e.target.style.color = '#7E8CA0'; }}
          >
            <span>✕</span>
            Clear filters
          </button>
        )}
      </div>

      {/* Right side - Building count */}
      <div className="flex items-center gap-2 ml-auto">
        <span className="text-lg font-black" style={{ color: '#ec4899' }}>{buildingCount}</span>
        <span className="text-sm" style={{ color: '#7E8CA0' }}>buildings live</span>
      </div>
    </div>
  );
}
