import type { Metadata } from 'next'
import { SeoShell } from '@/components/seo/seo-shell'

export const metadata: Metadata = {
  title: 'Support | Miami Apartment Guy',
  description: 'Get help from Miami Apartment Guy.',
  alternates: { canonical: '/support' },
}

export default function SupportPage() {
  return (
    <SeoShell>
      <article className="sp-article">
        <p className="sp-kicker">Support</p>
        <h1>Need help?</h1>
        <p>Text or call Don at <a href="tel:+14077657306">(407) 765-7306</a>, or use the contact form on the homepage. We typically respond within a few hours.</p>
      </article>
    </SeoShell>
  )
}
