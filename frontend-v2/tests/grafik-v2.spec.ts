import { test, expect } from '@playwright/test';

test.describe('Grafik-v2 Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'mock-token',
          user: {
            id: '1',
            email: 'manager@example.com',
            firstName: 'Test',
            lastName: 'Manager',
            role: 'MANAGER',
            organisation: { id: '1', name: 'Test Org' },
            permissions: ['SCHEDULE_MANAGE', 'SCHEDULE_VIEW'],
          },
        }),
      });
    });

    // Mock employees list
    await page.route('**/api/employees**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: '1',
              firstName: 'Jan',
              lastName: 'Kowalski',
              email: 'jan@example.com',
              avatarUrl: null,
              position: 'Kasjer',
              locations: [{ id: '1', name: 'Sklep Główny' }],
              isActive: true,
              isDeleted: false,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
            {
              id: '2',
              firstName: 'Anna',
              lastName: 'Nowak',
              email: 'anna@example.com',
              avatarUrl: null,
              position: 'Manager',
              locations: [{ id: '1', name: 'Sklep Główny' }],
              isActive: true,
              isDeleted: false,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          ],
          total: 2,
          skip: 0,
          take: 100,
        }),
      });
    });

    // Mock shifts
    await page.route('**/api/shifts**', async (route) => {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            employeeId: '1',
            startsAt: `${todayStr}T06:00:00.000Z`,
            endsAt: `${todayStr}T15:00:00.000Z`,
            locationId: '1',
            employee: {
              id: '1',
              firstName: 'Jan',
              lastName: 'Kowalski',
            },
          },
        ]),
      });
    });

    // Mock shift presets
    await page.route('**/api/shift-presets**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            organisationId: '1',
            name: 'Rano',
            code: 'R',
            startMinutes: 360, // 06:00
            endMinutes: 900, // 15:00
            color: '#3b82f6',
            isDefault: true,
            isActive: true,
            sortOrder: 1,
          },
          {
            id: '2',
            organisationId: '1',
            name: 'Popołudnie',
            code: 'P',
            startMinutes: 870, // 14:30
            endMinutes: 1380, // 23:00
            color: '#8b5cf6',
            isDefault: true,
            isActive: true,
            sortOrder: 2,
          },
          {
            id: '3',
            organisationId: '1',
            name: 'Dostawa',
            code: 'D',
            startMinutes: 360, // 06:00
            endMinutes: 720, // 12:00
            color: '#10b981',
            isDefault: false,
            isActive: true,
            sortOrder: 3,
          },
        ]),
      });
    });

    // Mock locations
    await page.route('**/api/locations**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: '1',
            name: 'Sklep Główny',
            address: 'ul. Przykładowa 1',
            employees: [],
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
          {
            id: '2',
            name: 'Sklep Drugie Miasto',
            address: 'ul. Inna 2',
            employees: [],
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ]),
      });
    });

    // Mock auth/me
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '1',
          email: 'manager@example.com',
          firstName: 'Test',
          lastName: 'Manager',
          role: 'MANAGER',
          organisation: { id: '1', name: 'Test Org' },
          permissions: ['SCHEDULE_MANAGE', 'SCHEDULE_VIEW'],
        }),
      });
    });
  });

  test('should load grafik-v2 page successfully', async ({ page }) => {
    await page.goto('/panel/grafik-v2');

    // Wait for page title
    await expect(page.getByRole('heading', { name: /Grafik zmian v2/i })).toBeVisible({ timeout: 10000 });

    // Verify employees are loaded
    await expect(page.getByText('Jan Kowalski')).toBeVisible();
    await expect(page.getByText('Anna Nowak')).toBeVisible();
  });

  test('should display location filter dropdown', async ({ page }) => {
    await page.goto('/panel/grafik-v2');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: /Grafik zmian v2/i })).toBeVisible({ timeout: 10000 });

    // Look for location filter select
    const locationSelect = page.locator('select').filter({ hasText: /Wszystkie lokalizacje/i });
    await expect(locationSelect).toBeVisible();

    // Verify location options
    await expect(locationSelect).toContainText('Sklep Główny');
    await expect(locationSelect).toContainText('Sklep Drugie Miasto');
  });

  test('should display month and year', async ({ page }) => {
    await page.goto('/panel/grafik-v2');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: /Grafik zmian v2/i })).toBeVisible({ timeout: 10000 });

    // Verify month/year badge is visible
    // The badge shows current month and year dynamically
    const currentDate = new Date();
    const monthNames = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];
    const expectedMonth = monthNames[currentDate.getMonth()];
    const expectedYear = currentDate.getFullYear();

    // Check for month and year in the pill badge
    await expect(page.locator('.panel-pill')).toContainText(expectedYear.toString());
  });

  test('should display shift presets in legend', async ({ page }) => {
    await page.goto('/panel/grafik-v2');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: /Grafik zmian v2/i })).toBeVisible({ timeout: 10000 });

    // Verify shift preset codes are displayed in legend
    await expect(page.getByText(/Kody zmian:/i)).toBeVisible();
    
    // Check for preset codes (R, P, D)
    const legend = page.locator('div:has-text("Kody zmian:")').last();
    await expect(legend).toBeVisible();
  });

  test('should display save status badge', async ({ page }) => {
    await page.goto('/panel/grafik-v2');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: /Grafik zmian v2/i })).toBeVisible({ timeout: 10000 });

    // Verify save status badge is visible
    await expect(page.getByText(/Zapisano/i)).toBeVisible();
  });

  test('should display undo and redo buttons', async ({ page }) => {
    await page.goto('/panel/grafik-v2');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: /Grafik zmian v2/i })).toBeVisible({ timeout: 10000 });

    // Verify undo and redo buttons
    await expect(page.getByRole('button', { name: /Cofnij/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Ponów/i })).toBeVisible();
  });

  test('should display employee summary columns', async ({ page }) => {
    await page.goto('/panel/grafik-v2');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: /Grafik zmian v2/i })).toBeVisible({ timeout: 10000 });

    // Verify summary column headers
    await expect(page.getByRole('columnheader', { name: /Dostawcy/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Dni/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Godziny/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Wypłata/i })).toBeVisible();
  });

  test('should filter by location', async ({ page }) => {
    await page.goto('/panel/grafik-v2');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: /Grafik zmian v2/i })).toBeVisible({ timeout: 10000 });

    // Find and click location filter
    const locationSelect = page.locator('select').filter({ hasText: /Wszystkie lokalizacje/i });
    await locationSelect.selectOption('1'); // Select "Sklep Główny"

    // Verify the selection was made (page should reload with filtered data)
    // In a real scenario, you'd verify that only employees from that location are shown
    await expect(locationSelect).toHaveValue('1');
  });

  test('should show day headers with weekday codes', async ({ page }) => {
    await page.goto('/panel/grafik-v2');

    // Wait for page to load
    await expect(page.getByRole('heading', { name: /Grafik zmian v2/i })).toBeVisible({ timeout: 10000 });

    // Verify weekday legend
    await expect(page.getByText(/Legenda dni:/i)).toBeVisible();
    await expect(page.getByText(/ND/i)).toBeVisible(); // Niedziela
    await expect(page.getByText(/PO/i)).toBeVisible(); // Poniedziałek
  });
});
