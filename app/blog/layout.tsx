import type { Metadata } from 'next'
import './blog.css'

export const metadata: Metadata = {
  title: { default: 'Miami Apartment Guides | Miami Apartment Guy', template: '%s | Miami Apartment Guy' },
  description: 'Practical guides for comparing Miami apartments, costs, neighborhoods, and move-in logistics.',
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <div className="blog-shell">{children}</div>
}
