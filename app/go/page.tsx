import type { Metadata } from 'next'

const GPT_URL = 'https://chatgpt.com/g/g-6ade3c11ef6481918474f972e62bd642-miami-apartment-guy-concierge'

export const metadata: Metadata = {
  title: 'Open in ChatGPT | Miami Apartment Guy',
  robots: { index: false },
  other: {
    'apple-itunes-app': `app-id=6448311069, app-argument=${GPT_URL}`,
  },
}

export default function GoPage() {
  return (
    <main className="go-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');
        .go-page {
          min-height: 100dvh;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 44px 20px 28px;
          background: #F7F5F2;
          color: #151515;
          font-family: 'DM Sans', sans-serif;
        }
        .go-wrap {
          width: 100%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .go-photo {
          width: 92px;
          height: 92px;
          border-radius: 999px;
          object-fit: cover;
          display: block;
          margin-bottom: 18px;
        }
        .go-name {
          margin: 0;
          font-family: 'DM Serif Display', serif;
          font-size: 30px;
          font-weight: 400;
          line-height: 1.15;
          letter-spacing: -0.02em;
        }
        .go-subtext {
          max-width: 340px;
          margin: 12px 0 28px;
          color: #6c6a67;
          font-size: 15px;
          line-height: 1.5;
        }
        .go-button {
          display: flex;
          width: 100%;
          min-height: 62px;
          box-sizing: border-box;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: #F03E6E;
          color: white;
          font-size: 17px;
          font-weight: 700;
          text-decoration: none;
        }
        .go-note {
          margin: 16px 0 0;
          color: #6c6a67;
          font-size: 13px;
          line-height: 1.5;
        }
        .go-person {
          margin: 26px 0 0;
          color: #6c6a67;
          font-size: 14px;
          line-height: 1.5;
        }
        .go-person a { color: #151515; font-weight: 600; }
      `}</style>
      <div className="go-wrap">
        <img className="go-photo" src="/don.jpg" alt="Don Karahan" />
        <h1 className="go-name">Your Miami Apartment Concierge Is Ready</h1>
        <p className="go-subtext">Ask about apartments, neighborhoods, pricing, and move-in costs. It&apos;s free.</p>
        <a className="go-button" href={GPT_URL}>Open in ChatGPT</a>
        <p className="go-note">If ChatGPT opens in your browser, tap Open in the ChatGPT banner at the top.</p>
        <p className="go-person">Prefer a real person? Text Don at <a href="sms:+14077657306">(407) 765-7306</a></p>
      </div>
    </main>
  )
}
