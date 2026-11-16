import { withSentryConfig } from '@sentry/nextjs/config';
import { NextConfig } from 'next';

const { version, name } = require('./package.json');

const nextConfig: NextConfig = {
  serverExternalPackages: [
    // Resolve the SDK at runtime so Bun selects its native conditional export,
    // including when this standalone bundle was built with Node.js.
    '@sentry/nextjs',
    '@aws-amplify/adapter-nextjs',
    'aws-amplify',
    'aws-crt',
    'dtrace-provider',
  ],

  output: 'standalone',

  // Next's Node-oriented file tracing omits Bun's conditional SDK entry point.
  outputFileTracingIncludes: {
    '/*': [
      './node_modules/@sentry/nextjs/build/cjs/index.bun.js',
      './node_modules/@sentry/bun/package.json',
      './node_modules/@sentry/bun/build/cjs/**/*.js',
      './node_modules/@sentry/server-utils/build/cjs/index.request-handler.js',
    ],
  },

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

  sourcemaps: {
    disable: process.env.APP_ENV !== 'production',
  },
});
