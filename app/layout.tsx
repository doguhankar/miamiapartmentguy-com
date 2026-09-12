import type { Metadata } from 'next'
import { Geist, Geist_Mono, Archivo, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { GoogleAnalytics } from '@next/third-parties/google'
import './globals.css'
import { AgentModeProvider } from '@/components/agent-mode-provider'
import { SaveListProvider } from '@/components/save-list-provider'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const _archivo = Archivo({ subsets: ["latin"], weight: ['400', '500', '600', '700'], variable: '--font-archivo' });
const _spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ['400', '500', '600', '700'], variable: '--font-space-grotesk' });
const _jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ['500', '600'], variable: '--font-jetbrains-mono' });

export const metadata: Metadata = {
  title: 'Miami Apartment Guy — Every Building. Every Deal. One Text.',
  description: 'Free apartment locating across Greater Miami. Live pricing on 108+ buildings from Brickell to Edgewater. Text your budget, get real quotes same day.',
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
    <html lang="en" className={`${_archivo.variable} ${_spaceGrotesk.variable} ${_jetBrainsMono.variable}`}>
      <body className="font-sans antialiased">
        <AgentModeProvider>
          <SaveListProvider>{children}</SaveListProvider>
        </AgentModeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
        {process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />}
      </body>
    </html>
  )
}
