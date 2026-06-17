'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { buildings as buildingsData } from '@/lib/buildings';
import { DesktopBuildingCard } from '@/components/desktop-building-card';
import { MapView } from '@/components/map-view';
import { Share2, ChevronLeft, Copy, Check } from 'lucide-react';
import { copyToClipboard, showToast } from '@/lib/toast-utils';

// Map string IDs to building data for matching with saved numeric IDs
const buildingsByStringId: Record<string, typeof buildingsData[0]> = {};
buildingsData.forEach((b, index) => {
  buildingsByStringId[String(index + 1)] = b;
});

const buildingsList = Object.values(buildingsByStringId);

interface SavedList {
  slug: string;
  buildingIds: string[];
  createdAt: string;
}

export default function ListPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [savedList, setSavedList] = useState<SavedList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<typeof buildingsList[0] | null>(null);
  const [highlightedBuilding, setHighlightedBuilding] = useState<typeof buildingsList[0] | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchList = async () => {
      try {
        const response = await fetch(`/api/lists/${slug}`);
        if (!response.ok) {
          throw new Error('List not found');
        }
        const data = await response.json();
        setSavedList(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load list');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchList();
    }
  }, [slug]);

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/lists/${slug}` : '';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Saved Apartments',
          text: `Check out my saved apartment list in Miami`,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          showToast('Failed to share', { type: 'error' });
        }
      }
    } else {
      // Fallback: copy to clipboard
      await copyToClipboard(shareUrl, 'Link copied to clipboard');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading list...</p>
        </div>
      </div>
    );
  }

  if (error || !savedList) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'List not found'}</p>
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-semibold">
            ← Back to listings
          </Link>
        </div>
      </div>
    );
  }

  // Get saved buildings
  const savedBuildingIds = new Set(savedList.buildingIds.map(String));
  const savedBuildings = buildingsList.filter((b) => savedBuildingIds.has(String(buildingsData.indexOf(b) + 1)));
  const displayedBuildings = comparisonMode ? buildingsList : savedBuildings;
  const mapBuildings = comparisonMode ? buildingsList : savedBuildings;

  return (
    <div className="w-full h-screen flex flex-col md:flex-row bg-white">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white z-20">
        <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-base font-semibold text-gray-900">
          {savedBuildings.length} saved
        </h1>
        <button
          onClick={handleShare}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Share list"
        >
          <Share2 className="h-5 w-5 text-gray-700" />
        </button>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex md:fixed md:top-0 md:right-0 md:z-20 md:p-4 md:gap-3 md:items-center">
        <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-800 px-3 py-2">
          <ChevronLeft className="h-4 w-4" />
          <span className="text-sm font-semibold">Back</span>
        </Link>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy Link
            </>
          )}
        </button>
      </div>

      {/* Map Container */}
      <div className="h-64 md:h-full md:flex-1 md:relative">
        <MapView
          buildings={mapBuildings}
          selectedBuilding={selectedBuilding}
          highlightedBuilding={highlightedBuilding}
          onSelectBuilding={setSelectedBuilding}
        />
      </div>

      {/* Desktop Cards Panel */}
      <div className="hidden md:flex md:flex-col md:w-[40%] md:max-w-lg md:border-l md:border-gray-200">
        {/* Desktop Header Info */}
        <div className="px-4 pt-14 pb-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            {savedBuildings.length} apartment{savedBuildings.length !== 1 ? 's' : ''}
          </h2>
          <p className="text-xs text-gray-500">in your saved list</p>
        </div>

        {/* Desktop Cards Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 grid gap-4">
            {displayedBuildings.map((building) => {
              const isSaved = savedBuildingIds.has(String(buildingsData.indexOf(building) + 1));
              return (
                <DesktopBuildingCard
                  key={building.id}
                  building={building}
                  hasSavedBadge={isSaved && comparisonMode}
                  onHover={setHighlightedBuilding}
                  onClick={setSelectedBuilding}
                />
              );
            })}
          </div>
        </div>

        {/* Desktop Comparison Toggle */}
        {buildingsList.length > savedBuildings.length && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={comparisonMode}
                onChange={(e) => setComparisonMode(e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <span className="text-xs font-medium text-gray-700">
                Compare with all {buildingsList.length} buildings
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Mobile Bottom Sheet */}
      <div className="md:hidden flex-1 flex flex-col overflow-hidden bg-white">
        {/* Mobile Cards List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 space-y-3">
            {displayedBuildings.map((building) => {
              const isSaved = savedBuildingIds.has(String(buildingsData.indexOf(building) + 1));
              return (
                <div
                  key={building.id}
                  onClick={() => setSelectedBuilding(building)}
                  className="p-3 rounded-lg border border-gray-200 bg-white overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="relative w-full h-40 bg-gray-100 rounded-md mb-3 overflow-hidden">
                    <img
                      src={building.images[0]}
                      alt={building.name}
                      className="w-full h-full object-cover"
                    />
                    {isSaved && comparisonMode && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded">
                        Saved
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{building.name}</h3>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {building.neighborhood}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-1">
                    {building.tagline || `$${building.priceMin}+/mo`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {building.units.join(' • ')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Comparison Toggle */}
        {buildingsList.length > savedBuildings.length && (
          <div className="px-3 py-3 border-t border-gray-200 bg-gray-50">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={comparisonMode}
                onChange={(e) => setComparisonMode(e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <span className="text-xs font-medium text-gray-700">
                Compare with all {buildingsList.length} buildings
              </span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
