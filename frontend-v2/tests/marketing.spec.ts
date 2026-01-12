import { test, expect } from '@playwright/test';

test('landing navigation and lead form', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /grafiki zmianowe/i })).toBeVisible();

  await page.getByRole('link', { name: 'Cennik' }).click();
  await expect(page).toHaveURL(/\/cennik/);

  await page.goto('/kontakt');
  await page.route('**/api/public/leads', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, id: 'mock-lead' }),
    });
  });

  await page.getByLabel('Imię i nazwisko').fill('Test Lead');
  await page.getByLabel('E-mail').fill('lead@example.com');
  await page.getByLabel('Firma / sieć').fill('Retail Demo');
  await page.getByLabel('Liczba pracowników').fill('45');
  await page.getByLabel('Wiadomość').fill('Proszę o demo.');
  await page.getByLabel(/politykę prywatności/i).check();

  await page.getByRole('button', { name: /umów demo/i }).click();
  await expect(page.getByText(/Dziękujemy/i)).toBeVisible();
});

test('theme toggle switches modes', async ({ page }) => {
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Przełącz motyw' });
  await toggle.click();
  await expect(page.locator('html')).toHaveClass(/dark|light/);
});
