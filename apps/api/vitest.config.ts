import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    globalSetup: ['./test/global-setup.ts'],
    setupFiles: ['./test/setup.ts'],
    // One shared test database: run files one at a time and truncate between tests.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
