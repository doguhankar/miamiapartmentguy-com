<<<<<<< HEAD
import Link from 'next/link'
import { getPublishedPosts } from './utils/blog'

export const metadata = {
  title: 'Renter Guides | Miami Apartment Guy',
  description: 'Practical Miami apartment guides — noise, neighborhoods, costs, and buildings.',
}

export default async function BlogPage() {
  const posts = await getPublishedPosts()
  const sorted = posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const byCategory = sorted.reduce((acc, post) => {
    const cat = post.category || 'Guides'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(post)
    return acc
  }, {} as Record<string, typeof sorted>)

  return (
    <>
      <header className="mb-hero">
        <div className="mb-wrap">
          <div className="mb-eyebrow"><span className="mb-dot" /> Renter Guides</div>
          <h1>Miami apartments, <span className="mb-teal">the right way.</span></h1>
          <p>Real advice from someone who finds apartments in Miami every day. No fluff, no filler — just what you need to rent smart.</p>
        </div>
      </header>

      <main className="mb-wrap mb-main">
        {Object.entries(byCategory).map(([category, posts]) => (
          <section key={category} className="mb-cat-section">
            <div className="mb-cat-head">
              <h2>{category}</h2>
              <span className="mb-cat-count">{posts.length} guide{posts.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="mb-grid">
              {posts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="mb-card">
                  <span className="mb-card-tag">{post.category}</span>
                  <h3>{post.title}</h3>
                  <p>{post.description}</p>
                  <span className="mb-card-link">Read guide →</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
    </>
  )
=======
import type { Metadata } from 'next'
import Link from 'next/link'
import { BLOG_ARTICLES } from '@/lib/blog'
import { absoluteUrl } from '@/lib/seo'

export const metadata: Metadata = { title: 'Miami Apartment Guides', description: 'Practical guides for comparing Miami apartments, costs, neighborhoods, and move-in logistics.', alternates: { canonical: absoluteUrl('/blog') }, openGraph: { title: 'Miami Apartment Guides', description: 'Practical guides for comparing Miami apartments, costs, neighborhoods, and move-in logistics.', url: absoluteUrl('/blog'), type: 'website' } }

export default function BlogIndexPage() {
  return <main className="blog-page"><header className="blog-header"><Link href="/" className="blog-brand">MAG<span>.</span></Link><nav><Link href="/map">Browse apartments</Link><Link href="/start">Get help comparing</Link></nav></header><section className="blog-intro"><p className="blog-kicker">THE MIAMI APARTMENT GUIDE</p><h1>Useful answers before you sign a lease.</h1><p>Clearer ways to compare rent, fees, neighborhoods, tours, and moving logistics across Miami.</p></section><section className="blog-grid" aria-label="Articles">{BLOG_ARTICLES.map((article) => <article className="blog-card" key={article.slug}><p className="blog-card-kicker">{article.category.toUpperCase()}</p><h2><Link href={`/blog/${article.slug}`}>{article.title}</Link></h2><p>{article.description}</p><Link className="blog-read" href={`/blog/${article.slug}`}>Read the guide <span aria-hidden="true">→</span></Link></article>)}</section><footer className="blog-footer"><p>Have a shortlist? <Link href="/start?src=blog">Ask Don to help compare it.</Link></p></footer></main>
>>>>>>> origin/v0/miamiapartmentguy-com-33fb44df
}
