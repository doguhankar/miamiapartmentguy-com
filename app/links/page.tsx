import { headers } from 'next/headers'
import { ChatGPTButton } from '@/components/chatgpt-button'

export const dynamic = 'force-dynamic'

const GPT_URL = 'https://chatgpt.com/g/g-6ade3c11ef6481918474f972e62bd642-miami-apartment-guy-concierge'

export default async function LinksPage() {
  const userAgent = (await headers()).get('user-agent') ?? ''
  const isIos = /iPhone|iPad/i.test(userAgent)
  const isInstagramOrFacebook = /Instagram|FBAN|FBAV/i.test(userAgent)
  const isAndroid = /Android/i.test(userAgent)
  const isInAppBrowser = isInstagramOrFacebook
  const gptHref = isInstagramOrFacebook && isIos
    ? `x-safari-${GPT_URL}`
    : isInAppBrowser && isAndroid
      ? `intent://chatgpt.com/g/g-6ade3c11ef6481918474f972e62bd642-miami-apartment-guy-concierge#Intent;scheme=https;package=com.openai.chatgpt;S.browser_fallback_url=${encodeURIComponent(GPT_URL)};end`
      : GPT_URL
  return (
    <main className="links-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');

        .links-page {
          min-height: 100dvh;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 44px 20px 28px;
          background: #F7F5F2;
          color: #151515;
          font-family: 'DM Sans', sans-serif;
        }
        .links-wrap {
          width: 100%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .profile-photo {
          width: 92px;
          height: 92px;
          border-radius: 999px;
          object-fit: cover;
          display: block;
          margin-bottom: 18px;
        }
        .profile-name {
          margin: 0;
          text-align: center;
          font-family: 'DM Serif Display', serif;
          font-size: 30px;
          font-weight: 400;
          line-height: 1.15;
          letter-spacing: -0.02em;
        }
        .profile-subtext {
          margin: 8px 0 28px;
          color: #6c6a67;
          font-size: 14px;
          line-height: 1.4;
          text-align: center;
        }
        .links-list {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .link-card {
          display: flex;
          align-items: center;
          min-height: 76px;
          box-sizing: border-box;
          padding: 12px 14px;
          border-radius: 16px;
          color: #151515;
          text-decoration: none;
          transition: transform 160ms ease, box-shadow 160ms ease;
        }
        .link-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 18px rgb(21 21 21 / 8%);
        }
        .link-card:focus-visible {
          outline: 3px solid #151515;
          outline-offset: 3px;
        }
        .link-card--pink { background: #F03E6E; }
        .link-card--teal { background: #4BBFB8; }
        .link-card--white {
          background: #FFFFFF;
          border: 1px solid #E7E3DE;
        }
        .icon-box {
          width: 44px;
          height: 44px;
          flex: 0 0 44px;
          display: grid;
          place-items: center;
          margin-right: 13px;
          border-radius: 12px;
          background: rgb(255 255 255 / 28%);
          font-size: 20px;
          font-weight: 700;
        }
        .link-card--white .icon-box { background: #F7F5F2; }
        .link-copy { min-width: 0; flex: 1; }
        .link-label {
          display: block;
          font-size: 16px;
          font-weight: 700;
          line-height: 1.25;
        }
        .link-subtext {
          display: block;
          margin-top: 4px;
          color: rgb(21 21 21 / 68%);
          font-size: 12px;
          line-height: 1.35;
        }
        .link-arrow {
          margin-left: 10px;
          font-size: 27px;
          line-height: 1;
          font-weight: 400;
        }
        .links-footer {
          margin: 28px 0 0;
          color: #85817c;
          font-size: 11px;
          line-height: 1.4;
          text-align: center;
        }
        @media (prefers-reduced-motion: reduce) {
          .link-card { transition: none; }
        }
      `}</style>

      <div className="links-wrap">
        <img className="profile-photo" src="/don.jpg" alt="Don Karahan" />
        <h1 className="profile-name">Miami Apartment Guy</h1>
        <p className="profile-subtext">Free apartment help · Miami &amp; South Florida</p>

        <nav className="links-list" aria-label="Miami Apartment Guy links">
          <ChatGPTButton href={gptHref} inApp={gptHref !== GPT_URL} />
          <a className="link-card link-card--teal" href="https://miamiapartmentguy.com/start?utm_source=ig&amp;utm_content=links-page" target="_blank" rel="noopener noreferrer">
            <span className="icon-box" aria-hidden="true">↗</span>
            <span className="link-copy">
              <span className="link-label">Find Your Apartment</span>
              <span className="link-subtext">Fill out the quick form — get options fast</span>
            </span>
            <span className="link-arrow" aria-hidden="true">›</span>
          </a>
          <a className="link-card link-card--white" href="https://miamiapartmentguy.com/map?utm_source=ig&amp;utm_content=links-page" target="_blank" rel="noopener noreferrer">
            <span className="icon-box" aria-hidden="true">⌖</span>
            <span className="link-copy">
              <span className="link-label">Browse the Map 🗺️</span>
              <span className="link-subtext">130+ buildings Don has worked with</span>
            </span>
            <span className="link-arrow" aria-hidden="true">›</span>
          </a>
          <a className="link-card link-card--white" href="sms:+14077657306">
            <span className="icon-box" aria-hidden="true">⌕</span>
            <span className="link-copy">
              <span className="link-label">Text Don Directly 💬</span>
              <span className="link-subtext">(407) 765-7306 · responds fast</span>
            </span>
            <span className="link-arrow" aria-hidden="true">›</span>
          </a>
        </nav>

        <p className="links-footer">Free to use · No fees to renters · miamiapartmentguy.com</p>
      </div>
    </main>
  )
}
