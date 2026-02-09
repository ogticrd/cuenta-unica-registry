import { withSentryConfig } from '@sentry/nextjs';
import { NextConfig } from 'next';

const { version, name } = require('./package.json');

const nextConfig: NextConfig = {
  serverExternalPackages: [
    '@aws-amplify/adapter-nextjs',
    'aws-amplify',
    'aws-crt', // Avoid AWS SDK Node.js require issue
    'dtrace-provider',
  ],
  transpilePackages: [
    '@tensorflow-models/face-detection',
    '@mediapipe/face-detection',
  ],
  output: 'standalone',
  // Turbopack configuration for module aliasing
  turbopack: {
    resolveAlias: {
      // Fix XState compatibility issues with AWS Amplify UI
      xstate: './node_modules/.pnpm/xstate@4.38.3/node_modules/xstate',
    },
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

  sourcemaps: {
    disable: process.env.APP_ENV !== 'production',
  },

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
});
