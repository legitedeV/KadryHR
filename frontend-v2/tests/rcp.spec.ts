import { test, expect } from '@playwright/test';

test.describe('RCP Panel', () => {
  test('should show RCP settings page for authenticated manager', async ({
    page,
  }) => {
    // Mock authentication
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-user',
          email: 'manager@test.com',
          role: 'MANAGER',
          organisationId: 'test-org',
        }),
      });
    });

    // Mock locations
    await page.route('**/api/locations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'loc-1',
            name: 'Test Location',
            address: 'Test Address',
            geoLat: 52.2297,
            geoLng: 21.0122,
            geoRadiusMeters: 100,
            rcpEnabled: true,
            rcpAccuracyMaxMeters: 100,
          },
        ]),
      });
    });

    await page.goto('/panel/rcp');

    // Check page title
    await expect(
      page.getByRole('heading', { name: /Rejestracja czasu pracy/i }),
    ).toBeVisible();

    // Check location selection
    await expect(page.getByText('Test Location')).toBeVisible();

    // Check settings section
    await expect(page.getByText('Ustawienia RCP')).toBeVisible();
    await expect(page.getByText('RCP włączone')).toBeVisible();

    // Check generate button
    await expect(
      page.getByRole('button', { name: /Wygeneruj kod QR/i }),
    ).toBeVisible();
  });

  test('should generate QR code', async ({ page }) => {
    // Mock authentication
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-user',
          email: 'manager@test.com',
          role: 'MANAGER',
          organisationId: 'test-org',
        }),
      });
    });

    // Mock locations
    await page.route('**/api/locations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'loc-1',
            name: 'Test Location',
            geoLat: 52.2297,
            geoLng: 21.0122,
            geoRadiusMeters: 100,
            rcpEnabled: true,
            rcpAccuracyMaxMeters: 100,
          },
        ]),
      });
    });

    // Mock QR generation
    await page.route('**/api/rcp/qr/generate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          qrUrl: 'http://localhost:3000/m/rcp?token=test-token',
          tokenExpiresAt: new Date(Date.now() + 3600000).toISOString(),
        }),
      });
    });

    await page.goto('/panel/rcp');

    // Click generate button
    await page.getByRole('button', { name: /Wygeneruj kod QR/i }).click();

    // Wait for QR code to be generated and displayed
    await expect(page.getByAltText('QR Code')).toBeVisible({ timeout: 5000 });

    // Check download and print buttons appear
    await expect(page.getByRole('button', { name: /Pobierz/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Drukuj/i })).toBeVisible();
  });
});

test.describe('RCP Mobile', () => {
  test('should show mobile RCP page with token', async ({ page }) => {
    // Mock authentication
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-user',
          email: 'employee@test.com',
          role: 'EMPLOYEE',
          organisationId: 'test-org',
        }),
      });
    });

    // Mock RCP status
    await page.route('**/api/rcp/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          lastEvent: null,
          isClockedIn: false,
        }),
      });
    });

    await page.goto('/m/rcp?token=test-token-12345');

    // Check page title
    await expect(
      page.getByRole('heading', { name: /Rejestracja czasu pracy/i }),
    ).toBeVisible();

    // Check location button
    await expect(
      page.getByRole('button', { name: /Pobierz lokalizację/i }),
    ).toBeVisible();
  });

  test('should show error when no token provided', async ({ page }) => {
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-user',
          email: 'employee@test.com',
          role: 'EMPLOYEE',
        }),
      });
    });

    await page.goto('/m/rcp');

    // Should show error message
    await expect(page.getByText(/Brak tokenu/i)).toBeVisible();
    await expect(
      page.getByText(/Zeskanuj kod QR udostępniony przez kierownika/i),
    ).toBeVisible();
  });
});
