'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { buildings as buildingsData } from '@/lib/buildings';
import { DesktopBuildingCard } from '@/components/desktop-building-card';
import { ChevronLeft } from 'lucide-react';

// Map string IDs to building data for matching with saved numeric IDs
// This creates a lookup that allows saved lists to work with buildings
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
  const [copiedText, setCopiedText] = useState('');

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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedText('Copied!');
      setTimeout(() => setCopiedText(''), 2000);
    } catch {
      setCopiedText('Failed to copy');
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to listings
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Saved Apartment List
          </h1>

          <p className="text-gray-600 mb-4">
            {savedBuildings.length} apartment{savedBuildings.length !== 1 ? 's' : ''} saved
          </p>

          {/* Share Section */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
            <p className="text-sm text-gray-600 mb-2">Share this list:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-700"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
              >
                {copiedText || 'Copy Link'}
              </button>
            </div>
          </div>

          {/* Comparison Toggle */}
          {buildingsList.length > savedBuildings.length && (
            <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200">
              <input
                type="checkbox"
                id="comparison-toggle"
                checked={comparisonMode}
                onChange={(e) => setComparisonMode(e.target.checked)}
                className="rounded cursor-pointer"
              />
              <label htmlFor="comparison-toggle" className="cursor-pointer text-sm font-medium text-gray-700">
                Show all buildings for comparison ({buildingsList.length} total)
              </label>
            </div>
          )}
        </div>

        {/* Buildings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedBuildings.map((building) => {
            const isSaved = savedBuildingIds.has(String(building.id));
            return (
              <div key={building.id} className="relative">
                {isSaved && comparisonMode && (
                  <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-4">
                    <div className="inline-block px-2.5 py-1 bg-green-500 text-white text-xs font-semibold rounded">
                      Saved
                    </div>
                  </div>
                )}
                <DesktopBuildingCard
                  building={building}
                  hasSavedBadge={isSaved && comparisonMode}
                />
              </div>
            );
          })}
        </div>

        {displayedBuildings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No buildings to display</p>
          </div>
        )}
      </div>
    </div>
  );
}
