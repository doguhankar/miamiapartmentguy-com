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
}
