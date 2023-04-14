/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  rewrites: async () => {
    return [
      {
        source: '/vu-biometric',
        destination: '/vu/tests/face.html',
      },
    ]
},
}

module.exports = nextConfig
