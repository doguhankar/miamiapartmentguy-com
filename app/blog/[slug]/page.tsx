import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getBlogPost, getBlogPostSlugs, getAllBlogPosts } from '../utils/blog'
import { MDXContent } from '../components/mdx-content'

export async function generateStaticParams() {
  const slugs = await getBlogPostSlugs()
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug)
  if (!post) return {}

  return {
    title: `${post.seoTitle} | Miami Apartment Guy`,
    description: post.description,
    openGraph: {
      title: post.seoTitle,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
    },
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug)
  if (!post) notFound()

  const allPosts = await getAllBlogPosts()
  const relatedPosts = post.relatedSlugs
    .map(slug => allPosts.find(p => p.slug === slug))
    .filter(p => p !== undefined)

  return (
    <article className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        {/* Header */}
        <header className="mb-12">
          <Link href="/blog" className="text-blue-600 hover:text-blue-700 font-medium text-sm mb-4 inline-block">
            ← Back to blog
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-4">
            {post.title}
          </h1>
          <p className="text-xl text-gray-600 mb-6">{post.description}</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{post.author}</span>
            <span>•</span>
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            <span>•</span>
            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
              {post.category}
            </span>
          </div>
        </header>

        {/* Content */}
        <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-code:text-sm prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded">
          <MDXContent content={post.content} />
        </div>

        {/* CTA */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-700 mb-4">
            <strong>Need help finding an apartment in Miami?</strong>
          </p>
          <p className="text-gray-600 mb-6">
            Text Miami Apartment Guy with your budget, move date, and what matters most. Get a shortlist of real units within 24 hours.
          </p>
          <a
            href="sms:+14077657306"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Text Now
          </a>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Guides</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {relatedPosts.map(related => (
                <Link key={related.slug} href={`/blog/${related.slug}`} className="group">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 mb-2 transition-colors">
                    {related.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{related.description}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  )
}
