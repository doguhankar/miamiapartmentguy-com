import fs from 'node:fs'
import path from 'node:path'

export type BlogArticle = {
  slug: string
  title: string
  seoTitle: string
  description: string
  author: string
  date?: string
  category: string
  status: 'published' | 'draft'
  relatedSlugs: string[]
  cta?: string
  body: string
}

const CONTENT_DIR = path.join(process.cwd(), 'content/blog')
const FRONTMATTER = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/

function parseScalar(value: string) {
  const trimmed = value.trim().replace(/^['"]|['"]$/g, '')
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed.slice(1, -1).split(',').map((item) => item.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
  }
  return trimmed
}

function parseArticle(fileName: string): BlogArticle {
  const source = fs.readFileSync(path.join(CONTENT_DIR, fileName), 'utf8')
  const match = source.match(FRONTMATTER)
  if (!match) throw new Error(`Missing frontmatter in ${fileName}`)
  const data: Record<string, string | string[]> = {}
  for (const line of match[1].split('\n')) {
    const separator = line.indexOf(':')
    if (separator === -1) continue
    data[line.slice(0, separator).trim()] = parseScalar(line.slice(separator + 1))
  }
  return {
    slug: fileName.replace(/\.mdx$/, ''),
    title: String(data.title ?? ''),
    seoTitle: String(data.seoTitle ?? data.title ?? ''),
    description: String(data.description ?? ''),
    author: String(data.author ?? 'Miami Apartment Guy'),
    date: data.date ? String(data.date) : undefined,
    category: String(data.category ?? 'Guides'),
    status: data.status === 'published' ? 'published' : 'draft',
    relatedSlugs: Array.isArray(data.relatedSlugs) ? data.relatedSlugs : [],
    cta: data.cta ? String(data.cta) : undefined,
    body: match[2].trim(),
  }
}

const ALL_ARTICLES = fs.readdirSync(CONTENT_DIR).filter((fileName) => fileName.endsWith('.mdx')).map(parseArticle)
export const BLOG_ARTICLES = ALL_ARTICLES.filter((article) => article.status === 'published')

const LEGACY_ARTICLE_ALIASES: Record<string, string> = {
  'miami-apartment-rent-fees-concessions': 'miami-apartment-hidden-fees',
  'brickell-vs-downtown-miami-apartments': 'downtown-vs-brickell-vs-edgewater',
  'moving-to-miami-apartment-checklist': 'best-areas-to-live-in-miami',
}

export function getArticle(slug: string) {
  const canonicalSlug = LEGACY_ARTICLE_ALIASES[slug] ?? slug
  const article = ALL_ARTICLES.find((candidate) => candidate.slug === canonicalSlug && candidate.status === 'published')
  return article && canonicalSlug !== slug ? { ...article, slug } : article
}

export function getRelatedArticles(article: BlogArticle) {
  return article.relatedSlugs.map((slug) => getArticle(slug)).filter((related): related is BlogArticle => Boolean(related))
}

export function renderMarkdown(markdown: string) {
  const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const inline = (value: string) => value
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
  const lines = markdown.split('\n')
  const output: string[] = []
  let paragraph: string[] = []
  let list: string[] = []
  const flush = () => {
    if (paragraph.length) { output.push(`<p>${inline(escape(paragraph.join(' ')))}</p>`); paragraph = [] }
    if (list.length) { output.push(`<ul>${list.map((item) => `<li>${inline(escape(item))}</li>`).join('')}</ul>`); list = [] }
  }
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (!line.trim()) { flush(); continue }
    if (line === '[[CALCULATOR]]') { flush(); output.push(line); continue }
    if (line.startsWith('<') || line.startsWith('|')) {
      flush()
      if (line.startsWith('|')) {
        const rows: string[] = []
        while (lines[index]?.startsWith('|')) rows.push(lines[index++])
        index -= 1
        const cells = rows.filter((row) => !/^\|\s*:?-+/.test(row)).map((row) => row.split('|').slice(1, -1).map((cell) => `<td>${inline(escape(cell.trim()))}</td>`).join(''))
        output.push(`<div class="article-table-wrap"><table><tbody>${cells.map((row) => `<tr>${row}</tr>`).join('')}</tbody></table></div>`)
      } else output.push(line)
      continue
    }
    const heading = line.match(/^(#{2,6})\s+(.+)$/)
    if (heading) { flush(); const level = heading[1].length; output.push(`<h${level}>${inline(escape(heading[2]))}</h${level}>`); continue }
    const bullet = line.match(/^[-*]\s+(.+)$/)
    if (bullet) { if (paragraph.length) flush(); list.push(bullet[1]); continue }
    paragraph.push(line.trim())
  }
  flush()
  return output.join('\n')
}
