import { defineConfig } from '@sc-voice/vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.{js,mjs}'],
    testTimeout: 10000,
  },
});
