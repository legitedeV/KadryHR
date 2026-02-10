import { test, expect } from '@playwright/test';

test('RCP full enterprise flow: clock in/out, correction request and manager approval', async ({ browser }) => {
  const now = new Date();
  const location = {
    id: 'loc-1',
    name: 'HQ',
    address: 'Main 1',
    geoLat: 52.2297,
    geoLng: 21.0122,
    geoRadiusMeters: 100,
    rcpEnabled: true,
    rcpAccuracyMaxMeters: 100,
  };

  let isClockedIn = false;
  const events: Array<any> = [];
  const corrections: Array<any> = [];
  const token = 'test-token';

  const employeeContext = await browser.newContext();
  await employeeContext.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: (success: (position: any) => void) => {
          success({
            coords: {
              latitude: 52.2297,
              longitude: 21.0122,
              accuracy: 10,
            },
          });
        },
      },
    });
  });

  const employeePage = await employeeContext.newPage();
  await employeePage.route('**/api/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes('/api/auth/me')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'emp-1',
          email: 'employee@test.com',
          role: 'EMPLOYEE',
          organisationId: 'org-1',
          permissions: [],
        }),
      });
    }

    if (url.includes('/api/rcp/mobile/session') && method === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          organization: { id: 'org-1', name: 'Org 1' },
          location: {
            id: location.id,
            name: location.name,
            address: location.address,
            lat: location.geoLat,
            lng: location.geoLng,
            radiusMeters: location.geoRadiusMeters,
          },
          rcpStatus: {
            isClockedIn,
            lastPunchAt: events[0]?.happenedAt ?? null,
            lastEventType: events[0]?.type ?? null,
          },
        }),
      });
    }

    if (url.includes('/api/rcp/events/me')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: events.slice(0, 10) }),
      });
    }

    if (url.includes('/api/rcp/clock') && method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      const happenedAt = new Date(now.getTime() + events.length * 1000).toISOString();
      const event = {
        id: `event-${events.length + 1}`,
        type: body.type,
        happenedAt,
        locationId: location.id,
        locationName: location.name,
        distanceMeters: 15,
      };
      events.unshift(event);
      isClockedIn = body.type === 'CLOCK_IN';
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, distanceMeters: 15, happenedAt, locationName: location.name, type: body.type }),
      });
    }

    if (url.includes('/api/rcp/corrections') && method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      corrections.unshift({
        id: `corr-${corrections.length + 1}`,
        status: 'PENDING',
        requestedBy: { firstName: 'Jan', lastName: 'Kowalski' },
        reason: body.reason,
        eventId: body.eventId,
      });
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(corrections[0]) });
    }

    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
  });

  await employeePage.goto(`/m/rcp?token=${token}`);
  await employeePage.getByRole('button', { name: /Pobierz lokalizację/i }).click();
  await employeePage.getByRole('button', { name: /Wejście/i }).click();
  await expect(employeePage.getByText(/Wejście zarejestrowane|Wejście zarejestrowane pomyślnie/i)).toBeVisible();

  await employeePage.getByRole('button', { name: /Wyjście/i }).click();
  await expect(employeePage.getByText(/Wyjście zarejestrowane|Wyjście zarejestrowane pomyślnie/i)).toBeVisible();

  await employeePage.selectOption('select', { index: 1 });
  await employeePage.getByPlaceholder('Powód korekty').fill('Pomyłka przy skanowaniu');
  await employeePage.getByRole('button', { name: /Wyślij korektę/i }).click();
  await expect(employeePage.getByText(/Wysłano wniosek o korektę/i)).toBeVisible();

  const managerContext = await browser.newContext();
  const managerPage = await managerContext.newPage();

  await managerPage.route('**/api/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes('/api/auth/me')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'mgr-1',
          email: 'manager@test.com',
          role: 'MANAGER',
          organisationId: 'org-1',
          permissions: ['RCP_EDIT'],
        }),
      });
    }
    if (url.includes('/api/organisations/me/locations')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([location]) });
    }
    if (url.includes('/api/organisations/me/members')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'emp-1', firstName: 'Jan', lastName: 'Kowalski', email: 'employee@test.com', role: 'EMPLOYEE', status: 'ACTIVE' },
        ]),
      });
    }
    if (url.includes('/api/rcp/events?')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: events, total: events.length, skip: 0, take: 25 }) });
    }
    if (url.includes('/api/rcp/corrections?status=PENDING')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: corrections.filter((c) => c.status === 'PENDING') }) });
    }
    if (url.includes('/api/rcp/workforce/active')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], activeCount: 0 }) });
    }
    if (url.includes('/api/rcp/summary/daily')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ date: now.toISOString().slice(0, 10), clockInCount: 1, clockOutCount: 1, pendingCorrections: corrections.filter((c) => c.status === 'PENDING').length }) });
    }
    if (url.includes('/api/rcp/corrections/') && url.includes('/review') && method === 'POST') {
      const id = url.split('/api/rcp/corrections/')[1].split('/review')[0];
      const target = corrections.find((c) => c.id === id);
      if (target) target.status = 'APPROVED';
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(target || {}) });
    }

    if (url.includes('/api/rcp/status')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ isClockedIn, lastEvent: events[0] ?? null }) });
    }

    if (url.includes('/api/rcp/qr/generate') && method === 'POST') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ qrUrl: `http://localhost:3000/m/rcp?token=${token}`, tokenExpiresAt: new Date(Date.now() + 3600000).toISOString() }) });
    }

    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
  });

  await managerPage.goto('/panel/rcp');
  await expect(managerPage.getByText(/Korekty oczekujące/i)).toBeVisible();
  await expect(managerPage.getByText(/Pomyłka przy skanowaniu/i)).toBeVisible();
  await managerPage.getByRole('button', { name: 'Zatwierdź' }).first().click();

  await employeePage.reload();
  await expect(employeePage.getByText(/Rejestracja czasu pracy/i)).toBeVisible();

  await employeeContext.close();
  await managerContext.close();
});
