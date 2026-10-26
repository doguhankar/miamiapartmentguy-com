import type { Metadata } from 'next'
import Link from 'next/link'
import { BLOG_ARTICLES } from '@/lib/blog'
import { absoluteUrl } from '@/lib/seo'

export const metadata: Metadata = { title: 'Miami Apartment Guides', description: 'Practical guides for comparing Miami apartments, costs, neighborhoods, and move-in logistics.', alternates: { canonical: absoluteUrl('/blog') } }

export default function BlogIndexPage() {
  return <main className="blog-page"><header className="blog-header"><Link href="/" className="blog-brand">MAG<span>.</span></Link><nav><Link href="/map">Browse apartments</Link><Link href="/start">Get help comparing</Link></nav></header><section className="blog-intro"><p className="blog-kicker">THE MIAMI APARTMENT GUIDE</p><h1>Useful answers before you sign a lease.</h1><p>Clearer ways to compare rent, fees, neighborhoods, tours, and moving logistics across Miami.</p></section><section className="blog-grid" aria-label="Articles">{BLOG_ARTICLES.map((article) => <article className="blog-card" key={article.slug}><p className="blog-card-kicker">MIAMI APARTMENT GUIDE</p><h2><Link href={`/blog/${article.slug}`}>{article.title}</Link></h2><p>{article.excerpt}</p><Link className="blog-read" href={`/blog/${article.slug}`}>Read the guide <span aria-hidden="true">→</span></Link></article>)}</section><footer className="blog-footer"><p>Have a shortlist? <Link href="/start?src=blog">Ask Don to help compare it.</Link></p></footer></main>
}
