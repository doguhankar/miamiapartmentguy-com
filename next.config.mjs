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
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), '@sparticuz/chromium', 'puppeteer-core'];
    }
    return config;
  },
  turbopack: {},
}

export default nextConfig
