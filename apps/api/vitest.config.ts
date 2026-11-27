import { defaultServerConditions } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Load @extracker/shared from its TypeScript source, so tests need no build first.
  resolve: { conditions: ['@extracker/source', ...defaultServerConditions] },
  ssr: { resolve: { conditions: ['@extracker/source', ...defaultServerConditions] } },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
