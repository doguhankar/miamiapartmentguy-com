import type { Metadata } from 'next'
import { Geist, Geist_Mono, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { AgentModeProvider } from '@/components/agent-mode-provider'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const _spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ['400', '500', '600', '700'], variable: '--font-space-grotesk' });
const _jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ['500', '600'], variable: '--font-jetbrains-mono' });

export const metadata: Metadata = {
  title: 'Miami Buildings Directory | Find Your Perfect Apartment',
  description: 'Discover apartments in Miami. Browse Wynwood, Midtown, Brickell, Downtown, and Edgewater neighborhoods. Check your eligibility instantly.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
    ],
  },
  themeColor: '#0B1220',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${_spaceGrotesk.variable} ${_jetBrainsMono.variable}`}>
      <body className="font-sans antialiased">
        <AgentModeProvider>
          {children}
        </AgentModeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
