/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  webpack: (config, { webpack, isServer, nextRuntime }) => {
    // Avoid AWS SDK Node.js require issue
    if (isServer && nextRuntime === 'nodejs')
      config.plugins.push(
        new webpack.IgnorePlugin({ resourceRegExp: /^aws-crt$/ }),
      );
    if (!isServer) {
      config.node = {
        fs: 'empty',
      };
      config.externals = ['dtrace-provider', 'fs'];
    }
    return config;
  },
};

module.exports = nextConfig;
