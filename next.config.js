/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    instrumentationHook: true,
  },
  output: 'standalone',
  webpack: (config, { webpack, isServer, nextRuntime }) => {
    // Avoid AWS SDK Node.js require issue
    if (isServer && nextRuntime === 'nodejs') {
      config.plugins.push(
        new webpack.IgnorePlugin({ resourceRegExp: /^aws-crt$/ }),
      );
    }

    if (!isServer) config.externals = ['dtrace-provider'];

    return config;
  },
};

const { withSentryConfig } = require('@sentry/nextjs');
const { version, name } = require('./package.json');

module.exports = withSentryConfig(
  nextConfig,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    release: `${name}@${version}`,
    cleanArtifacts: true,
    // Suppresses source map uploading logs during build
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
    tunnelRoute: '/api/monitoring',

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,
  },
);
