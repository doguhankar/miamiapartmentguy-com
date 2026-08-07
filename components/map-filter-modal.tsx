'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  initialFilters?: FilterState;
}

export interface FilterState {
  unitSize: string[];
  priceRange: string[];
  moveIn: string[];
}

const NAVY = '#0B1220';
const PINK = '#FF3D82';
const MUTED = '#6B7280';
const TEXT = '#0A0F1C';
const BORDER = '#ECEDF2';
const PANEL = '#F8F8FA';
const MIN_PRICE = 1000;
const MAX_PRICE = 6000;
const PRICE_STEP = 100;

const formatPrice = (value: number) => `$${value.toLocaleString()}`;

function parsePriceRange(value?: string) {
  const match = value?.match(/(\d[\d,]*)\s*[-–]\s*(\d[\d,]*)/);
  if (!match) return null;
  return {
    min: Number(match[1].replace(/,/g, '')),
    max: Number(match[2].replace(/,/g, '')),
  };
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function MapFilterModal({ isOpen, onClose, onApply, initialFilters }: FilterModalProps) {
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  const maxDate = useMemo(() => addMonths(today, 4), [today]);
  const [filters, setFilters] = useState<FilterState>(initialFilters ?? { unitSize: [], priceRange: [], moveIn: [] });
  const [priceMin, setPriceMin] = useState(MIN_PRICE);
  const [priceMax, setPriceMax] = useState(MAX_PRICE);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  useEffect(() => {
    if (!isOpen) return;
    const nextFilters = initialFilters ?? { unitSize: [], priceRange: [], moveIn: [] };
    const parsed = parsePriceRange(nextFilters.priceRange[0]);
    setFilters(nextFilters);
    setPriceMin(parsed?.min ?? MIN_PRICE);
    setPriceMax(parsed?.max ?? MAX_PRICE);
    const selectedDate = nextFilters.moveIn[0] ? new Date(`${nextFilters.moveIn[0]}T00:00:00`) : today;
    setVisibleMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [initialFilters, isOpen, today]);

  const selectedDate = filters.moveIn[0] ?? '';
  const monthLabel = visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const calendarDays = Array.from({ length: firstDay + daysInMonth }, (_, index) => {
    if (index < firstDay) return null;
    return new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index - firstDay + 1);
  });

  const toggleUnitSize = (value: string) => {
    setFilters((current) => ({
      ...current,
      unitSize: current.unitSize.includes(value)
        ? current.unitSize.filter((item) => item !== value)
        : [...current.unitSize, value],
    }));
  };

  const selectMoveInDate = (date: Date) => {
    if (date < today || date > maxDate) return;
    setFilters((current) => ({ ...current, moveIn: [toDateKey(date)] }));
  };

  const handleApply = () => {
    onApply({
      ...filters,
      priceRange: priceMin === MIN_PRICE && priceMax === MAX_PRICE
        ? []
        : [`${priceMin}-${priceMax}`],
    });
    onClose();
  };

  const handleReset = () => {
    setFilters({ unitSize: [], priceRange: [], moveIn: [] });
    setPriceMin(MIN_PRICE);
    setPriceMax(MAX_PRICE);
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const moveMonth = (direction: number) => {
    const next = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + direction, 1);
    const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const maxMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    if (next >= minMonth && next <= maxMonth) setVisibleMonth(next);
  };

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px',
        background: 'rgba(10,15,28,0.55)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
        boxSizing: 'border-box',
        fontFamily: 'Inter, var(--font-inter), sans-serif', color: TEXT,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
        style={{
          width: 'min(340px, 88vw)', maxWidth: '340px', maxHeight: '84dvh', minHeight: 0,
          overflow: 'hidden', boxSizing: 'border-box',
          display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 22,
          boxShadow: '0 24px 60px rgba(10,15,28,0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 14px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <h2 id="filter-modal-title" style={{ margin: 0, fontFamily: 'Archivo, var(--font-archivo), sans-serif', fontSize: 17, fontWeight: 800, letterSpacing: '-0.01em' }}>Filter Buildings</h2>
          <button type="button" aria-label="Close filters" onClick={onClose} style={{ width: 28, height: 28, border: 0, borderRadius: 999, background: PANEL, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, cursor: 'pointer' }}>
            <X aria-hidden="true" size={13} />
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, padding: '18px 18px 4px', overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
          <section style={{ marginBottom: 24 }} aria-labelledby="unit-size-label">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><h3 id="unit-size-label" style={{ margin: 0, fontFamily: 'Archivo, var(--font-archivo), sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: '#9AA5AC', textTransform: 'uppercase' }}>Unit Size</h3></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['Studio', '1BR', '2BR', '3BR'].map((option) => {
                const active = filters.unitSize.includes(option);
                return <button key={option} type="button" aria-pressed={active} onClick={() => toggleUnitSize(option)} style={{ padding: '9px 16px', borderRadius: 999, background: active ? NAVY : PANEL, border: `1px solid ${active ? NAVY : BORDER}`, color: active ? '#fff' : TEXT, fontFamily: 'Inter, sans-serif', fontSize: 12.5, fontWeight: active ? 700 : 500, cursor: 'pointer' }}>{option}</button>;
              })}
            </div>
          </section>

          <section style={{ marginBottom: 24 }} aria-labelledby="price-range-label">
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}><h3 id="price-range-label" style={{ margin: 0, fontFamily: 'Archivo, var(--font-archivo), sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: '#9AA5AC', textTransform: 'uppercase' }}>Price Range</h3><output style={{ fontFamily: 'Archivo, sans-serif', fontSize: 13.5, fontWeight: 800, color: PINK }}>{formatPrice(priceMin)} – {priceMax === MAX_PRICE ? '$6,000+' : formatPrice(priceMax)}</output></div>
            <div style={{ position: 'relative', height: 34, margin: '0 10px' }}>
              <div style={{ position: 'absolute', top: 15, left: 0, right: 0, height: 4, borderRadius: 999, background: BORDER }} />
              <div style={{ position: 'absolute', top: 15, left: `${((priceMin - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100}%`, right: `${100 - ((priceMax - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100}%`, height: 4, borderRadius: 999, background: NAVY }} />
              <input aria-label="Minimum price" type="range" min={MIN_PRICE} max={MAX_PRICE} step={PRICE_STEP} value={priceMin} onChange={(event) => setPriceMin(Math.min(Number(event.target.value), priceMax - PRICE_STEP))} style={{ position: 'absolute', inset: 0, width: '100%', appearance: 'none', background: 'transparent', pointerEvents: 'none', WebkitAppearance: 'none' }} />
              <input aria-label="Maximum price" type="range" min={MIN_PRICE} max={MAX_PRICE} step={PRICE_STEP} value={priceMax} onChange={(event) => setPriceMax(Math.max(Number(event.target.value), priceMin + PRICE_STEP))} style={{ position: 'absolute', inset: 0, width: '100%', appearance: 'none', background: 'transparent', pointerEvents: 'none', WebkitAppearance: 'none' }} />
              <style>{`input[type=range]::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;width:20px;height:20px;border-radius:999px;background:#fff;border:3px solid ${NAVY};box-shadow:0 2px 6px rgba(10,15,28,.25);pointer-events:auto;cursor:pointer}input[type=range]::-moz-range-thumb{width:14px;height:14px;border-radius:999px;background:#fff;border:3px solid ${NAVY};box-shadow:0 2px 6px rgba(10,15,28,.25);pointer-events:auto;cursor:pointer}`}</style>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#B6BAC4', fontWeight: 500, padding: '0 2px' }}><span>$1,000</span><span>$6,000+</span></div>
          </section>

          <section style={{ marginBottom: 8 }} aria-labelledby="move-in-label">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}><h3 id="move-in-label" style={{ margin: 0, fontFamily: 'Archivo, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: '#9AA5AC', textTransform: 'uppercase' }}>Move-In Date</h3></div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <button type="button" aria-label="Previous month" onClick={() => moveMonth(-1)} disabled={visibleMonth <= new Date(today.getFullYear(), today.getMonth(), 1)} style={{ width: 26, height: 26, border: 0, borderRadius: 8, background: PANEL, color: MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: visibleMonth <= new Date(today.getFullYear(), today.getMonth(), 1) ? 0.4 : 1 }}><ChevronLeft size={12} /></button>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontSize: 13.5, fontWeight: 700 }}>{monthLabel}</div>
              <button type="button" aria-label="Next month" onClick={() => moveMonth(1)} disabled={visibleMonth >= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)} style={{ width: 26, height: 26, border: 0, borderRadius: 8, background: PANEL, color: MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: visibleMonth >= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1) ? 0.4 : 1 }}><ChevronRight size={12} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <div key={`${day}-${index}`} style={{ fontSize: 9.5, fontWeight: 700, color: '#C2C6CF', textAlign: 'center', paddingBottom: 4 }}>{day}</div>)}
              {calendarDays.map((date, index) => {
                if (!date) return <div key={`empty-${index}`} />;
                const dateKey = toDateKey(date);
                const isToday = dateKey === toDateKey(today);
                const isSelected = dateKey === selectedDate;
                const disabled = date < today || date > maxDate;
                return <button key={dateKey} type="button" disabled={disabled} aria-label={date.toLocaleDateString()} aria-pressed={isSelected} onClick={() => selectMoveInDate(date)} style={{ aspectRatio: '1', border: isToday && !isSelected ? `1.5px solid ${NAVY}` : '1.5px solid transparent', background: isSelected ? PINK : 'transparent', color: disabled ? '#D5D8DE' : isSelected ? '#fff' : TEXT, borderRadius: 10, fontSize: 12.5, fontWeight: isToday || isSelected ? 700 : 500, cursor: disabled ? 'not-allowed' : 'pointer' }}>{date.getDate()}</button>;
              })}
            </div>
            <div style={{ fontSize: 10.5, color: '#9AA5AC', marginTop: 10, textAlign: 'center' }}>You can select a move-in date up to 4 months out</div>
          </section>
        </div>

        <div style={{ display: 'flex', gap: 10, padding: '14px 18px max(14px, env(safe-area-inset-bottom))', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <button type="button" onClick={handleReset} style={{ flex: 1, padding: 13, border: 0, borderRadius: 12, background: PANEL, color: TEXT, fontFamily: 'Inter, sans-serif', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>Reset</button>
          <button type="button" onClick={handleApply} style={{ flex: 1.5, padding: 13, border: 0, borderRadius: 12, background: PINK, color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 18px rgba(255,61,130,0.35)' }}>Apply Filters</button>
        </div>
      </div>
    </div>
  );
}
