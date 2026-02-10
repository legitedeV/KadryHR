import { test, expect } from '@playwright/test';

test('manager saves org settings and locations, then grafik shows holiday marker', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('kadryhr_auth_tokens', JSON.stringify({ accessToken: 'test-token' }));
    const onboardingState = JSON.stringify({ completed: true, skipped: false });
    window.localStorage.setItem('kadryhr:onboarding:main-panel-tour:user-1', onboardingState);
    window.localStorage.setItem('kadryhr:onboarding:schedule-v2-tour:user-1', onboardingState);
  });

  const org = {
    id: 'org-1',
    name: 'Test Org',
    displayName: 'Test Org',
    addressCity: 'Warszawa',
    taxId: '1234567890',
    timezone: 'Europe/Warsaw',
  };

  let scheduleSettings = {
    defaultWorkdayStart: '08:00',
    defaultWorkdayEnd: '16:00',
    defaultBreakMinutes: 30,
    dailyWorkNormHours: 8,
    weeklyWorkNormHours: 40,
    workDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    holidays: ['2026-12-25'],
    schedulePeriod: 'WEEKLY',
  };

  const locations: Array<Record<string, unknown>> = [];

  const holidayInWeek = (() => {
    const now = new Date();
    const monday = new Date(now);
    const day = monday.getDay() || 7;
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - (day - 1));
    const wednesday = new Date(monday);
    wednesday.setDate(monday.getDate() + 2);
    return wednesday.toLocaleDateString('sv-SE');
  })();

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api', '');
    const method = request.method();

    const fulfillJson = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (path === '/auth/me' && method === 'GET') {
      return fulfillJson({
        id: 'user-1',
        email: 'manager@test.com',
        role: 'ADMIN',
        firstName: 'Marta',
        lastName: 'Manager',
        organisation: { id: 'org-1', name: 'Test Org' },
        permissions: ['SCHEDULE_VIEW', 'SCHEDULE_MANAGE', 'ORGANISATION_SETTINGS'],
      });
    }

    if (path === '/organisation/me' && method === 'GET') return fulfillJson(org);
    if (path === '/organisation/me' && method === 'PATCH') {
      Object.assign(org, request.postDataJSON() as object);
      return fulfillJson(org);
    }

    if (path === '/organisation/members' && method === 'GET') {
      return fulfillJson([{ id: 'user-1', email: 'manager@test.com', role: 'ADMIN', status: 'ACTIVE' }]);
    }

    if (path === '/organisation/schedule-settings' && method === 'GET') return fulfillJson(scheduleSettings);
    if (path === '/organisation/schedule-settings' && method === 'PATCH') {
      scheduleSettings = { ...scheduleSettings, ...(request.postDataJSON() as object) };
      return fulfillJson(scheduleSettings);
    }

    if (path === '/organisation/locations' && method === 'GET') return fulfillJson(locations);
    if (path === '/organisation/locations' && method === 'POST') {
      const body = request.postDataJSON() as Record<string, unknown>;
      const created = { id: `loc-${locations.length + 1}`, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...body };
      locations.unshift(created);
      return fulfillJson(created, 201);
    }

    if (path === '/locations' && method === 'GET') return fulfillJson(locations);
    if (path === '/org/employees' && method === 'GET') return fulfillJson({ data: [], total: 0 });
    if (path === '/employees' && method === 'GET') return fulfillJson({ data: [], total: 0, skip: 0, take: 200 });
    if (path === '/availability' && method === 'GET') return fulfillJson([]);
    if (path === '/leave-requests/approved' && method === 'GET') return fulfillJson([]);

    if (path === '/schedule' && method === 'GET') {
      return fulfillJson({ period: null, shifts: [] });
    }

    if (path === '/schedule/summary' && method === 'GET') {
      return fulfillJson({ range: { from: holidayInWeek, to: holidayInWeek }, totals: { hours: 0, cost: 0, currency: 'PLN', shiftsCount: 0, shiftsWithoutRate: 0, employeesWithoutRate: 0 }, byDay: [] });
    }

    if (path === '/organisations/me/schedule-metadata' && method === 'GET') {
      return fulfillJson({ deliveryDays: [], promotionDays: [], holidays: [holidayInWeek] });
    }

    return fulfillJson({ message: `Unhandled route: ${method} ${path}` }, 404);
  });

  await page.goto('/panel/organizacja');

  await page.getByRole('button', { name: 'Grafik i czas pracy' }).click();
  await page.getByLabel('Norma dobowa (h)').fill('7');
  await page.getByLabel('Norma tygodniowa (h)').fill('35');
  await page.getByLabel('Święta (YYYY-MM-DD, po przecinku)').fill('2026-01-06, 2026-12-24');
  await page.getByRole('button', { name: 'Zapisz' }).click();

  await page.reload();
  await page.getByRole('button', { name: 'Grafik i czas pracy' }).click();
  await expect(page.getByLabel('Norma dobowa (h)')).toHaveValue('7');
  await expect(page.getByLabel('Norma tygodniowa (h)')).toHaveValue('35');
  await expect(page.getByLabel('Święta (YYYY-MM-DD, po przecinku)')).toHaveValue('2026-01-06, 2026-12-24');

  await page.getByRole('button', { name: 'Lokalizacje' }).click();
  await page.getByRole('button', { name: 'Dodaj lokalizację' }).click();
  await page.getByLabel('Nazwa').fill('Sklep Centrum');
  await page.getByRole('button', { name: 'Zapisz lokalizację' }).click();
  await expect(page.getByText('Sklep Centrum')).toBeVisible();

  await page.goto('/panel/grafik');
  await expect(page.getByText('Święto').first()).toBeVisible();
});
