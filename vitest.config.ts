import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^@\/common\/helpers\/rekognition$/,
        replacement: new URL(
          './__tests__/mocks/rekognition-helper.ts',
          import.meta.url,
        ).pathname,
      },
      {
        find: '@sentry/nextjs',
        replacement: new URL(
          './__tests__/mocks/sentry-nextjs.ts',
          import.meta.url,
        ).pathname,
      },
      {
        find: '@/',
        replacement: new URL('./src/', import.meta.url).pathname,
      },
    ],
  },
  test: {
    environment: 'jsdom',
  },
});
