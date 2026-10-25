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

        <h2>Who we share data with</h2>
        <p>Data submitted through our forms is shared only with Don Karahan and agents on his team at Casa Locators / 305 International Realty, and with the apartment communities a renter chooses to apply to or tour.</p>
        <p>Service providers that host our site and database, including Vercel and Supabase, and analytics providers such as Google Analytics, process data on our behalf. We never sell personal data.</p>

        <h2>How long we keep data</h2>
        <p>Lead form submissions are kept for up to 24 months after last contact so we can help with future moves, then deleted. Analytics data follows Google Analytics&apos; standard retention settings. Anyone can request earlier deletion by contacting us.</p>

        <h2>Miami Apartment Guy in ChatGPT</h2>
        <p>When you use our ChatGPT apartment search tool, it receives only the search filters you ask about: neighborhood, budget, and bedroom count. It does not receive your name, contact details, chat history, or precise location, and we do not use these searches to build a profile of you.</p>
        <p>Standard server logs, such as IP address and timestamp, may be kept briefly for security and reliability.</p>

        <h2>Sharing and analytics</h2>
        <p>We may use analytics tools, such as Google Analytics, to understand site traffic and improve the experience.</p>

        <h2>Your choices</h2>
        <p>You can ask us to access, correct, or delete your data at any time by texting <a href="sms:+14077657306">(407) 765-7306</a> or using the contact options on our <a href="/support">support page</a>.</p>
      </article>
    </SeoShell>
  )
}
