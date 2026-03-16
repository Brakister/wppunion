/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', '@whiskeysockets/baileys', 'bcrypt'],
  },
  // Allow images from uploads
  images: { unoptimized: true },
}

module.exports = nextConfig
