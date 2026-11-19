/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'miamiapartmentguy.com' }],
        destination: 'https://www.miamiapartmentguy.com/:path*',
        permanent: true,
      },
    ]
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
}

export default nextConfig
