import type { Metadata } from 'next'
import { SeoShell } from '@/components/seo/seo-shell'

export const metadata: Metadata = {
  title: 'Terms of Service | Miami Apartment Guy',
  description: 'Terms of service for Miami Apartment Guy.',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <SeoShell>
      <article className="sp-article">
        <p className="sp-kicker">Terms</p>
        <h1>Terms of Service</h1>
        <p className="sp-updated">Last updated: October 25, 2026</p>
        <h2>Free service</h2>
        <p>The site and locator service are free to renters. No fee is charged to renters for using the locator service.</p>
        <h2>Our role</h2>
        <p>Don Karahan is a Florida-licensed real estate sales associate (license SL3581300) with 305 International Realty. Apartment information is provided to help you explore available options.</p>
        <h2>Availability and approval</h2>
        <p>We do not guarantee apartment availability, pricing, concessions, or approval. All availability, pricing, fees, terms, and approval decisions must be confirmed directly with the property or building.</p>
        <h2>Eligibility</h2>
        <p>You must be at least 18 years old to use this service.</p>
        <h2>Limitation of liability</h2>
        <p>To the fullest extent permitted by law, Miami Apartment Guy, Don Karahan, Casa Locators, and 305 International Realty are not liable for indirect, incidental, special, consequential, or punitive damages arising from your use of the site or locator service.</p>
        <h2>Governing law</h2>
        <p>These terms are governed by the laws of the State of Florida, without regard to conflict-of-law principles.</p>
      </article>
    </SeoShell>
  )
}
