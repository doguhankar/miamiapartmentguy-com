import type { Metadata } from 'next'
<<<<<<< HEAD
import { Geist, Geist_Mono, Archivo, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
=======
import { Archivo, Space_Grotesk } from 'next/font/google'
>>>>>>> 03fc5097df0c4aa2a1dea6ee2c391c3d9ed2e818
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { AgentModeProvider } from '@/components/agent-mode-provider'
import { SaveListProvider } from '@/components/save-list-provider'

<<<<<<< HEAD
const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const _archivo = Archivo({ subsets: ["latin"], weight: ['400', '500', '600', '700'], variable: '--font-archivo' });
const _spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ['400', '500', '600', '700'], variable: '--font-space-grotesk' });
const _jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ['500', '600'], variable: '--font-jetbrains-mono' });
=======
const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-archivo',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})
>>>>>>> 03fc5097df0c4aa2a1dea6ee2c391c3d9ed2e818

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
<<<<<<< HEAD
    <html lang="en" className={`${_archivo.variable} ${_spaceGrotesk.variable} ${_jetBrainsMono.variable}`}>
      <body className="font-sans antialiased">
        <AgentModeProvider>
          <SaveListProvider>{children}</SaveListProvider>
        </AgentModeProvider>
=======
    <html lang="en" className={`${archivo.variable} ${spaceGrotesk.variable}`} style={{ background: '#0B1220' }}>
      <body className="antialiased" style={{ fontFamily: 'var(--font-space-grotesk,"Space Grotesk",sans-serif)', background: '#0B1220', color: '#F6F8F9', overflowX: 'hidden' }}>
        {children}
>>>>>>> 03fc5097df0c4aa2a1dea6ee2c391c3d9ed2e818
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
