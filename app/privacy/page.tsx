import type { Metadata } from 'next'
import { SeoShell } from '@/components/seo/seo-shell'

export const metadata: Metadata = {
  title: 'Privacy Policy | Miami Apartment Guy',
  description: 'Privacy policy for Miami Apartment Guy.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <SeoShell>
      <article className="sp-article">
        <p className="sp-kicker">Privacy</p>
        <h1>Privacy Policy</h1>
        <p className="sp-updated">Last updated: October 25, 2026</p>
        <h2>Information we collect</h2>
        <p>We collect your name, phone number, email address, and move-in preferences—such as budget, timeframe, and neighborhood—only when you submit our lead form.</p>
        <h2>How we use your information</h2>
        <p>We use this information solely to connect you with Don Karahan or his team at Casa Locators / 305 International Realty to help you find an apartment.</p>
        <h2>Sharing and analytics</h2>
        <p>We do not sell personal data to third parties. We may use analytics tools, such as Google Analytics, to understand site traffic and improve the experience.</p>
        <h2>Your choices</h2>
        <p>You can request that your data be deleted by contacting <a href="/support">support</a>.</p>
      </article>
    </SeoShell>
  )
}
