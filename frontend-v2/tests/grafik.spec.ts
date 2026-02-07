import { test, expect, type Page } from '@playwright/test';
import type { EmployeeRecord, LocationRecord, ScheduleShiftRecord } from '../lib/api';

type GrafikMockState = {
  getEmployees: () => EmployeeRecord[];
  getShifts: () => ScheduleShiftRecord[];
  getBulkDeleteCalls: () => number;
  getOrderUpdates: () => number;
};

type GrafikMockOptions = {
  role: 'MANAGER' | 'EMPLOYEE';
  permissions?: string[];
  employees: EmployeeRecord[];
  shifts: ScheduleShiftRecord[];
  location: LocationRecord;
  editModeTimeoutMs?: number;
};

const nowIso = () => new Date().toISOString();

const startOfWeek = (date: Date) => {
  const copy = new Date(date);
  const day = copy.getDay() || 7;
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - (day - 1));
  return copy;
};

const formatDateKey = (date: Date) => date.toLocaleDateString('sv-SE');

const buildEmployee = (id: string, firstName: string, lastName: string, locationId: string): EmployeeRecord => ({
  id,
  firstName,
  lastName,
  email: `${firstName.toLowerCase()}@example.com`,
  locations: [{ id: locationId, name: 'Warszawa' }],
  isActive: true,
  isDeleted: false,
  createdAt: nowIso(),
  updatedAt: nowIso(),
});

const buildShift = (
  id: string,
  employeeId: string,
  locationId: string,
  weekStart: Date,
  dayOffset: number,
): ScheduleShiftRecord => {
  const day = new Date(weekStart);
  day.setDate(day.getDate() + dayOffset);
  const start = new Date(day);
  start.setHours(8, 0, 0, 0);
  const end = new Date(day);
  end.setHours(16, 0, 0, 0);
  return {
    id,
    employeeId,
    locationId,
    position: 'Kasjer',
    note: 'Zmiana',
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
  };
};

