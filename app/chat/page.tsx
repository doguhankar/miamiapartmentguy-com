'use client'

import { useEffect } from 'react'

const GPT_URL =
  'https://chatgpt.com/g/g-6ade3c11ef6481918474f972e62bd642-miami-apartment-guy-concierge'

type Gtag = (command: 'event', eventName: string, params: Record<string, string>) => void

export default function ChatRedirectPage() {
  useEffect(() => {
    const gtag = (window as unknown as { gtag?: Gtag }).gtag
    if (typeof gtag === 'function') {
      gtag('event', 'gpt_click', {
        event_category: 'engagement',
        event_label: 'ig-bio',
      })
    }
  }, [])

  useEffect(() => {
    window.location.href = GPT_URL
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6">
      <p className="font-sans text-center text-lg text-neutral-700">
        Loading your Miami apartment guide…
      </p>
    </main>
  )
}
