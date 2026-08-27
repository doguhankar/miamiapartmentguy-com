import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Join the Team — Miami Apartment Guy',
  description: 'Join Miami Apartment Guy\'s content-first apartment locating team.',
}

export default function JoinTeamLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
