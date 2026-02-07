import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for CI environment
 * - No webServer (backend already running on port 3001)
 * - API requests go to http://localhost:3001/api
 * - Tests run against the backend API directly
 */
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  outputDir: 'test-results',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  webServer: {
    command:
      'NEXT_PUBLIC_E2E=true NEXT_PUBLIC_GRAFIK_EDIT_MODE_TIMEOUT_MS=5000 NEXT_PUBLIC_API_URL=http://localhost:3000/api npm run dev -- --port 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
