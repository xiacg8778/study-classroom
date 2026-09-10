import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    env: { VITE_AI_MODE: 'ai' },
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
});
