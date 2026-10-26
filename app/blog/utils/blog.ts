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
  content: string
}

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
    }
  } catch (error) {
    return null
  }
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.mdx'))
  const posts = await Promise.all(
    files.map(file => getBlogPost(file.replace('.mdx', '')))
  )
  return posts.filter((p): p is BlogPost => p !== null)
}

export async function getBlogPostSlugs(): Promise<string[]> {
  const posts = await getAllBlogPosts()
  return posts.map(p => p.slug)
}
