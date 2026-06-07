'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
}

export interface FilterState {
  unitSize: string[];
  priceRange: string[];
  moveIn: string[];
}

export function MapFilterModal({ isOpen, onClose, onApply }: FilterModalProps) {
  const [filters, setFilters] = useState<FilterState>({
    unitSize: [],
    priceRange: [],
    moveIn: [],
  });

  const unitSizeOptions = ['Studio', '1BR', '2BR', '3BR'];
  const priceOptions = ['Under $2.5k', '$2.5k-$4k', '$4k+'];
  const moveInOptions = ['Now', '30 days', '60 days'];

  const toggleFilter = (category: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const current = prev[category];
      const updated = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({ unitSize: [], priceRange: [], moveIn: [] });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center md:justify-center">
      <div className="bg-white rounded-t-3xl md:rounded-2xl w-full md:w-96 max-h-[90vh] md:max-h-[80vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between rounded-t-3xl md:rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-900">Filter Buildings</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Filter Sections */}
        <div className="px-4 py-4 space-y-6">
          {/* Unit Size */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Unit Size</h3>
            <div className="flex flex-wrap gap-2">
              {unitSizeOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => toggleFilter('unitSize', option)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filters.unitSize.includes(option)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Price Range</h3>
            <div className="flex flex-wrap gap-2">
              {priceOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => toggleFilter('priceRange', option)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filters.priceRange.includes(option)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Move-In Date */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Move-In</h3>
            <div className="flex flex-wrap gap-2">
              {moveInOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => toggleFilter('moveIn', option)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filters.moveIn.includes(option)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-2">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium transition-colors text-sm"
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 rounded-lg text-white bg-blue-500 hover:bg-blue-600 font-medium transition-colors text-sm"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
