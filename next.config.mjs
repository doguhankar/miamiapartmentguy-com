/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
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
