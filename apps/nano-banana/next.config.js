/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@repo/auth-config',
    '@repo/business-logic',
    '@repo/database',
    '@repo/constants',
    '@repo/ui'
  ],
  experimental: {
    optimizePackageImports: ['@repo/ui', 'lucide-react']
  },
  images: {
    domains: [
      'qoxznbwvyomyyijokkgk.supabase.co',
      'localhost',
      'storage.googleapis.com'
    ]
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
  // For Vercel deployment
  output: 'standalone',
  poweredByHeader: false,
  compress: true
}

module.exports = nextConfig