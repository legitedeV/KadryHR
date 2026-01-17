import { test, expect } from '@playwright/test';

test('landing navigation and lead form', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /grafiki, czas pracy i urlopy/i })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Zaloguj' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Rejestracja' })).toBeVisible();

  await page.getByRole('navigation').getByRole('link', { name: 'Cennik' }).click();
  await expect(page).toHaveURL(/#cennik/);

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

test('header auth links navigate', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Zaloguj' }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.goto('/');
  await page.getByRole('link', { name: 'Rejestracja' }).click();
  await expect(page).toHaveURL(/\/register/);
});
