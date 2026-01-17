import { test, expect } from '@playwright/test';

test('login shows error and stops loading on invalid credentials', async ({ page }) => {
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Nieprawidłowe dane' }),
    });
  });

  await page.goto('/login');

  await page.getByPlaceholder('twoj@email.pl').fill('wrong@example.com');
  await page.getByPlaceholder('••••••••').fill('invalid');
  await page.getByRole('button', { name: 'Zaloguj' }).click();

  await expect(page.getByText('Nieprawidłowe dane')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Zaloguj' })).toBeEnabled();
});
