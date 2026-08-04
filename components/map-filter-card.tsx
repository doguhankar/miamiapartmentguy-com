'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { neighborhoodCenters } from '@/lib/neighborhood-centers';

export interface MapFilterState {
  bedrooms: string[];
  price: string[];
  moveInDate: string[];
  neighborhood: string | null;
}

interface MapFilterCardProps {
  filters: MapFilterState;
  onFilterChange: (filters: MapFilterState) => void;
  onClearAll: () => void;
  buildingCount?: number;
  onNeighborhoodFlyTo?: (neighborhood: string) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export function MapFilterCard({
  filters,
  onFilterChange,
  onClearAll,
  buildingCount = 107,
  onNeighborhoodFlyTo,
  searchQuery = '',
  onSearchChange,
}: MapFilterCardProps) {
  const [openDropdown, setOpenDropdown] = useState<'neighborhood' | 'bedrooms' | 'price' | 'moveIn' | null>(null);

  const neighborhoodOptions = Object.keys(neighborhoodCenters).sort();

  const handleNeighborhoodSelect = (neighborhood: string) => {
    if (filters.neighborhood === neighborhood) {
      onFilterChange({ ...filters, neighborhood: null });
      setOpenDropdown(null);
    } else {
      onFilterChange({ ...filters, neighborhood });
      onNeighborhoodFlyTo?.(neighborhood);
      setOpenDropdown(null);
    }
  };

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

  const hasActiveFilters =
    filters.neighborhood !== null ||
    filters.bedrooms.length > 0 ||
    filters.price.length > 0 ||
    filters.moveInDate.length > 0;

  const getSelectedLabel = (type: 'bedrooms' | 'price' | 'moveIn'): string => {
    if (type === 'bedrooms') {
      if (filters.bedrooms.length === 0) return 'Bedroom Size';
      if (filters.bedrooms.length === 1) return filters.bedrooms[0];
      return `${filters.bedrooms.length} selected`;
    } else if (type === 'price') {
      if (filters.price.length === 0) return 'Price';
      if (filters.price.length === 1) return filters.price[0];
      return `${filters.price.length} selected`;
    } else {
      if (filters.moveInDate.length === 0) return 'Move in Date';
      if (filters.moveInDate.length === 1) return filters.moveInDate[0];
      return `${filters.moveInDate.length} selected`;
    }
  };

  const pillStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    borderRadius: '999px',
    background: active ? 'transparent' : '#182236',
    border: active ? '2px solid #19C6C0' : '1px solid rgba(255,255,255,0.10)',
    color: active ? '#19C6C0' : '#C8D3E6',
    fontSize: '13.5px',
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.12s ease',
    fontFamily: 'inherit',
  });

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    minWidth: '200px',
    background: '#0F1B30',
    border: '1px solid #19C6C0',
    borderRadius: '10px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.36)',
    zIndex: 50,
    overflow: 'hidden',
  };

  const dropdownItemStyle = (selected: boolean): React.CSSProperties => ({
    width: '100%',
    textAlign: 'left',
    padding: '9px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: selected ? '#19C6C0' : '#B8C4D4',
    background: selected ? 'rgba(25, 198, 192, 0.08)' : 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.1s',
  });

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 20px',
      background: '#0B1220',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      {/* Search — leftmost, pink border */}
      <input
        type="text"
        placeholder="Search buildings..."
        value={searchQuery}
        onChange={(e) => onSearchChange?.(e.target.value)}
        style={{
          width: '220px',
          flexShrink: 0,
          background: '#182236',
          border: '1px solid #FF4D8D',
          borderRadius: '999px',
          padding: '10px 16px',
          color: '#F0F4FC',
          fontSize: '13px',
          outline: 'none',
          fontFamily: 'inherit',
          transition: 'box-shadow 0.12s',
        }}
        onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px rgba(255,77,141,0.22)' }}
        onBlur={(e) => { e.target.style.boxShadow = 'none' }}
      />

      {/* Price */}
      <div style={{ position: 'relative' }}>
        <button
          style={pillStyle(filters.price.length > 0)}
          onClick={() => setOpenDropdown(openDropdown === 'price' ? null : 'price')}
        >
          <span>{getSelectedLabel('price')}</span>
          <ChevronDown style={{ width: 14, height: 14, transition: 'transform 0.15s', transform: openDropdown === 'price' ? 'rotate(180deg)' : 'none' }} />
        </button>
        {openDropdown === 'price' && (
          <div style={dropdownStyle}>
            {priceOptions.map(opt => (
              <button
                key={opt}
                style={dropdownItemStyle(opt === 'All prices' ? filters.price.length === 0 : filters.price.includes(opt))}
                onClick={() => togglePrice(opt)}
                onMouseEnter={(e) => { if (!(opt === 'All prices' ? filters.price.length === 0 : filters.price.includes(opt))) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                onMouseLeave={(e) => { if (!(opt === 'All prices' ? filters.price.length === 0 : filters.price.includes(opt))) e.currentTarget.style.background = 'transparent' }}
              >
                <input type="checkbox" readOnly style={{ accentColor: '#19C6C0', pointerEvents: 'none' }} checked={opt === 'All prices' ? filters.price.length === 0 : filters.price.includes(opt)} />
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bedroom Size */}
      <div style={{ position: 'relative' }}>
        <button
          style={pillStyle(filters.bedrooms.length > 0)}
          onClick={() => setOpenDropdown(openDropdown === 'bedrooms' ? null : 'bedrooms')}
        >
          <span>{getSelectedLabel('bedrooms')}</span>
          <ChevronDown style={{ width: 14, height: 14, transition: 'transform 0.15s', transform: openDropdown === 'bedrooms' ? 'rotate(180deg)' : 'none' }} />
        </button>
        {openDropdown === 'bedrooms' && (
          <div style={dropdownStyle}>
            {bedroomOptions.map(opt => (
              <button
                key={opt}
                style={dropdownItemStyle(opt === 'All bedrooms' ? filters.bedrooms.length === 0 : filters.bedrooms.includes(opt))}
                onClick={() => toggleBedroom(opt)}
                onMouseEnter={(e) => { if (!(opt === 'All bedrooms' ? filters.bedrooms.length === 0 : filters.bedrooms.includes(opt))) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                onMouseLeave={(e) => { if (!(opt === 'All bedrooms' ? filters.bedrooms.length === 0 : filters.bedrooms.includes(opt))) e.currentTarget.style.background = 'transparent' }}
              >
                <input type="checkbox" readOnly style={{ accentColor: '#19C6C0', pointerEvents: 'none' }} checked={opt === 'All bedrooms' ? filters.bedrooms.length === 0 : filters.bedrooms.includes(opt)} />
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Move in Date */}
      <div style={{ position: 'relative' }}>
        <button
          style={pillStyle(filters.moveInDate.length > 0)}
          onClick={() => setOpenDropdown(openDropdown === 'moveIn' ? null : 'moveIn')}
        >
          <span>{getSelectedLabel('moveIn')}</span>
          <ChevronDown style={{ width: 14, height: 14, transition: 'transform 0.15s', transform: openDropdown === 'moveIn' ? 'rotate(180deg)' : 'none' }} />
        </button>
        {openDropdown === 'moveIn' && (
          <div style={dropdownStyle}>
            {moveInOptions.map(opt => (
              <button
                key={opt}
                style={dropdownItemStyle(opt === 'Any date' ? filters.moveInDate.length === 0 : filters.moveInDate.includes(opt))}
                onClick={() => toggleMoveIn(opt)}
                onMouseEnter={(e) => { if (!(opt === 'Any date' ? filters.moveInDate.length === 0 : filters.moveInDate.includes(opt))) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                onMouseLeave={(e) => { if (!(opt === 'Any date' ? filters.moveInDate.length === 0 : filters.moveInDate.includes(opt))) e.currentTarget.style.background = 'transparent' }}
              >
                <input type="checkbox" readOnly style={{ accentColor: '#19C6C0', pointerEvents: 'none' }} checked={opt === 'Any date' ? filters.moveInDate.length === 0 : filters.moveInDate.includes(opt)} />
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Neighborhood */}
      <div style={{ position: 'relative' }}>
        <button
          style={pillStyle(!!filters.neighborhood)}
          onClick={() => setOpenDropdown(openDropdown === 'neighborhood' ? null : 'neighborhood')}
        >
          <span>{filters.neighborhood ? `${filters.neighborhood}` : 'Neighborhood'}</span>
          <ChevronDown style={{ width: 14, height: 14, transition: 'transform 0.15s', transform: openDropdown === 'neighborhood' ? 'rotate(180deg)' : 'none' }} />
        </button>
        {openDropdown === 'neighborhood' && (
          <div style={{ ...dropdownStyle, maxHeight: '280px', overflowY: 'auto' }}>
            {neighborhoodOptions.map(opt => (
              <button
                key={opt}
                style={dropdownItemStyle(filters.neighborhood === opt)}
                onClick={() => handleNeighborhoodSelect(opt)}
                onMouseEnter={(e) => { if (filters.neighborhood !== opt) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                onMouseLeave={(e) => { if (filters.neighborhood !== opt) e.currentTarget.style.background = 'transparent' }}
              >
                <input type="radio" readOnly style={{ accentColor: '#19C6C0', pointerEvents: 'none' }} checked={filters.neighborhood === opt} />
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Clear */}
      {hasActiveFilters && (
        <button
          onClick={onClearAll}
          style={{
            background: 'none',
            border: 'none',
            color: '#5B6780',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '0 6px',
            fontFamily: 'inherit',
            transition: 'color 0.12s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#B8C4D4' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#5B6780' }}
        >
          ✕ Clear
        </button>
      )}
    </div>
  );
}
