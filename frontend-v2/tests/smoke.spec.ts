import { test, expect } from '@playwright/test';

/**
 * Basic smoke test to verify the application is running
 * and key pages are accessible
 */
test.describe('Smoke Tests', () => {
  test('landing page loads successfully', async ({ page }) => {
    // Navigate to the landing page
    await page.goto('/');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Verify the page loaded (check for some common element)
    // This is a basic check - adjust selectors based on actual landing page structure
    await expect(page).toHaveTitle(/KadryHR|Kadry/i);

    // Take a screenshot for visual verification
    await page.screenshot({ path: 'smoke-test-landing.png', fullPage: true });
  });

  test('login page is accessible', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Verify login form elements are present
    await expect(page.getByPlaceholder('twoj@email.pl')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Zaloguj' })).toBeVisible();
  });

  test('navigation works', async ({ page }) => {
    // Start at home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Try to navigate to login page (if there's a link)
    const loginLink = page.getByRole('link', { name: /zaloguj|login/i });
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await page.waitForURL('**/login');
      await expect(page).toHaveURL(/.*login/);
    }
  });

  test('API responds correctly', async ({ request }) => {
    // Verify the backend API is accessible
    const response = await request.get('/api/website/settings');
    
    // Should return 200 (public endpoint)
    expect(response.status()).toBe(200);
  });

  test('employees page structure exists', async ({ page }) => {
    // Navigate to the employees page (requires auth in production, 
    // but we test that the route exists and basic structure loads)
    await page.goto('/panel/pracownicy');
    
    // Wait for initial load
    await page.waitForLoadState('domcontentloaded');
    
    // The page should have loaded - either showing login redirect or the actual page
    // This verifies the route is properly configured
    const url = page.url();
    expect(url).toMatch(/\/(panel\/pracownicy|login)/);
  });

  test('schedule page route responds', async ({ page }) => {
    await page.goto('/panel/grafik');
    await page.waitForLoadState('domcontentloaded');

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      await expect(page.getByRole('button', { name: 'Zaloguj' })).toBeVisible();
      return;
    }

    const errorMessage = page.getByText(/Zaloguj się, aby zobaczyć grafik/i);
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible();
      return;
    }

    await expect(page.getByRole('heading', { name: /grafik pracy/i })).toBeVisible();
  });

  test('panel grafik renders schedule grid for authenticated user', async ({ page }, testInfo) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'kadryhr_auth_tokens',
        JSON.stringify({ accessToken: 'test-token' }),
      );
    });

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-user',
          email: 'manager@test.com',
          role: 'MANAGER',
          firstName: 'Test',
          lastName: 'Manager',
          organisation: { id: 'org-1', name: 'Test Org' },
          permissions: ['SCHEDULE_VIEW', 'SCHEDULE_MANAGE'],
        }),
      });
    });

    await page.route('**/api/employees**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'emp-1',
              firstName: 'Jan',
              lastName: 'Kowalski',
              email: 'jan@example.com',
              locations: [{ id: 'loc-1', name: 'Warszawa' }],
              isActive: true,
              isDeleted: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          total: 1,
          skip: 0,
          take: 10,
        }),
      });
    });

    await page.route('**/api/locations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'loc-1',
            name: 'Warszawa',
            address: 'Test Address',
            employees: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]),
      });
    });

    await page.route('**/api/availability**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/leave-requests/approved**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/schedule/summary**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          range: {
            from: new Date().toISOString(),
            to: new Date().toISOString(),
          },
          totals: {
            hours: 8,
            cost: 100,
            currency: 'PLN',
            shiftsCount: 1,
            shiftsWithoutRate: 0,
            employeesWithoutRate: 0,
          },
          byDay: [
            {
              date: new Date().toISOString().slice(0, 10),
              hours: 8,
              cost: 100,
            },
          ],
        }),
      });
    });

    await page.route('**/api/schedule?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          period: {
            id: 'period-1',
            status: 'DRAFT',
            from: new Date().toISOString(),
            to: new Date().toISOString(),
            locationId: 'loc-1',
            version: 1,
          },
          shifts: [
            {
              id: 'shift-1',
              employeeId: 'emp-1',
              locationId: 'loc-1',
              position: 'Kasjer',
              notes: 'Zmiana poranna',
              startsAt: new Date().toISOString(),
              endsAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
            },
          ],
        }),
      });
    });

    await page.goto('/panel/grafik');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('heading', { name: /Coś poszło nie tak/i })).toHaveCount(0);
    await expect(page.locator('[data-onboarding-target="schedule-grid"]')).toBeVisible();

    await page.screenshot({
      path: testInfo.outputPath('panel-grafik.png'),
      fullPage: true,
    });
  });
});
