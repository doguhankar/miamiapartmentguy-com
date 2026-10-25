import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Link Test',
  robots: { index: false },
}

const links = [
  ['A', 'chatgpt://plugins/plugin_0d4b79690ce4819188570bb5b74cd272'],
  ['B', 'https://chatgpt.com/plugins/plugin_0d4b79690ce4819188570bb5b74cd272'],
  ['C', 'instagram://extbrowser/?url=https%3A%2F%2Fchatgpt.com%2Fplugins%2Fplugin_0d4b79690ce4819188570bb5b74cd272'],
  ['D', 'instagram://extbrowser/?url=https%3A%2F%2Fmiamiapartmentguy.com%2Flinks'],
  ['E', 'googlechromes://chatgpt.com/plugins/plugin_0d4b79690ce4819188570bb5b74cd272'],
] as const

export default function LinkTestPage() {
  return (
    <main className="min-h-dvh bg-white px-5 py-8 font-sans text-black">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        {links.map(([letter, href]) => (
          <a
            key={letter}
            href={href}
            className="flex min-h-28 flex-col justify-center rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-4 text-left shadow-sm active:bg-neutral-100"
          >
            <span className="text-3xl font-bold leading-none">{letter}</span>
            <span className="mt-3 break-all text-sm leading-relaxed text-neutral-600">{href}</span>
          </a>
        ))}
      </div>
    </main>
  )
}
