import { withSentryConfig } from '@sentry/nextjs';
import { NextConfig } from 'next';

const { version, name } = require('./package.json');

const nextConfig: NextConfig = {
  serverExternalPackages: [
    '@aws-amplify/adapter-nextjs',
    'aws-amplify',
    'aws-crt',
    'dtrace-provider',
  ],

  output: 'standalone',

  turbopack: {
    resolveAlias: {
      xstate: './node_modules/xstate',
    },
  },
};

export default withSentryConfig(nextConfig, {
  release: {
    name: `${name}@${version}`,
  },
  silent: true,

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  widenClientFileUpload: true,

  tunnelRoute: '/api/monitoring',

  sourcemaps: {
    disable: process.env.APP_ENV !== 'production',
  },
});