const setupGrafikMocks = async (page: Page, options: GrafikMockOptions): Promise<GrafikMockState> => {
  const weekStart = startOfWeek(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  let employeesState = [...options.employees];
  let shiftsState = [...options.shifts];
  let bulkDeleteCalls = 0;
  let orderUpdates = 0;

  const timeoutOverride = options.editModeTimeoutMs;

  await page.addInitScript((timeout) => {
    window.localStorage.setItem(
      'kadryhr_auth_tokens',
      JSON.stringify({ accessToken: 'test-token' }),
    );
    const onboardingState = JSON.stringify({ completed: true, skipped: false });
    window.localStorage.setItem(
      'kadryhr:onboarding:main-panel-tour:user-1',
      onboardingState,
    );
    window.localStorage.setItem(
      'kadryhr:onboarding:schedule-v2-tour:user-1',
      onboardingState,
    );
    if (typeof timeout === 'number') {
      (window as Window & { __scheduleEditModeTimeoutMs?: number }).__scheduleEditModeTimeoutMs = timeout;
    }
  }, timeoutOverride);

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api', '');
    const method = request.method();

    const fulfillJson = (data: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(data),
      });

    if (path === '/auth/me' && method === 'GET') {
      return fulfillJson({
        id: 'user-1',
        email: options.role === 'MANAGER' ? 'manager@test.com' : 'employee@test.com',
        role: options.role,
        firstName: options.role === 'MANAGER' ? 'Marta' : 'Ewa',
        lastName: options.role === 'MANAGER' ? 'Manager' : 'Employee',
        organisation: { id: 'org-1', name: 'Test Org' },
        permissions:
          options.permissions ??
          (options.role === 'MANAGER' ? ['SCHEDULE_VIEW', 'SCHEDULE_MANAGE'] : ['SCHEDULE_VIEW']),
      });
    }

    if (path === '/org/employees' && method === 'GET') {
      return fulfillJson({
        data: employeesState,
        total: employeesState.length,
      });
    }

    if (path === '/employees' && method === 'GET') {
      return fulfillJson({
        data: employeesState,
        total: employeesState.length,
        skip: 0,
        take: 200,
      });
    }

    if (path === '/org/employees/order' && method === 'PUT') {
      orderUpdates += 1;
      const payload = request.postDataJSON() as { orderedEmployeeIds?: string[] } | null;
      const orderedIds = payload?.orderedEmployeeIds ?? [];
      if (orderedIds.length > 0) {
        const nextEmployees = orderedIds
          .map((id) => employeesState.find((employee) => employee.id === id))
          .filter((employee): employee is EmployeeRecord => Boolean(employee));
        if (nextEmployees.length === employeesState.length) {
          employeesState = nextEmployees;
        }
      }
      return fulfillJson({ success: true, updatedCount: employeesState.length, requestId: 'req-1' });
    }

    if (path === '/locations' && method === 'GET') {
      return fulfillJson([options.location]);
    }

    if (path === '/availability' && method === 'GET') {
      return fulfillJson([]);
    }

    if (path === '/leave-requests/approved' && method === 'GET') {
      return fulfillJson([]);
    }

    if (path === '/schedule' && method === 'GET') {
      return fulfillJson(shiftsState);
    }

    if (path === '/schedule/summary' && method === 'GET') {
      return fulfillJson({
        range: {
          from: formatDateKey(weekStart),
          to: formatDateKey(weekEnd),
        },
        totals: {
          hours: 24,
          cost: 300,
          currency: 'PLN',
          shiftsCount: shiftsState.length,
          shiftsWithoutRate: 0,
          employeesWithoutRate: 0,
        },
        byDay: [
          {
            date: formatDateKey(weekStart),
            hours: 24,
            cost: 300,
          },
        ],
      });
    }

    if (path === '/schedule/shifts/bulk' && method === 'POST') {
      const payload = request.postDataJSON() as {
        shifts?: Array<{
          employeeId: string;
          locationId?: string | null;
          position?: string | null;
          note?: string | null;
          startAt?: string;
          endAt?: string;
          startsAt?: string;
          endsAt?: string;
        }>;
      } | null;
      const created =
        payload?.shifts?.map((shift, index) => ({
          id: `shift-bulk-${Date.now()}-${index}`,
          employeeId: shift.employeeId,
          locationId: shift.locationId ?? options.location.id,
          position: shift.position ?? null,
          note: shift.note ?? null,
          startsAt: shift.startAt ?? shift.startsAt ?? nowIso(),
          endsAt: shift.endAt ?? shift.endsAt ?? nowIso(),
          status: 'DRAFT',
        })) ?? [];
      shiftsState = [...shiftsState, ...created];
      return fulfillJson(created);
    }

    if (path === '/schedule/shifts/bulk' && method === 'DELETE') {
      bulkDeleteCalls += 1;
      const payload = request.postDataJSON() as { shiftIds?: string[] } | null;
      const ids = payload?.shiftIds ?? [];
      shiftsState = shiftsState.filter((shift) => !ids.includes(shift.id));
      return fulfillJson({ success: true, deletedCount: ids.length });
    }

    if (path.startsWith('/shifts/') && method === 'DELETE') {
      const shiftId = path.split('/').pop();
      shiftsState = shiftsState.filter((shift) => shift.id !== shiftId);
      return fulfillJson({ success: true });
    }

    return fulfillJson({ message: `Unhandled API: ${path}` }, 404);
  });

  return {
    getEmployees: () => employeesState,
    getShifts: () => shiftsState,
    getBulkDeleteCalls: () => bulkDeleteCalls,
    getOrderUpdates: () => orderUpdates,
  };
};

const openGrafikPage = async (page: Page) => {
  await page.goto('/panel/grafik');
  await page.waitForLoadState('domcontentloaded');
};

const selectLocationAndEnableKeyboard = async (page: Page) => {
  await page.getByRole('combobox').nth(1).selectOption('loc-1');
  const keyboardButton = page.getByRole('button', { name: /Tryb klawiatury/i });
  await expect(keyboardButton).toBeEnabled();
  await keyboardButton.click();
  await expect(keyboardButton).toContainText('◉');
};

const getRowNames = async (page: Page) =>
  page
    .locator('[data-onboarding-target="schedule-grid"] .sticky.left-0 .text-sm.font-semibold')
    .allTextContents();

