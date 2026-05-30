'use client';

import { MessageCircle, Music, Instagram, Youtube } from 'lucide-react';

export function AboutSection() {
  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Don</h2>
        <p className="text-sm text-gray-600 mb-3">Miami Rental Specialist</p>
        <p className="text-sm text-gray-700 leading-relaxed">
          Helping renters find their perfect South Florida apartment. 15+ years experience, 40+ communities, 10-minute response time guaranteed.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3">
        <div className="border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">40+</p>
          <p className="text-xs text-gray-600">Rental Communities</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">S. Florida</p>
          <p className="text-xs text-gray-600">Full Coverage Area</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">10 min</p>
          <p className="text-xs text-gray-600">Response Time</p>
        </div>
      </div>

      {/* Social Links */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Connect with me</p>
        <div className="flex gap-3">
          <a
            href="sms:+14077657306"
            className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium transition"
          >
            <MessageCircle className="w-4 h-4" />
            Text
          </a>
          <a
            href="https://tiktok.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-11 h-11 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition"
          >
            <Music className="w-5 h-5" />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-11 h-11 bg-pink-100 hover:bg-pink-200 text-pink-600 rounded-lg transition"
          >
            <Instagram className="w-5 h-5" />
          </a>
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-11 h-11 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition"
          >
            <Youtube className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Work with me button */}
      <a
        href="sms:+14077657306?body=Hey%20Don%2C%20I%27d%20like%20to%20work%20with%20you%20on%20finding%20my%20apartment!"
        className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-center font-semibold transition"
      >
        Work with me
      </a>
    </div>
  );
}
