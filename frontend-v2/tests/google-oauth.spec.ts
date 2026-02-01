import { test, expect } from '@playwright/test';

test('login shows only Google OAuth CTA and navigates to OAuth start', async ({ page }) => {
  await page.route('**/api/auth/oauth/google/start**', async (route) => {
    await route.fulfill({ status: 200, body: 'OK' });
  });

  await page.goto('/login');

  await expect(page.getByRole('button', { name: 'Kontynuuj z Google' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Microsoft/i })).toHaveCount(0);

  await Promise.all([
    page.waitForURL('**/api/auth/oauth/google/start**'),
    page.getByRole('button', { name: 'Kontynuuj z Google' }).click(),
  ]);

  const url = new URL(page.url());
  expect(url.pathname).toBe('/api/auth/oauth/google/start');
  expect(url.searchParams.get('redirect')).toBe('/panel');
});
