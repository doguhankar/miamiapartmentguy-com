import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const contentDir = path.join(process.cwd(), 'content/blog')

export interface BlogPost {
  slug: string
  title: string
  seoTitle: string
  description: string
  author: string
  date: string
  category: string
  status: string
  relatedSlugs: string[]
  cta: string
  content: string
}

/**
 * Reads a single post by slug, published or not.
 * Callers that render to the public MUST check `status === 'published'`
 * themselves (see getPublishedPost) — this raw reader exists for internal
 * tooling (status audits, admin preview) only.
 */
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const filePath = path.join(contentDir, `${slug}.mdx`)
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const { data, content } = matter(fileContent)

    return {
      slug,
      content,
      title: data.title || '',
      seoTitle: data.seoTitle || data.title || '',
      description: data.description || '',
      author: data.author || 'Miami Apartment Guy',
      date: data.date || new Date().toISOString(),
      category: data.category || 'Guides',
      status: data.status || 'draft',
      relatedSlugs: data.relatedSlugs || [],
      cta: data.cta || '',
    }
  } catch (error) {
    return null
  }
}

/** Public-safe single-post reader. Returns null for anything not 'published'. */
export async function getPublishedPost(slug: string): Promise<BlogPost | null> {
  const post = await getBlogPost(slug)
  if (!post || post.status !== 'published') return null
  return post
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.mdx'))
  const posts = await Promise.all(
    files.map(file => getBlogPost(file.replace('.mdx', '')))
  )
  return posts.filter((p): p is BlogPost => p !== null)
}

/** Only posts with status: 'published'. Use this everywhere user-facing. */
export async function getPublishedPosts(): Promise<BlogPost[]> {
  const posts = await getAllBlogPosts()
  return posts.filter(p => p.status === 'published')
}

export async function getPublishedSlugs(): Promise<string[]> {
  const posts = await getPublishedPosts()
  return posts.map(p => p.slug)
}
