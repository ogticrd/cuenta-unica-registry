/** @type {import('next').NextConfig} */
const nextConfig = {
  publicRuntimeConfig: {
    REACT_APP_SOCKET_FACIAL_URL: process.env.REACT_APP_SOCKET_FACIAL_URL,
    NEXT_PUBLIC_IAM_API: process.env.NEXT_PUBLIC_IAM_API,
    NEXT_PUBLIC_CEDULA_API: process.env.NEXT_PUBLIC_CEDULA_API,
    NEXT_PUBLIC_CEDULA_API_KEY: process.env.NEXT_PUBLIC_CEDULA_API_KEY,
    NEXT_PUBLIC_SITE_KEY: process.env.NEXT_PUBLIC_SITE_KEY,
  },
  reactStrictMode: false,
  rewrites: async () => {
    return [
      {
        source: "/vu-biometric",
        destination: "/vu/tests/face.html",
      },
    ];
  },
};

module.exports = nextConfig;
