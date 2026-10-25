import Link from 'next/link'
import '@/app/(home)/seo-pages.css'

export function SeoShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className="mh-nav" aria-label="Primary">
        <div className="mh-wrap mh-nav-in">
          <Link href="/" className="mh-logo">
            MAG<span className="mh-pink">.</span>
          </Link>
          <div className="mh-nav-links">
            <Link href="/map">Browse the map</Link>
            <Link href="/miami-apartment-locator">Apartment locator</Link>
            <Link href="/join-team">Join the Team</Link>
          </div>
        </div>
      </nav>
      <main className="sp-main">{children}</main>
      <footer className="mh-footer">
        <div className="mh-wrap mh-footer-in">
          <div>
            Don Karahan · FL Real Estate License #SL3581300 · Casa Locators / 305 International Realty · Miami-Dade &amp; Broward
            <br />
            Equal Housing Opportunity
          </div>
        </div>
      </footer>
    </>
  )
}
