'use client';

import Link from 'next/link';
import { ArrowRight, Check, MapPin, DollarSign, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const neighborhoods = [
    { name: 'Brickell', buildings: 6, avgPrice: '$2,500', image: '🏢' },
    { name: 'Downtown', buildings: 7, avgPrice: '$2,400', image: '🏙️' },
    { name: 'Edgewater', buildings: 7, avgPrice: '$2,800', image: '🌊' },
    { name: 'Midtown', buildings: 6, avgPrice: '$2,700', image: '🌆' },
    { name: 'Wynwood', buildings: 12, avgPrice: '$2,600', image: '🎨' },
  ];

  const comparisons = [
    { feature: 'Personalized Guidance', mag: true, others: false },
    { feature: 'Direct Agent Access', mag: true, others: false },
    { feature: 'Qualification Check', mag: true, others: false },
    { feature: '108 Premium Buildings', mag: true, others: false },
    { feature: 'Real-Time Availability', mag: true, others: true },
    { feature: 'Price Comparison', mag: true, others: true },
  ];

  const reviews = [
    { name: 'Sarah M.', text: 'Don made the whole process so easy. Found my perfect place in Brickell!', rating: 5 },
    { name: 'James K.', text: 'Best experience renting in Miami. Highly recommend MAG!', rating: 5 },
    { name: 'Maria L.', text: 'The neighborhood guides are incredibly helpful. Moved here from out of state.', rating: 5 },
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="text-2xl font-bold text-gray-900">
            Miami Apartment<span className="text-blue-600"> Guy™</span>
          </div>
          <Link href="/map">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Explore Buildings <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-white py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Your Miami Apartment Journey Starts Here
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Connect with Don to explore 108 handpicked apartments across Miami's best neighborhoods. Get personalized guidance, instant qualification checks, and direct access to premium properties.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/map">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                    Browse 108 Buildings <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <button className="px-8 py-3 rounded-lg border border-gray-300 text-gray-900 font-medium hover:bg-gray-50 transition w-full sm:w-auto">
                  📱 Text Don
                </button>
              </div>
              <div className="mt-12 flex items-center gap-8">
                <div>
                  <div className="text-3xl font-bold text-gray-900">108</div>
                  <div className="text-sm text-gray-600">Premium Buildings</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">50K+</div>
                  <div className="text-sm text-gray-600">Happy Renters</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">24/7</div>
                  <div className="text-sm text-gray-600">Direct Support</div>
                </div>
              </div>
            </div>
            <div className="relative h-96 bg-gradient-to-br from-blue-200 to-blue-100 rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🗺️</div>
                <p className="text-gray-700 font-medium">Interactive Map of Miami</p>
                <p className="text-sm text-gray-600 mt-2">Explore neighborhoods and buildings</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Neighborhoods Section */}
      <section className="py-20 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 text-center">Explore Miami Neighborhoods</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            From vibrant Brickell to artistic Wynwood, find your perfect neighborhood
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {neighborhoods.map((neighborhood) => (
              <Link
                key={neighborhood.name}
                href="/map"
                className="group p-6 rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-lg transition duration-300 cursor-pointer"
              >
                <div className="text-4xl mb-4">{neighborhood.image}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{neighborhood.name}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {neighborhood.buildings} buildings
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    From {neighborhood.avgPrice}/mo
                  </div>
                </div>
                <div className="mt-4 text-blue-600 font-medium group-hover:translate-x-1 transition">
                  Explore →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why MAG Section */}
      <section className="py-20 sm:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 text-center">Why Choose Miami Apartment Guy?</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            We go beyond listings. Get expert guidance from someone who knows Miami inside and out.
          </p>
          <div className="grid md:grid-cols-2 gap-16">
            <div className="space-y-8">
              {[
                { icon: User, title: 'Personal Advisor', desc: 'Direct access to Don for questions, tours, and neighborhood insights' },
                { icon: Clock, title: 'Save Time', desc: 'We filter the market and find buildings that match your needs' },
                { icon: Check, title: 'Qualification Support', desc: 'Instant qualification checks and guidance on requirements' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <item.icon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <p className="mt-2 text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">MAG vs Others</h3>
              <div className="space-y-4">
                {comparisons.map((comp, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-200 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{comp.feature}</p>
                    </div>
                    <div className="w-20 text-center">
                      {comp.mag ? (
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                    <div className="w-20 text-center">
                      {comp.others ? (
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-20 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 text-center">What Renters Say</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Real experiences from Miami renters who found their perfect apartments
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {reviews.map((review, i) => (
              <div key={i} className="p-8 rounded-xl border border-gray-200 hover:shadow-lg transition">
                <div className="flex gap-1 mb-4">
                  {[...Array(review.rating)].map((_, j) => (
                    <span key={j} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{review.text}"</p>
                <p className="font-semibold text-gray-900">— {review.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">Ready to Find Your Miami Apartment?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Explore 108 handpicked buildings or text Don directly for personalized recommendations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/map">
              <Button size="lg" className="bg-white hover:bg-gray-100 text-blue-600 font-semibold w-full sm:w-auto">
                Browse Buildings <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <button className="px-8 py-3 rounded-lg bg-blue-500 hover:bg-blue-700 text-white font-medium transition w-full sm:w-auto">
              📱 Text Don: +1 (407) 765-7306
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-white mb-4">Explore</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/map" className="hover:text-white">All Buildings</Link></li>
                <li><Link href="/map" className="hover:text-white">Neighborhoods</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">About</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">FAQ</a></li>
                <li><a href="#" className="hover:text-white">Help</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Connect</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Text Don</a></li>
                <li><a href="#" className="hover:text-white">Instagram</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8">
            <p className="text-center text-sm text-gray-400">
              © 2026 Miami Apartment Guy™. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
