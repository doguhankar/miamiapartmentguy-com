import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPublishedPost, getPublishedPosts, getPublishedSlugs } from '../utils/blog'
import { MDXContent } from '../components/mdx-content'
import { RentCalculator } from '../components/rent-calculator'

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs()
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPublishedPost(params.slug)
  if (!post) return {}

  return {
    title: `${post.seoTitle} | Miami Apartment Guy`,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.seoTitle,
      description: post.description,
      type: 'article',
      url: `/blog/${post.slug}`,
      publishedTime: post.date,
      authors: [post.author],
    },
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  // getPublishedPost returns null for anything not status:'published' —
  // this 404s drafts even when someone hits the URL directly.
  const post = await getPublishedPost(params.slug)
  if (!post) notFound()

  const allPosts = await getPublishedPosts()
  const relatedPosts = post.relatedSlugs
    .map(slug => allPosts.find(p => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => p !== undefined)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.description,
        author: { '@type': 'Organization', name: post.author },
        publisher: { '@type': 'Organization', name: 'Miami Apartment Guy' },
        datePublished: post.date,
        articleSection: post.category,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Renter guides', item: 'https://www.miamiapartmentguy.com/blog' },
          { '@type': 'ListItem', position: 2, name: post.title, item: `https://www.miamiapartmentguy.com/blog/${post.slug}` },
        ],
      },
    ],
  }

  return (
    <main className="mb-wrap" style={{ paddingTop: 40, paddingBottom: 40 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/blog" className="mb-back">← Back to all guides</Link>

      <div className="mb-article-head">
        <span className="mb-card-tag">{post.category}</span>
        <h1>{post.title}</h1>
        <p className="mb-dek">{post.description}</p>
        <div className="mb-article-meta">
          <span>{post.author}</span>
          <span className="mb-sep">·</span>
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </time>
        </div>
      </div>

      <div className="mb-article-body">
        {post.content.includes('[[CALCULATOR]]') ? (
          <>
            <MDXContent content={post.content.split('[[CALCULATOR]]')[0]} />
            <RentCalculator />
            <MDXContent content={post.content.split('[[CALCULATOR]]')[1] ?? ''} />
          </>
        ) : (
          <MDXContent content={post.content} />
        )}
      </div>

      {post.cta && (
        <div className="mb-article-cta">
          <div className="mb-tag">Need help?</div>
          <h4>Let's find your next place.</h4>
          <p>{post.cta}</p>
          <a href="sms:+14077657306" className="mb-btn mb-btn-pink">Text Don now →</a>
        </div>
      )}

      {relatedPosts.length > 0 && (
        <div className="mb-related">
          <h3>Related guides</h3>
          <div className="mb-related-grid">
            {relatedPosts.map(related => (
              <Link key={related.slug} href={`/blog/${related.slug}`} className="mb-card">
                <h3>{related.title}</h3>
                <p>{related.description}</p>
                <span className="mb-card-link">Read guide →</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
