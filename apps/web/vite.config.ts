/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defaultClientConditions, defaultServerConditions, defineConfig, loadEnv } from 'vite';

// Load @extracker/shared from its TypeScript source, so dev, build and tests need no separate build.
const sourceCondition = '@extracker/source';
const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repoRoot, '');

  return {
    plugins: [react()],
    resolve: { conditions: [sourceCondition, ...defaultClientConditions] },
    ssr: { resolve: { conditions: [sourceCondition, ...defaultServerConditions] } },
    server: {
      // Development only. In Docker, nginx proxies /api to the API service. Paths pass through
      // unchanged, because the API serves everything under /api.
      proxy: {
        '/api': { target: env.API_PROXY_TARGET || 'http://localhost:3000' },
      },
    },
    test: {
      environment: 'node',
      include: ['test/**/*.test.{ts,tsx}'],
    },
  };
});