const getEditModePill = (page: Page) => page.getByTestId('grafik-edit-mode-badge');

const focusGrafikGrid = async (page: Page) => {
  const gridRoot = page.getByTestId('grafik-grid-root');
  await gridRoot.click();
  await expect(gridRoot).toBeFocused();
  await expect(page.getByTestId('grafik-selected-cell')).toBeVisible();
};

const dragRowHandle = async (
  page: Page,
  sourceSelector: string,
  targetSelector: string,
  employeeId: string,
) => {
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  await dataTransfer.evaluate((transfer, id) => {
    transfer.setData('application/x-employee-row', id);
    transfer.setData('text/plain', id);
    transfer.effectAllowed = 'move';
  }, employeeId);

  const source = page.locator(sourceSelector);
  const target = page.locator(targetSelector);
  const targetRow = target.locator(
    'xpath=ancestor::div[contains(@class,"relative") and contains(@class,"grid")]',
  );

  await source.dispatchEvent('dragstart', { dataTransfer });
  await targetRow.dispatchEvent('dragenter', { dataTransfer });
  await targetRow.dispatchEvent('dragover', { dataTransfer });
  await targetRow.dispatchEvent('drop', { dataTransfer });
  await source.dispatchEvent('dragend', { dataTransfer });
};

const baseLocation: LocationRecord = {
  id: 'loc-1',
  name: 'Warszawa',
  address: 'Test Address',
  employees: [],
  createdAt: nowIso(),
  updatedAt: nowIso(),
};

const buildBaseEmployees = () => [
  buildEmployee('emp-1', 'Anna', 'Nowak', baseLocation.id),
  buildEmployee('emp-2', 'Bartosz', 'Kowal', baseLocation.id),
  buildEmployee('emp-3', 'Celina', 'Zalewska', baseLocation.id),
];

