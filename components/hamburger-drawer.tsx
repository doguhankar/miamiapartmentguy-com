'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import { AboutSection } from './about-section';
import { FAQSection } from './faq-section';
import { JoinTeamSection } from './join-team-section';

interface HamburgerDrawerProps {
  onClose: () => void;
}

export function HamburgerDrawer({ onClose }: HamburgerDrawerProps) {
  const [activeTab, setActiveTab] = useState<'about' | 'faq' | 'join'>('about');

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Drawer */}
      <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl overflow-y-auto z-50">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Menu</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 flex">
          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 py-3 text-sm font-medium transition border-b-2 ${
              activeTab === 'about'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            About
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex-1 py-3 text-sm font-medium transition border-b-2 ${
              activeTab === 'faq'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            FAQ
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-3 text-sm font-medium transition border-b-2 ${
              activeTab === 'join'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            Join
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'about' && <AboutSection />}
          {activeTab === 'faq' && <FAQSection />}
          {activeTab === 'join' && <JoinTeamSection />}
        </div>
      </div>
    </div>
  );
}
