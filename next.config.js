/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  rewrites: async () => {
    return [
      {
        source: '/asd',
        destination: '/vu/tests/face.html',
      },
    ]
},
}

module.exports = nextConfig
