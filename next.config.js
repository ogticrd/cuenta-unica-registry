/** @type {import('next').NextConfig} */
const nextConfig = {
  publicRuntimeConfig: {
    NEXT_PUBLIC_PHOTO_API: process.env.NEXT_PUBLIC_PHOTO_API,
    NEXT_PUBLIC_PHOTO_API_KEY: process.env.NEXT_PUBLIC_PHOTO_API_KEY,
    NEXT_PUBLIC_IAM_API: process.env.NEXT_PUBLIC_IAM_API,
    NEXT_PUBLIC_CEDULA_API: process.env.NEXT_PUBLIC_CEDULA_API,
    NEXT_PUBLIC_CEDULA_API_KEY: process.env.NEXT_PUBLIC_CEDULA_API_KEY,
    NEXT_PUBLIC_SITE_KEY: process.env.NEXT_PUBLIC_SITE_KEY,
  },
  reactStrictMode: false,
};

module.exports = nextConfig;
