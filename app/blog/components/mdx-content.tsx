'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

interface MDXContentProps {
  content: string
}

/**
 * Renders markdown with plain semantic elements. Styling comes entirely
 * from blog.css (.mb-article-body h2, p, a, table, etc.) — no inline
 * className overrides needed, matching the scoped mh-/mb- pattern used
 * across the rest of the site.
 *
 * rehype-raw is required: some article source text has inline HTML
 * (<a href>, a hand-built <table>) that must render as real markup,
 * not escape to literal text.
 */
export function MDXContent({ content }: MDXContentProps) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
      {content}
    </ReactMarkdown>
  )
}
