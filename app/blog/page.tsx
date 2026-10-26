import Link from 'next/link'
import { getAllBlogPosts } from './utils/blog'

export const metadata = {
  title: 'Blog | Miami Apartment Guy',
  description: 'Guides on renting in Miami — noise checks, neighborhood comparisons, rent calculations.',
}

export default async function BlogPage() {
  const posts = await getAllBlogPosts()
  const published = posts.filter(p => p.status === 'draft' || !p.status).sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const byCategory = published.reduce((acc, post) => {
    const cat = post.category || 'Guides'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(post)
    return acc
  }, {} as Record<string, typeof published>)

  return (
    <main className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">Miami Apartment Guides</h1>
        <p className="text-lg text-gray-600">
          Rent smarter. Real advice from someone who finds apartments in Miami every day.
        </p>
      </div>

      <div className="space-y-12">
        {Object.entries(byCategory).map(([category, posts]) => (
          <section key={category}>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
              {category}
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {posts.map((post) => (
                <article key={post.slug} className="group">
                  <Link href={`/blog/${post.slug}`}>
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 mb-2 transition-colors">
                      {post.title}
                    </h3>
                  </Link>
                  <p className="text-gray-600 text-sm mb-4">{post.description}</p>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-flex items-center gap-1"
                  >
                    Read more →
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
