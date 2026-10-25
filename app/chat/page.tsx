'use client'

import { useEffect, useState } from 'react'

const GPT_URL =
  'https://chatgpt.com/g/g-6ade3c11ef6481918474f972e62bd642-miami-apartment-guy-concierge'

type Gtag = (command: 'event', eventName: string, params: Record<string, string>) => void

function trackGptClick() {
  const gtag = (window as unknown as { gtag?: Gtag }).gtag
  if (typeof gtag === 'function') {
    gtag('event', 'gpt_click', {
      event_category: 'engagement',
      event_label: 'ig-bio',
    })
  }
}

export default function ChatPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [isInstagramBrowser, setIsInstagramBrowser] = useState(false)

  useEffect(() => {
    setIsInstagramBrowser(/Instagram/i.test(navigator.userAgent))
  }, [])

  function openModal() {
    trackGptClick()
    setIsOpen(true)
  }

  function closeModal() {
    trackGptClick()
    setIsOpen(false)
  }

  function openChatGPTApp() {
    trackGptClick()
    window.location.href = GPT_URL
  }

  function openBrowser() {
    trackGptClick()
    window.open(GPT_URL, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <style>{`@keyframes chat-sheet-up { from { transform: translateY(100%); opacity: 0.7; } to { transform: translateY(0); opacity: 1; } }`}</style>
      <main className="flex min-h-dvh items-center justify-center bg-white px-6 py-12 font-sans text-black">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff1f6b]">
          Miami Apartment Guy
        </p>

        <h1 className="text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
          Chat with the Miami Apartment Guy
        </h1>

        <p className="mt-5 text-pretty text-base leading-relaxed text-neutral-600 sm:text-lg">
          Get free help finding your next Miami apartment — neighborhoods, real costs, and options
          that fit you.
        </p>

        <button
          type="button"
          onClick={openModal}
          className="mt-10 flex min-h-16 w-full items-center justify-center rounded-2xl bg-black px-8 text-lg font-semibold text-white transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff1f6b] sm:hover:bg-neutral-800"
        >
          Open the Concierge →
        </button>

        <p className="mt-5 text-sm text-neutral-500">
          Free to use · No sign-up required · Powered by ChatGPT
        </p>
      </div>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/60 p-0 sm:items-center sm:justify-center sm:p-6"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeModal()
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="chatgpt-modal-title"
            className="w-full animate-[chat-sheet-up_220ms_ease-out] rounded-t-3xl bg-white px-6 pb-8 pt-7 shadow-2xl sm:max-w-md sm:rounded-3xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-black text-xl text-white" aria-hidden="true">
                  ⊕
                </span>
                <h2 id="chatgpt-modal-title" className="text-xl font-bold tracking-tight">
                  Open in ChatGPT
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={closeModal}
                className="flex size-9 items-center justify-center rounded-full text-2xl leading-none text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff1f6b]"
              >
                ×
              </button>
            </div>

            <p className="mt-5 text-base leading-relaxed text-neutral-600">
              Tap below to open the free concierge in the ChatGPT app
            </p>
            <p className="mt-4 text-sm leading-relaxed text-neutral-700">
              {isInstagramBrowser
                ? "Instagram blocks ChatGPT links. Tap the ··· menu (bottom right) → ‘Open in Safari’, then tap the button."
                : "Tap → then tap ‘Open in Safari’ if prompted"}
            </p>

            <div className="mt-7 flex flex-col gap-3">
              {isInstagramBrowser ? (
                <a
                  href={GPT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-safarivc="true"
                  onClick={trackGptClick}
                  className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-black px-5 text-base font-semibold text-white transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff1f6b]"
                >
                  Open ChatGPT App
                </a>
              ) : (
                <button
                  type="button"
                  onClick={openChatGPTApp}
                  className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-black px-5 text-base font-semibold text-white transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff1f6b]"
                >
                  Open ChatGPT App
                </button>
              )}
              <button
                type="button"
                onClick={openBrowser}
                className="flex min-h-14 w-full items-center justify-center rounded-2xl px-5 text-base font-semibold text-black transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff1f6b]"
              >
                Open in Browser
              </button>
            </div>
          </section>
        </div>
      ) : null}
      </main>
    </>
  )
}
