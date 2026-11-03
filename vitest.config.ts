import { fileURLToPath } from 'node:url';
import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: '@public',
        replacement: fileURLToPath(new URL('./public', import.meta.url)),
      },
      {
        // Tests execute server modules directly; Next.js enforces this boundary at build time.
        find: 'server-only',
        replacement: fileURLToPath(
          new URL(
            './node_modules/next/dist/compiled/server-only/empty.js',
            import.meta.url,
          ),
        ),
      },
      {
        find: /^@\/common\/helpers\/rekognition$/,
        replacement: fileURLToPath(
          new URL('./__tests__/mocks/rekognition-helper.ts', import.meta.url),
        ),
      },
      {
        find: '@sentry/nextjs',
        replacement: fileURLToPath(
          new URL('./__tests__/mocks/sentry-nextjs.ts', import.meta.url),
        ),
      },
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url)),
      },
    ],
  },
  test: {
    environment: 'jsdom',
    exclude: [...configDefaults.exclude, '**/.kilo/**'],
  },
});
