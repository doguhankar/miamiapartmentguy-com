'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { neighborhoodCenters } from '@/lib/neighborhood-centers';
import { AgentModeControl } from '@/components/agent-mode-provider';

export interface MapFilterState {
  bedrooms: string[];
  bathrooms: string[];
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
  const calendarDays = Array.from({ length: 30 }, (_, index) => index + 1);
  const calendarBlanks = Array.from({ length: 2 }, (_, index) => `blank-${index}`);

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

  const toggleBathroom = (option: string) => {
    if (option === 'Any bathrooms') {
      onFilterChange({ ...filters, bathrooms: [] });
      return;
    }
    const bathrooms = filters.bathrooms.includes(option)
      ? filters.bathrooms.filter((value) => value !== option)
      : [...filters.bathrooms, option];
    onFilterChange({ ...filters, bathrooms });
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
    filters.bathrooms.length > 0 ||
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
    background: '#FFFFFF',
    border: active ? '1px solid #19C6C0' : '1px solid #DCE1E8',
    color: active ? '#0A8F8B' : '#263247',
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
    width: '340px',
    padding: '18px',
    background: '#FFFFFF',
    border: '1.5px solid #E2E2E5',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    zIndex: 50,
  };

  const tileStyle: React.CSSProperties = { border: '1.5px solid #E2E2E5', borderRadius: 8, padding: '10px 6px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#17181A', cursor: 'pointer', background: '#FFFFFF' };
  const tealTileStyle: React.CSSProperties = { background: 'rgba(47,182,166,0.10)', borderColor: '#2FB6A6', color: '#1F8377' };
  const coralTileStyle: React.CSSProperties = { background: 'rgba(232,70,125,0.10)', borderColor: '#E8467D', color: '#C6205A' };
  const inputStyle: React.CSSProperties = { background: '#F7F7F8', border: '1.5px solid #E2E2E5', borderRadius: '8px', color: '#17181A', fontSize: '14px', fontWeight: 700, padding: '10px 12px', outline: 'none' };
  const presetStyle: React.CSSProperties = { border: '1.5px solid #E2E2E5', borderRadius: '999px', padding: '7px 14px', fontSize: '13px', fontWeight: 700, color: '#6B7280', cursor: 'pointer', background: '#FFFFFF' };
  const selectedPresetStyle: React.CSSProperties = { background: 'rgba(47,182,166,0.10)', borderColor: '#2FB6A6', color: '#1F8377' };
  const FilterActions = ({ onClear, onDone }: { onClear: () => void; onDone: () => void }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
      <button type="button" onClick={onClear} style={{ background: 'none', border: 0, color: '#6B7280', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Clear</button>
      <button type="button" onClick={onDone} style={{ background: 'none', border: 0, color: '#1F8377', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Done</button>
    </div>
  );

  const dropdownItemStyle = (selected: boolean): React.CSSProperties => ({
    width: '100%',
    textAlign: 'left',
    padding: '9px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: selected ? '#0A8F8B' : '#263247',
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
      background: '#FFFFFF',
      borderBottom: '1px solid #E8EBF0',
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
          background: '#FFFFFF',
          border: '1px solid #FF4D8D',
          borderRadius: '8px',
          padding: '10px 16px',
          color: '#0A0F1C',
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
        <button type="button" style={pillStyle(filters.price.length > 0)} onClick={() => setOpenDropdown(openDropdown === 'price' ? null : 'price')}>
          <span>{getSelectedLabel('price')}</span>
          <ChevronDown style={{ width: 14, height: 14, transition: 'transform 0.15s', transform: openDropdown === 'price' ? 'rotate(180deg)' : 'none' }} />
        </button>
        {openDropdown === 'price' && (
          <div style={dropdownStyle}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
              <input aria-label="Minimum price" placeholder="No min" style={{ ...inputStyle, width: '50%' }} onChange={(e) => togglePrice(e.target.value)} />
              <span>–</span>
              <input aria-label="Maximum price" placeholder="No max" style={{ ...inputStyle, width: '50%' }} onChange={(e) => togglePrice(e.target.value)} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {priceOptions.slice(1).map((opt) => <button type="button" key={opt} onClick={() => togglePrice(opt)} style={{ ...presetStyle, ...(filters.price.includes(opt) ? selectedPresetStyle : {}) }}>{opt}</button>)}
            </div>
            <FilterActions onClear={() => onFilterChange({ ...filters, price: [] })} onDone={() => setOpenDropdown(null)} />
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
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Beds</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 10 }}>Tap two tiles to set a range</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginBottom: 18 }}>
              {['Any', 'Studio+', '1+', '2+', '3+', '4+'].map((opt) => { const value = opt === 'Any' ? '' : opt; const selected = value ? filters.bedrooms.includes(value) : filters.bedrooms.length === 0; return <button type="button" key={opt} onClick={() => toggleBedroom(value || 'All bedrooms')} style={{ ...tileStyle, ...(selected ? tealTileStyle : {}) }}>{opt}</button> })}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Baths</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 16 }}>
              {['Any', '1+', '2+', '3+'].map((opt) => {
                const value = opt === 'Any' ? 'Any bathrooms' : opt;
                const selected = opt === 'Any' ? filters.bathrooms.length === 0 : filters.bathrooms.includes(value);
                return <button type="button" key={opt} onClick={() => toggleBathroom(value)} style={{ ...tileStyle, ...(selected ? coralTileStyle : {}) }}>{opt}</button>;
              })}
            </div>
            <FilterActions onClear={() => onFilterChange({ ...filters, bedrooms: [], bathrooms: [] })} onDone={() => setOpenDropdown(null)} />
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#17181A' }}>September 2026</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <span key={`${day}-${index}`} style={{ fontSize: 11, color: '#6B7280', textAlign: 'center' }}>{day}</span>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 16 }}>
              {calendarBlanks.map((blank) => <span key={blank} />)}
              {calendarDays.map((day) => {
                const date = `2026-09-${String(day).padStart(2, '0')}`;
                const selected = filters.moveInDate.includes(date);
                return <button type="button" key={date} aria-label={`September ${day}, 2026`} onClick={() => onFilterChange({ ...filters, moveInDate: selected ? [] : [date] })} style={{ width: 34, height: 34, justifySelf: 'center', border: 0, borderRadius: '50%', background: selected ? '#E8467D' : 'transparent', color: selected ? '#FFFFFF' : '#17181A', fontSize: 13, fontWeight: selected ? 700 : 500, cursor: 'pointer' }}>{day}</button>;
              })}
            </div>
            <FilterActions onClear={() => onFilterChange({ ...filters, moveInDate: [] })} onDone={() => setOpenDropdown(null)} />
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

      <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
        <AgentModeControl />
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
