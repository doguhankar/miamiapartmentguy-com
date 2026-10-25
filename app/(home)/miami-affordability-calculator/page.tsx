import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { SeoShell } from '@/components/seo/seo-shell'
import { AffordabilityCalculator } from '@/components/affordability/affordability-calculator'
import { getAffordabilityDataset } from '@/lib/affordability-data'
import { bedLabel, explainerStats, formatUsd, RENT_INCOME_MULTIPLE } from '@/lib/affordability'
import { TAX_YEAR, estimateStateTax } from '@/lib/state-tax'
import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  agentJsonLd,
  breadcrumbJsonLd,
  serializeJsonLd,
  slugify,
} from '@/lib/seo'

export const revalidate = 3600

const PATH = '/miami-affordability-calculator'
const TITLE = `Can I Afford Miami? Rent Affordability Calculator (${TAX_YEAR}) | ${SITE_NAME}`
const DESCRIPTION =
  'Enter your salary to see the Miami rent you qualify for, the state income tax you stop paying in Florida, and the neighborhoods and buildings that fit. Uses live pricing and real fees. Free.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: {
    type: 'website',
    url: PATH,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: absoluteUrl(DEFAULT_OG_IMAGE), width: 1200, height: 630, alt: 'A Miami high-rise apartment building' }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [absoluteUrl(DEFAULT_OG_IMAGE)] },
}

