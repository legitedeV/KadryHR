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
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  // No webServer in CI - backend is already started
  // Tests that need a frontend will need to handle that separately
});
