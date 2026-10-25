'use client'

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
  return (
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

        <a
          href={GPT_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={trackGptClick}
          className="mt-10 flex min-h-16 w-full items-center justify-center rounded-2xl bg-black px-8 text-lg font-semibold text-white transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff1f6b] sm:hover:bg-neutral-800"
        >
          Open the Concierge →
        </a>

        <p className="mt-5 text-sm text-neutral-500">
          Free to use · No sign-up required · Powered by ChatGPT
        </p>
      </div>
    </main>
  )
}