function formatDate(iso: string | null): string {
  if (!iso) return 'recently'
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

export default async function MiamiAffordabilityCalculatorPage() {
  const dataset = await getAffordabilityDataset()
  const stats = explainerStats(dataset)
  const updated = formatDate(dataset.updatedAt)
  const hoods = [...new Set(dataset.buildings.map((building) => building.neighborhood))]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ name, slug: slugify(name) }))

  const oneBed = stats.medianByBeds[1]
  const salaryFor = (monthly: number | null) => (monthly ? formatUsd(monthly * 12 * RENT_INCOME_MULTIPLE) : null)
  const hoodRows = stats.oneBedByNeighborhood
  const cheapest = hoodRows[0]
  const priciest = hoodRows[hoodRows.length - 1]

  const exampleTax = (key: string) => formatUsd(estimateStateTax(100000, key).total)

  const salaryAnswer = oneBed
    ? `Using the 3x rule, the median 1-bedroom we track costs about ${formatUsd(oneBed)} a month all-in (rent plus required fees, minus free-rent concessions), so you need roughly ${salaryFor(oneBed)} a year in gross income. A studio runs about ${formatUsd(stats.medianByBeds[0] ?? 0)} a month (${salaryFor(stats.medianByBeds[0])}/year) and a 2-bedroom about ${formatUsd(stats.medianByBeds[2] ?? 0)} (${salaryFor(stats.medianByBeds[2])}/year).${cheapest && priciest ? ` By neighborhood, the median 1-bedroom ranges from ${formatUsd(cheapest.medianCost)} in ${cheapest.name} to ${formatUsd(priciest.medianCost)} in ${priciest.name}.` : ''}`
    : 'Most Miami buildings require gross income of about 3x the monthly rent. Enter your salary in the calculator to see what you qualify for.'

  const faqs = [
    { q: 'What salary do you need to live in Miami?', a: salaryAnswer },
    {
      q: 'What is the 3x rent rule?',
      a: `Most Miami apartment buildings require your gross monthly income to be at least 3x the monthly rent. Divide your annual salary by 12, then by 3, to get your maximum rent. For example, a ${formatUsd(95000)} salary is ${formatUsd(95000 / 12)} a month, which qualifies for rent up to ${formatUsd(95000 / 12 / 3)}. Some buildings accept a guarantor or a larger deposit if you fall short.`,
    },
    {
      q: 'Does Florida have a state income tax?',
      a: `No. Florida does not tax wages at the state level. As an estimate for ${TAX_YEAR} (single filer, standard deduction), someone earning ${formatUsd(100000)} would stop paying about ${exampleTax('nyc')} a year moving from New York City, ${exampleTax('nj')} from New Jersey, ${exampleTax('ca')} from California, ${exampleTax('il')} from Illinois and ${exampleTax('ma')} from Massachusetts. These are estimates, not tax advice.`,
    },
    {
      q: 'What hidden fees do Miami apartments have?',
      a: `Advertised rent is rarely the full monthly bill. Of the ${stats.buildingCount} buildings we track, ${stats.feesPublishedCount} publish their fees.${stats.avgRequiredMonthly ? ` Among them, required monthly fees average about ${formatUsd(stats.avgRequiredMonthly)} a month` : ''}${stats.avgPetMonthly ? ` and pet rent averages about ${formatUsd(stats.avgPetMonthly)} a month` : ''}${stats.avgRequiredMonthly ? '.' : ''} ${stats.concessionBuildingCount} buildings currently offer free rent that lowers the true monthly cost. The calculator adds required fees and pet rent, then subtracts concessions spread over the lease. Where a building has not published fees, we say so instead of assuming $0.`,
    },
    {
      q: 'Is an apartment locator free?',
      a: 'Yes. Miami Apartment Guy is free for renters. Leasing offices pay the locator fee, so you pay the same rent and fees you would pay on your own. Don, a licensed Florida agent, compares live pricing and sends you a short list that fits your budget.',
    },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      agentJsonLd(),
      {
        '@type': 'WebApplication',
        '@id': `${SITE_URL}${PATH}#app`,
        name: 'Can I Afford Miami? Rent Affordability Calculator',
        url: `${SITE_URL}${PATH}`,
        description: DESCRIPTION,
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript',
        inLanguage: 'en-US',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        provider: { '@id': `${SITE_URL}/#agent` },
        ...(dataset.updatedAt ? { dateModified: dataset.updatedAt } : {}),
      },
      {
        ...breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Miami affordability calculator', path: PATH },
        ]),
        '@id': `${SITE_URL}${PATH}#breadcrumb`,
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map((item) => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })),
      },
    ],
  }

  return (
    <SeoShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <div className="mh-wrap">
        <p className="sp-eyebrow">Free Miami rent calculator</p>
        <h1 className="sp-title">Can I afford Miami?</h1>
        <p className="sp-answer">
          <strong>Enter your salary to see what you qualify for.</strong> We show the rent you can get approved for at the 3x rule, the
          state income tax you stop paying in Florida, and the neighborhoods and buildings that fit, using live Miami pricing and real
          monthly fees.
        </p>

        <Suspense fallback={<p className="ac-empty">Loading the calculator…</p>}>
          <AffordabilityCalculator dataset={dataset} hoods={hoods} />
        </Suspense>

        <section className="sp-section" aria-labelledby="explainer">
          <h2 id="explainer">How much does it cost to live in Miami?</h2>
          <p className="sp-prose">
            Miami rent is more than the number on the listing. We calculate a true monthly cost for every unit: advertised rent, plus
            required monthly fees, plus pet rent if you have a pet, minus any free-rent concession spread across the lease. {salaryAnswer}
          </p>
          <p className="sp-prose">
            Florida has no state income tax, so movers from high-tax states keep more of each paycheck. The calculator estimates that
            saving for {TAX_YEAR} using single-filer brackets. It is an estimate, not tax advice.
          </p>
          {hoodRows.length > 0 && (
            <div className="ac-table-wrap">
              <table className="ac-table">
                <caption>Median true monthly cost of a 1-bedroom by neighborhood</caption>
                <thead>
                  <tr>
                    <th scope="col">Neighborhood</th>
                    <th scope="col">Median {bedLabel(1)}</th>
                  </tr>
                </thead>
                <tbody>
                  {hoodRows.map((row) => (
                    <tr key={row.slug}>
                      <th scope="row">
                        <Link href={`/neighborhoods/${row.slug}`}>{row.name}</Link>
                      </th>
                      <td>{formatUsd(row.medianCost)}/mo</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="ac-credit">Data by Miami Apartment Guy — updated {updated}</p>
        </section>

        <section className="sp-section" aria-labelledby="faq">
          <h2 id="faq">Miami affordability questions</h2>
          <div className="sp-faq">
            {faqs.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </SeoShell>
  )
}
