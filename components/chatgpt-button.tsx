'use client'

import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'

type ChatGPTButtonProps = {
  href: string
  inApp: boolean
}

const COPY_URL = 'https://miamiapartmentguy.com/links'

export function ChatGPTButton({ href, inApp }: ChatGPTButtonProps) {
  const [isFallbackOpen, setIsFallbackOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
  }, [])

  function openChatGPT(event: MouseEvent<HTMLAnchorElement>) {
    if (!inApp) return
    event.preventDefault()
    window.location.href = href
    timerRef.current = window.setTimeout(() => {
      if (document.visibilityState === 'visible') setIsFallbackOpen(true)
    }, 1500)
  }

  async function copyLink() {
    await navigator.clipboard.writeText(COPY_URL)
    setCopied(true)
  }

  return (
    <>
      <a
        className="link-card link-card--pink"
        href={href}
        {...(inApp ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
        onClick={openChatGPT}
      >
        <span className="icon-box" aria-hidden="true">✦</span>
        <span className="link-copy">
          <span className="link-label">Open in ChatGPT</span>
          <span className="link-subtext">24/7 help — if you&apos;re not ready to reach out yet</span>
        </span>
        <span className="link-arrow" aria-hidden="true">›</span>
      </a>

      {isFallbackOpen ? (
        <div className="fallback-overlay" role="presentation" onClick={() => setIsFallbackOpen(false)}>
          <div className="fallback-arrow" aria-hidden="true">↗</div>
          <section className="fallback-sheet" role="dialog" aria-modal="true" aria-labelledby="fallback-title" onClick={(event) => event.stopPropagation()}>
            <button className="fallback-close" type="button" aria-label="Close" onClick={() => setIsFallbackOpen(false)}>×</button>
            <h2 id="fallback-title">Open in your browser</h2>
            <p>Instagram blocks ChatGPT links. Tap ••• in the top right, then Open in external browser. Then tap Open in ChatGPT again.</p>
            <button className="fallback-copy" type="button" onClick={copyLink}>{copied ? 'Copied, paste in Safari' : 'Copy link'}</button>
          </section>
          <style>{`
            .fallback-overlay { position: fixed; inset: 0; z-index: 20; display: flex; align-items: flex-end; background: rgb(0 0 0 / 58%); }
            .fallback-arrow { position: absolute; top: 16px; right: 22px; color: white; font-size: 68px; font-weight: 300; line-height: 1; transform: rotate(-8deg); }
            .fallback-sheet { position: relative; width: 100%; box-sizing: border-box; padding: 30px 22px calc(24px + env(safe-area-inset-bottom)); border-radius: 24px 24px 0 0; background: white; color: #151515; animation: fallback-sheet-up 220ms ease-out; }
            .fallback-sheet h2 { margin: 0 42px 10px 0; font: 400 27px/1.15 'DM Serif Display', serif; }
            .fallback-sheet p { max-width: 34rem; margin: 0; color: #5f5c58; font: 400 15px/1.5 'DM Sans', sans-serif; }
            .fallback-close { position: absolute; top: 12px; right: 16px; width: 40px; height: 40px; border: 0; background: transparent; color: #151515; font-size: 30px; line-height: 1; cursor: pointer; }
            .fallback-copy { width: 100%; min-height: 52px; margin-top: 20px; border: 1px solid #151515; border-radius: 14px; background: white; color: #151515; font: 600 15px 'DM Sans', sans-serif; cursor: pointer; }
            @keyframes fallback-sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
            @media (prefers-reduced-motion: reduce) { .fallback-sheet { animation: none; } }
          `}</style>
        </div>
      ) : null}
    </>
  )
}
