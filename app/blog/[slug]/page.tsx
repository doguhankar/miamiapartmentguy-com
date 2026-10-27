import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MonthsFreeCalculator } from '@/components/blog/months-free-calculator'
import { BLOG_ARTICLES, getArticle, getRelatedArticles, renderMarkdown } from '@/lib/blog'
import { absoluteUrl } from '@/lib/seo'

export function generateStaticParams() {
  return BLOG_ARTICLES.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const article = getArticle(slug)

  if (!article) return {}

  const canonical = absoluteUrl(`/blog/${article.slug}`)

  return {
    title: article.seoTitle,
    description: article.description,
    authors: [{ name: article.author }],
    alternates: { canonical },
    openGraph: {
      type: 'article',
      url: canonical,
      title: article.seoTitle,
      description: article.description,
      siteName: 'Miami Apartment Guy',
    },
    twitter: {
      card: 'summary_large_image',
      title: article.seoTitle,
      description: article.description,
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = getArticle(slug)

  if (!article) notFound()

  const related = getRelatedArticles(article)
  const htmlParts = renderMarkdown(article.body).split('[[CALCULATOR]]')
  const canonical = absoluteUrl(`/blog/${article.slug}`)
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: article.title,
      description: article.description,
      author: { '@type': 'Person', name: article.author },
      mainEntityOfPage: canonical,
      url: canonical,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Blog', item: absoluteUrl('/blog') },
        { '@type': 'ListItem', position: 2, name: article.title, item: canonical },
      ],
    },
  ]

  return (
    <main className="blog-page blog-article-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="blog-header">
        <Link href="/" className="blog-brand">
          MAG<span>.</span>
        </Link>
        <nav>
          <Link href="/blog">All guides</Link>
          <Link href="/start?src=blog">Get help comparing</Link>
        </nav>
      </header>
      <article>
        <div className="article-heading">
          <p className="blog-kicker">{article.category.toUpperCase()}</p>
          <h1>{article.title}</h1>
          <p className="article-excerpt">{article.description}</p>
          <p className="article-meta">
            By {article.author} · <time dateTime={article.date}>{article.date}</time>
          </p>
        </div>
        <div className="article-body">
          <div dangerouslySetInnerHTML={{ __html: htmlParts[0] }} />
          {htmlParts.length > 1 && (
            <>
              <MonthsFreeCalculator />
              <div dangerouslySetInnerHTML={{ __html: htmlParts.slice(1).join('[[CALCULATOR]]') }} />
            </>
          )}
          <aside className="article-cta">
            <p className="blog-kicker">WANT HELP COMPARING YOUR OPTIONS?</p>
            <h2>Bring your shortlist. Keep the numbers clear.</h2>
            <p>{article.cta ?? 'Text Don the details from each quote and ask for help comparing the full cost before you apply.'}</p>
            <Link href="/start?src=blog" className="blog-button">Start a conversation</Link>
          </aside>
        </div>
      </article>
      {related.length > 0 && (
        <section className="related-articles" aria-label="Related guides">
          <p className="blog-kicker">KEEP READING</p>
          <div>
            {related.map((item) => (
              <Link key={item.slug} href={`/blog/${item.slug}`}>
                {item.title}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
