'use client';

import { useState } from 'react';

export function JoinTeamSection() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [brokerage, setBrokerage] = useState('');
  const [whyMoving, setWhyMoving] = useState('');
  const [whatDrives, setWhatDrives] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Build SMS message with form data
    const message = `Hi Don, I'm ${fullName} from ${brokerage}. Why I'm looking to move: ${whyMoving}. What drives me: ${whatDrives}. My number: ${phone}`;
    const encodedMessage = encodeURIComponent(message);
    
    // Open SMS with pre-filled message
    window.location.href = `sms:+14077657306?body=${encodedMessage}`;
  };

  const isFormValid = fullName && phone && brokerage && whyMoving && whatDrives;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Join the Team</h2>
        <p className="text-sm text-gray-600">Looking for talented people to grow with us in real estate.</p>
      </div>

      {/* Info Sections */}
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <p className="font-semibold text-sm text-blue-900 mb-1">Who we are</p>
          <p className="text-xs text-blue-800">A dynamic team of rental specialists serving South Florida.</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <p className="font-semibold text-sm text-green-900 mb-1">What we do</p>
          <p className="text-xs text-green-800">Help renters find perfect apartments and connect landlords with great tenants.</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
          <p className="font-semibold text-sm text-orange-900 mb-1">How we do it</p>
          <p className="text-xs text-orange-800">With transparency, speed, and personalized service. We treat renters like family.</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
          <p className="font-semibold text-sm text-red-900 mb-1">Only inquire if:</p>
          <p className="text-xs text-red-800">You're self-motivated, have real estate experience, and want to make a real impact.</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Current Brokerage</label>
          <input
            type="text"
            value={brokerage}
            onChange={(e) => setBrokerage(e.target.value)}
            placeholder="Your brokerage name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Why are you looking to make a move?</label>
          <textarea
            value={whyMoving}
            onChange={(e) => setWhyMoving(e.target.value)}
            placeholder="Tell us your reasons..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">What drives you?</label>
          <textarea
            value={whatDrives}
            onChange={(e) => setWhatDrives(e.target.value)}
            placeholder="What motivates you in real estate?"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            required
          />
        </div>

        <button
          type="submit"
          disabled={!isFormValid}
          className={`w-full py-3 rounded-lg font-semibold text-center transition ${
            isFormValid
              ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          Send to Don
        </button>
      </form>
    </div>
  );
}
