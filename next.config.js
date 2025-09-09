/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    PROFITWELL_API_KEY: process.env.PROFITWELL_API_KEY,
    PROFITWELL_COMPANY_ID: process.env.PROFITWELL_COMPANY_ID,
  },
}

module.exports = nextConfig