test.describe('Grafik (manager)', () => {
  test('Grafik loads (manager)', async ({ page }) => {
    const weekStart = startOfWeek(new Date());
    const employees = buildBaseEmployees();
    const shifts = [buildShift('shift-1', employees[0].id, baseLocation.id, weekStart, 0)];

    await setupGrafikMocks(page, {
      role: 'MANAGER',
      employees,
      shifts,
      location: baseLocation,
      editModeTimeoutMs: 2000,
    });

    await openGrafikPage(page);

    await expect(page.getByRole('heading', { name: 'Grafik pracy' })).toBeVisible();
    await expect(page.locator('[data-onboarding-target="schedule-grid"]')).toBeVisible();
  });

  test('Grid focus and arrow navigation updates selection', async ({ page }) => {
    const employees = buildBaseEmployees();
    const shifts: ScheduleShiftRecord[] = [];

    await setupGrafikMocks(page, {
      role: 'MANAGER',
      employees,
      shifts,
      location: baseLocation,
    });

    await openGrafikPage(page);
    await selectLocationAndEnableKeyboard(page);
    await focusGrafikGrid(page);

    const gridRoot = page.getByTestId('grafik-grid-root');
    await expect(gridRoot).toHaveAttribute('aria-activedescendant', 'grafik-cell-r0-c0');

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');

    await expect(gridRoot).toHaveAttribute('aria-activedescendant', 'grafik-cell-r1-c2');
  });

  test('Hold-to-edit respects press duration', async ({ page }) => {
    const weekStart = startOfWeek(new Date());
    const employees = buildBaseEmployees();
    const shifts = [buildShift('shift-1', employees[0].id, baseLocation.id, weekStart, 0)];

    await setupGrafikMocks(page, {
      role: 'MANAGER',
      employees,
      shifts,
      location: baseLocation,
      editModeTimeoutMs: 15000,
    });

    await openGrafikPage(page);

    await selectLocationAndEnableKeyboard(page);
    await focusGrafikGrid(page);

    await expect(page.getByRole('button', { name: /Tryb edycji: Wyłączony/i })).toBeVisible();
    await page.keyboard.press('E', { delay: 100 });
    await expect(getEditModePill(page)).toHaveCount(0);

    await page.keyboard.down('E');
    await page.waitForTimeout(1100);
    await page.keyboard.up('E');

    await expect(getEditModePill(page)).toBeVisible();
  });

  test('Clipboard hotkeys copy/paste and undo/redo', async ({ page }) => {
    const weekStart = startOfWeek(new Date());
    const employees = buildBaseEmployees();
    const shifts = [buildShift('shift-1', employees[0].id, baseLocation.id, weekStart, 0)];

    await setupGrafikMocks(page, {
      role: 'MANAGER',
      employees,
      shifts,
      location: baseLocation,
      editModeTimeoutMs: 15000,
    });

    await openGrafikPage(page);
    await selectLocationAndEnableKeyboard(page);
    await focusGrafikGrid(page);

    await page.getByRole('button', { name: /Tryb edycji/i }).click();
    await expect(getEditModePill(page)).toBeVisible();

    const modKey = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modKey}+C`);
    await expect(page.getByRole('status').getByText('Skopiowano zaznaczone')).toBeVisible();

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press(`${modKey}+V`);
    await expect(page.getByRole('status').getByText('Wklejono zmiany')).toBeVisible();
    await expect(page.getByRole('button', { name: /08:00/ })).toHaveCount(2);

    await page.keyboard.press(`${modKey}+Z`);
    await expect(page.getByRole('button', { name: /08:00/ })).toHaveCount(1);

    await page.keyboard.press(`${modKey}+Shift+Z`);
    await expect(page.getByRole('button', { name: /08:00/ })).toHaveCount(2);
  });

  test('Auto-timeout disables edit mode and shows toast', async ({ page }) => {
    const weekStart = startOfWeek(new Date());
    const employees = buildBaseEmployees();
    const shifts = [buildShift('shift-1', employees[0].id, baseLocation.id, weekStart, 0)];

    await setupGrafikMocks(page, {
      role: 'MANAGER',
      employees,
      shifts,
      location: baseLocation,
      editModeTimeoutMs: 2000,
    });

    await openGrafikPage(page);

    await page.getByRole('button', { name: /Tryb edycji/i }).click();
    await expect(getEditModePill(page)).toBeVisible();

    await expect(
      page.getByRole('status').getByText('Tryb edycji wyłączony (brak aktywności)'),
    ).toBeVisible({ timeout: 7000 });
    await expect(getEditModePill(page)).toHaveCount(0);
  });

  test('Delete gating and confirm-once-per-session', async ({ page }) => {
    const weekStart = startOfWeek(new Date());
    const employees = buildBaseEmployees();
    const shifts = [
      buildShift('shift-1', employees[0].id, baseLocation.id, weekStart, 0),
      buildShift('shift-2', employees[1].id, baseLocation.id, weekStart, 0),
      buildShift('shift-3', employees[2].id, baseLocation.id, weekStart, 0),
    ];

    const state = await setupGrafikMocks(page, {
      role: 'MANAGER',
      employees,
      shifts,
      location: baseLocation,
    });

    await openGrafikPage(page);
    await selectLocationAndEnableKeyboard(page);
    await focusGrafikGrid(page);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');

    await expect(page.getByRole('button', { name: /Tryb edycji: Wyłączony/i })).toBeVisible();
    await page.keyboard.press('Delete');
    await expect(
      page.getByRole('status').getByText('Włącz tryb edycji, aby usuwać zmiany'),
    ).toBeVisible();
    expect(state.getBulkDeleteCalls()).toBe(0);

    await page.getByRole('button', { name: /Tryb edycji/i }).click();
    await expect(getEditModePill(page)).toBeVisible();

    await page.keyboard.press('Delete');
    await expect(page.getByText('Usuń zaznaczone zmiany')).toBeVisible();
    await page.getByLabel('Nie pokazuj ponownie w tej sesji').check();
    await page.getByRole('button', { name: 'Usuń zmiany' }).click();

    await expect(page.getByRole('button', { name: /08:00/ })).toHaveCount(2);

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Delete');
    await expect(page.getByText('Usuń zaznaczone zmiany')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /08:00/ })).toHaveCount(1);

    await page.reload();
    await openGrafikPage(page);
    await selectLocationAndEnableKeyboard(page);
    await focusGrafikGrid(page);
    await page.getByRole('button', { name: /Tryb edycji/i }).click();

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Delete');

    await expect(page.getByText('Usuń zaznaczone zmiany')).toBeVisible();
  });

  test('Row reorder via drag handle persists', async ({ page }) => {
    const weekStart = startOfWeek(new Date());
    const employees = buildBaseEmployees();
    const shifts = [buildShift('shift-1', employees[0].id, baseLocation.id, weekStart, 0)];

    await setupGrafikMocks(page, {
      role: 'MANAGER',
      employees,
      shifts,
      location: baseLocation,
      editModeTimeoutMs: 15000,
    });

    await openGrafikPage(page);

    await page.getByRole('button', { name: /Tryb edycji/i }).click();
    await page.getByRole('combobox').nth(4).selectOption('custom');
    await expect(page.getByRole('button', { name: 'Przenieś Anna Nowak' })).toBeVisible();

    const initialOrder = await getRowNames(page);
    expect(initialOrder.slice(0, 2)).toEqual(['Anna Nowak', 'Bartosz Kowal']);

    await dragRowHandle(
      page,
      'button[aria-label="Przenieś Anna Nowak"]',
      'button[aria-label="Przenieś Bartosz Kowal"]',
      employees[0].id,
    );
    await page.waitForTimeout(150);

    await expect.poll(async () => (await getRowNames(page)).slice(0, 2)).toEqual([
      'Bartosz Kowal',
      'Anna Nowak',
    ]);

    await page.reload();
    await openGrafikPage(page);
    await page.getByRole('button', { name: /Tryb edycji/i }).click();

    await expect.poll(async () => (await getRowNames(page)).slice(0, 2)).toEqual([
      'Bartosz Kowal',
      'Anna Nowak',
    ]);
  });

  test('Row reorder via context actions persists', async ({ page }) => {
    const weekStart = startOfWeek(new Date());
    const employees = buildBaseEmployees();
    const shifts = [buildShift('shift-1', employees[0].id, baseLocation.id, weekStart, 0)];

    await setupGrafikMocks(page, {
      role: 'MANAGER',
      employees,
      shifts,
      location: baseLocation,
    });

    await openGrafikPage(page);

    await page.getByRole('button', { name: /Tryb edycji/i }).click();
    await page.getByRole('combobox').nth(4).selectOption('custom');
    await expect(page.getByRole('button', { name: 'Przenieś Bartosz Kowal' })).toBeVisible();

    await page
      .getByRole('button', { name: 'Przenieś Bartosz Kowal' })
      .dispatchEvent('contextmenu');
    const moveUpItem = page.getByRole('menuitem', { name: 'Przenieś w górę' });
    await expect(moveUpItem).toBeVisible();
    await moveUpItem.scrollIntoViewIfNeeded();
    await moveUpItem.evaluate((element) => (element as HTMLElement).click());

    await expect.poll(async () => (await getRowNames(page)).slice(0, 2)).toEqual([
      'Bartosz Kowal',
      'Anna Nowak',
    ]);

    await page.reload();
    await openGrafikPage(page);
    await page.getByRole('button', { name: /Tryb edycji/i }).click();

    await expect.poll(async () => (await getRowNames(page)).slice(0, 2)).toEqual([
      'Bartosz Kowal',
      'Anna Nowak',
    ]);
  });
});

test.describe('Grafik (employee)', () => {
  test('RBAC disables edit mode and ordering', async ({ page }) => {
    const weekStart = startOfWeek(new Date());
    const employees = buildBaseEmployees();
    const shifts = [buildShift('shift-1', employees[0].id, baseLocation.id, weekStart, 0)];

    const state = await setupGrafikMocks(page, {
      role: 'EMPLOYEE',
      employees,
      shifts,
      location: baseLocation,
    });

    await openGrafikPage(page);

    await expect(page.getByRole('button', { name: /Tryb edycji/i })).toBeDisabled();
    await expect(page.getByRole('button', { name: /Przenieś/i })).toHaveCount(0);

    await focusGrafikGrid(page);
    await page.keyboard.press('E');
    await expect(getEditModePill(page)).toHaveCount(0);
    expect(state.getOrderUpdates()).toBe(0);
  });
});
