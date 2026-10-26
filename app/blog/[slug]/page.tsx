import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BLOG_ARTICLES, getArticle } from '@/lib/blog'
import { absoluteUrl } from '@/lib/seo'

export function generateStaticParams() { return BLOG_ARTICLES.map(({ slug }) => ({ slug })) }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const article = getArticle((await params).slug)
  if (!article) return {}
  return { title: article.seoTitle, description: article.description, alternates: { canonical: absoluteUrl(`/blog/${article.slug}`) }, openGraph: { type: 'article', url: absoluteUrl(`/blog/${article.slug}`), title: article.seoTitle, description: article.description, siteName: 'Miami Apartment Guy' } }
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const article = getArticle((await params).slug)
  if (!article) notFound()
  return <main className="blog-page blog-article-page"><header className="blog-header"><Link href="/" className="blog-brand">MAG<span>.</span></Link><nav><Link href="/blog">All guides</Link><Link href="/start?src=blog">Get help comparing</Link></nav></header><article><div className="article-heading"><p className="blog-kicker">MIAMI APARTMENT GUIDE</p><h1>{article.title}</h1><p className="article-excerpt">{article.excerpt}</p></div><div className="article-body">{article.sections.map((section) => <section key={section.heading}><h2>{section.heading}</h2>{section.paragraphs?.map((paragraph, index) => <p key={index}>{paragraph}</p>)}{section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}{section.table && <div className="article-table-wrap"><table><thead><tr><th>Item</th><th>Example amount</th></tr></thead><tbody>{section.table.map((row) => <tr key={row.item}><th scope="row">{row.item}</th><td>{row.amount}</td></tr>)}</tbody></table></div>}</section>)}<aside className="article-cta"><p className="blog-kicker">WANT HELP COMPARING YOUR OPTIONS?</p><h2>Bring your shortlist. Keep the numbers clear.</h2><p>Send your target budget, bedroom count, move-in date, parking needs, and preferred areas. Ask Don to help you compare the full cost before you apply.</p><Link href="/start?src=blog" className="blog-button">Start a conversation</Link></aside></div></article></main>
}
