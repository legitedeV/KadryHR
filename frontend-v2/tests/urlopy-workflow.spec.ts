import { expect, test, type Page } from '@playwright/test';

const nowIso = () => new Date().toISOString();

async function setupMocks(page: Page) {
  const weekStart = new Date();
  const day = weekStart.getDay() || 7;
  weekStart.setDate(weekStart.getDate() - (day - 1));
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const employee = {
    id: 'emp-1',
    firstName: 'Ewa',
    lastName: 'Nowak',
    email: 'ewa@example.com',
    isActive: true,
    isDeleted: false,
    locations: [{ id: 'loc-1', name: 'Warszawa' }],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  type MockLeave = {
    id: string;
    employeeId: string;
    status: string;
    startDate: string;
    endDate: string;
    type: string;
    leaveType: { id: string; name: string; color: string };
    employee: typeof employee;
  };
  const leaves: MockLeave[] = [];

  await page.addInitScript(() => {
    window.localStorage.setItem('kadryhr_auth_tokens', JSON.stringify({ accessToken: 'test-token' }));
    const onboardingState = JSON.stringify({ completed: true, skipped: false });
    window.localStorage.setItem('kadryhr:onboarding:main-panel-tour:user-1', onboardingState);
    window.localStorage.setItem('kadryhr:onboarding:schedule-v2-tour:user-1', onboardingState);
  });

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
        role: 'MANAGER',
        firstName: 'Marta',
        lastName: 'Manager',
        organisation: { id: 'org-1', name: 'Org' },
        permissions: ['SCHEDULE_VIEW', 'SCHEDULE_MANAGE'],
      });
    }

    if (path === '/leave-requests' && method === 'GET') {
      const status = url.searchParams.get('status');
      const data = status ? leaves.filter((item) => item.status === status) : leaves;
      return fulfillJson({ data, total: data.length, skip: 0, take: 100 });
    }

    if (path === '/leave-requests' && method === 'POST') {
      const body = request.postDataJSON() as { startDate: string; endDate: string; type: string };
      const leave = {
        id: `leave-${leaves.length + 1}`,
        employeeId: 'emp-1',
        status: 'PENDING',
        ...body,
        leaveType: { id: 'lt-1', name: 'Urlop wypoczynkowy', color: '#E38C7A' },
        employee,
      };
      leaves.unshift(leave);
      return fulfillJson(leave, 201);
    }

    if (path.match(/^\/leave-requests\/[^/]+\/status$/) && method === 'PATCH') {
      const leaveId = path.split('/')[2];
      const body = request.postDataJSON() as { status: string };
      const leave = leaves.find((item) => item.id === leaveId);
      if (leave) leave.status = body.status;
      return fulfillJson(leave ?? { id: leaveId, status: body.status });
    }

    if (path.match(/^\/leave-requests\/[^/]+\/history$/) && method === 'GET') {
      return fulfillJson([{ id: 'h-1', action: 'leave.create', actorName: 'Marta Manager', actorEmail: 'manager@test.com', createdAt: nowIso() }]);
    }

    if (path === '/leave-requests/approved' && method === 'GET') {
      return fulfillJson(leaves.filter((item) => item.status === 'APPROVED'));
    }

    if (path === '/org/employees' && method === 'GET') {
      return fulfillJson({ data: [employee], total: 1 });
    }

    if (path === '/employees' && method === 'GET') {
      return fulfillJson({ data: [employee], total: 1, skip: 0, take: 100 });
    }

    if (path === '/locations' && method === 'GET') {
      return fulfillJson([{ id: 'loc-1', name: 'Warszawa' }]);
    }

    if (path === '/availability' && method === 'GET') {
      return fulfillJson([]);
    }

    if (path === '/schedule' && method === 'GET') {
      return fulfillJson({
        period: {
          id: 'period-1',
          status: 'DRAFT',
          from: weekStart.toISOString(),
          to: weekEnd.toISOString(),
          locationId: 'loc-1',
          version: 1,
        },
        shifts: [],
      });
    }

    if (path === '/schedule/summary' && method === 'GET') {
      return fulfillJson({
        range: { from: weekStart.toISOString().slice(0, 10), to: weekEnd.toISOString().slice(0, 10) },
        totals: { hours: 0, cost: 0, currency: 'PLN', shiftsCount: 0, shiftsWithoutRate: 0, employeesWithoutRate: 0 },
        byDay: [],
      });
    }

    if (path === '/org/employees/order' && method === 'PUT') {
      return fulfillJson({ success: true });
    }

    return fulfillJson({ message: 'not mocked', path, method }, 404);
  });
}

test('urlopy workflow: create -> approve -> grafik leave marker and shift block', async ({ page }) => {
  await setupMocks(page);

  await page.goto('/panel/urlopy');
  await page.getByRole('button', { name: 'Wyślij wniosek' }).waitFor();

  const today = new Date().toISOString().slice(0, 10);
  await page.locator('input[type="date"]').first().fill(today);
  await page.locator('input[type="date"]').nth(1).fill(today);
  await page.getByRole('button', { name: 'Wyślij wniosek' }).click();

  await page.getByRole('button', { name: 'Do akceptacji' }).click();
  await expect(page.getByText('PENDING').first()).toBeVisible();
  await page.getByRole('button', { name: 'Zatwierdź' }).first().click();
  await expect(page.getByText('APPROVED').first()).toBeVisible();

  await page.goto('/panel/grafik');
  await expect(page.getByText('Nieobecność zatwierdzona').first()).toBeVisible();

  await page.getByLabel(/Dodaj zmianę dla Ewa Nowak/).first().click();
  await expect(page.getByText('Nie można dodać zmiany dla pracownika w dniu zatwierdzonego urlopu.')).toBeVisible();
});
