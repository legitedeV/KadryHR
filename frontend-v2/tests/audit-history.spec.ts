import { expect, test, type Page } from '@playwright/test';

const nowIso = () => new Date().toISOString();

async function setupUrlopyAuditMocks(page: Page, role: 'MANAGER' | 'EMPLOYEE') {
  const auditRows: Array<any> = [];
  const leave = {
    id: 'leave-1',
    employeeId: 'emp-1',
    type: 'PAID_LEAVE',
    status: 'PENDING',
    startDate: '2026-02-01T00:00:00.000Z',
    endDate: '2026-02-02T00:00:00.000Z',
    employee: { id: 'emp-1', firstName: 'Jan', lastName: 'Kowalski' },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  await page.addInitScript(() => {
    window.localStorage.setItem('kadryhr_auth_tokens', JSON.stringify({ accessToken: 'test-token' }));
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
        email: role === 'MANAGER' ? 'manager@test.com' : 'employee@test.com',
        role,
        firstName: role === 'MANAGER' ? 'Marta' : 'Ewa',
        lastName: role === 'MANAGER' ? 'Manager' : 'Employee',
        organisation: { id: 'org-1', name: 'Test Org' },
        permissions: role === 'MANAGER' ? ['LEAVE_APPROVE', 'LEAVE_REQUEST'] : ['LEAVE_REQUEST'],
      });
    }

    if (path === '/leave-requests' && method === 'GET') {
      const status = url.searchParams.get('status');
      const data = status === 'PENDING' ? [leave] : [leave];
      return fulfillJson({ data, total: data.length, skip: 0, take: 100 });
    }

    if (path === '/leave-requests/leave-1/status' && method === 'PATCH') {
      const payload = request.postDataJSON() as { status: 'APPROVED' | 'REJECTED' };
      leave.status = payload.status;
      auditRows.unshift({
        id: `audit-${auditRows.length + 1}`,
        action: payload.status === 'APPROVED' ? 'leave.approve' : 'leave.reject',
        entityType: 'LeaveRequest',
        entityId: leave.id,
        actor: { id: 'user-1', firstName: 'Marta', lastName: 'Manager' },
        createdAt: nowIso(),
      });
      return fulfillJson({ ...leave });
    }

    if (path === '/audit' && method === 'GET') {
      if (role === 'EMPLOYEE') {
        return fulfillJson({ message: 'Forbidden' }, 403);
      }
      return fulfillJson({ data: auditRows, total: auditRows.length, skip: 0, take: 30 });
    }

    if (path.startsWith('/leave-requests/') && path.endsWith('/history') && method === 'GET') {
      return fulfillJson([]);
    }

    return fulfillJson({});
  });
}

test('performing leave approval shows new row in Historia zmian drawer', async ({ page }) => {
  await setupUrlopyAuditMocks(page, 'MANAGER');

  await page.goto('/panel/urlopy');
  await page.getByRole('button', { name: 'Do akceptacji' }).click();
  await page.getByRole('button', { name: 'Zatwierdź' }).first().click();
  await expect(page.getByText('Wniosek zatwierdzony')).toBeVisible();

  await page.getByRole('button', { name: 'Historia zmian' }).first().click();
  await expect(page.getByRole('heading', { name: 'Historia zmian · Urlopy' })).toBeVisible();
  await expect(page.getByText('Akceptacja urlopu')).toBeVisible();
});

test('employee cannot access audit endpoint (403)', async ({ page }) => {
  await setupUrlopyAuditMocks(page, 'EMPLOYEE');
  await page.goto('/panel/urlopy');

  const status = await page.evaluate(async () => {
    const token = JSON.parse(window.localStorage.getItem('kadryhr_auth_tokens') || '{}')?.accessToken;
    const res = await fetch('/api/audit', { headers: { Authorization: `Bearer ${token}` } });
    return res.status;
  });

  expect(status).toBe(403);
  await expect(page.getByRole('button', { name: 'Historia zmian' })).toHaveCount(0);
});
