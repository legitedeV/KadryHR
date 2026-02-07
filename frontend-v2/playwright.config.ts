import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  webServer: {
    command:
      'NEXT_PUBLIC_E2E=true NEXT_PUBLIC_GRAFIK_EDIT_MODE_TIMEOUT_MS=5000 NEXT_PUBLIC_API_URL=http://localhost:3000/api npm run dev -- --port 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
