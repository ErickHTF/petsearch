import { defineConfig } from '@playwright/test';

const PORT = 3100;
const DATABASE_URL =
  process.env.E2E_DATABASE_URL ?? 'postgres://petsearch:petsearch@localhost:5432/petsearch_e2e';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    hasTouch: true,
    isMobile: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'mobile-360', use: { viewport: { width: 360, height: 800 } } },
    { name: 'mobile-412', use: { viewport: { width: 412, height: 915 } } },
  ],
  // Uses the production build: run `npm run build` first.
  webServer: {
    command:
      'node e2e/reset-db.mjs && node apps/api/dist/seed/run.js && node apps/api/dist/server.js',
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      DATABASE_URL,
      PORT: String(PORT),
      SESSION_SECRET: 'e2e-only-secret',
      COOKIE_SECURE: 'false',
      SEED_PASSWORD: 'senha-demo-123',
    },
  },
});
