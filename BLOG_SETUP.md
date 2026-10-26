# Blog Setup — MAG Blog Launch

## What's Been Added

Six production-ready blog articles have been integrated into your Next.js codebase:

### Articles (in `/content/blog/`)
1. **is-downtown-miami-loud.mdx** — Is Downtown Miami Loud? A Renter's Guide
2. **check-apartment-noise-before-signing.mdx** — How to Check an Apartment for Noise Before You Sign
3. **months-free-rent-miami-calculator.mdx** — How Months Free Rent Works in Miami—with a Calculator
4. **downtown-vs-brickell-vs-edgewater.mdx** — Downtown Miami vs. Brickell vs. Edgewater: Where Should You Live?
5. **most-convenient-places-to-live-downtown-miami.mdx** — The Most Convenient Places to Live in Downtown Miami and Nearby
6. **best-areas-to-live-in-miami.mdx** — Best Areas to Live in Miami: Find Your Neighborhood

### Routes & Components (in `/app/blog/`)
- `/blog` — Blog index page with articles organized by category
- `/blog/[slug]` — Individual article pages
- `components/rent-calculator.tsx` — Interactive rent calculator (embedded in months-free article)
- `components/mdx-content.tsx` — Markdown renderer for article content
- `utils/blog.ts` — Blog post utilities (file reading, metadata parsing)

## Next Steps

### 1. Install Dependencies
```bash
npm install
```
The new dependencies are in `package.json`:
- `gray-matter` — parses YAML frontmatter from MDX files
- `react-markdown` — renders Markdown to React
- `remark-gfm` — GitHub-flavored Markdown support

### 2. Build & Test Locally
```bash
npm run dev
```
Visit `http://localhost:3000/blog` to see the blog index.

### 3. Deploy
Push to your deployment environment (Vercel):
```bash
git add .
git commit -m "Add blog: six published articles + calculator"
git push origin main
```

## Customization

### Update Blog Navigation
If you want to add a link to the blog in your main navigation, update your header/nav component to include:
```tsx
<Link href="/blog">Blog</Link>
```

### Customize the Calculator
The rent calculator in `app/blog/components/rent-calculator.tsx` is interactive. To embed it in an article, add this to the MDX frontmatter or manually insert:
```tsx
<RentCalculator />
```

### Add More Articles
1. Create a new `.mdx` file in `content/blog/`
2. Add YAML frontmatter (title, description, category, etc.)
3. The article will automatically appear on the blog index

### SEO & Metadata
Each article has:
- **SEO Title** — used in page `<title>` tag
- **Meta Description** — used in `<meta name="description">`
- **Open Graph Tags** — for social media sharing
- **Structured Data** — breadcrumbs + article schema (ready to add)

## What's Ready to Launch

✅ All six articles are written, formatted, and ready  
✅ Interactive rent calculator (Months Free Rent article)  
✅ Related article linking (cross-links between guides)  
✅ Category organization (Noise, Neighborhoods, Costs)  
✅ Mobile-responsive design  
✅ Social sharing metadata  

## What Still Needs Work

⚠️ **In Articles:**
- "Newest Luxury Apartments in Miami" — needs current property data
- "Best Edgewater Condo Buildings" — needs building-specific details
- "Best Wynwood Buildings" — needs venue and property research

These topics are outlined in `topics.json` but not yet drafted. They require current property research before publication.

## Links & References

All articles include real source links (Kaseya Center, Metromover, Bayfront Park, etc.). These are accurate and crawlable.

## Testing Checklist

Before going live:
- [ ] Mobile view (phone width) — readable, calculator works
- [ ] Dark mode (if you support it)
- [ ] Related article links resolve
- [ ] Calculator inputs and outputs render correctly
- [ ] Social share buttons (if added)
- [ ] Sitemap includes `/blog/*` routes
- [ ] Google Search Console indexed (after deploy)

## Questions?

The blog structure follows Next.js 13+ App Router conventions. Articles live in `content/`, routes in `app/blog/`, and shared components in `app/blog/components/`.

To add or edit articles: update the .mdx files in `content/blog/` and the site will auto-generate new routes.
