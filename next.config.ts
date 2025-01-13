import { withSentryConfig } from '@sentry/nextjs';
import { NextConfig } from 'next';

const { version, name } = require('./package.json');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@aws-amplify/adapter-nextjs', 'aws-amplify'],
  output: 'standalone',
  webpack: (config, { webpack, isServer, nextRuntime }) => {
    // Avoid AWS SDK Node.js require issue
    if (isServer && nextRuntime === 'nodejs') {
      config.plugins.push(
        new webpack.IgnorePlugin({ resourceRegExp: /^aws-crt$/ }),
      );
    }

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
      config.externals = ['dtrace-provider'];
    }

    config.cache = {
      type: 'filesystem',
      store: 'pack',
      compression: 'gzip',
    };

    return config;
  },
};

export default withSentryConfig(nextConfig, {
  release: {
    name: `${name}@${version}`,
  },
  // Suppresses source map uploading logs during build
  silent: true,

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
  tunnelRoute: '/api/monitoring',

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  sourcemaps: {
    disable: process.env.APP_ENV !== 'production',
  },

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
});
