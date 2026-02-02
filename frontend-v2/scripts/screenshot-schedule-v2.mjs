import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { mkdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const cwd = path.resolve(process.cwd(), "frontend-v2");
const port = Number(process.env.SCHEDULE_SCREENSHOT_PORT ?? 3010);
const baseUrl = `http://localhost:${port}`;
const artifactsDir = path.join(cwd, "artifacts");
const screenshotPath = path.join(artifactsDir, "schedule-v2.png");

mkdirSync(artifactsDir, { recursive: true });

function startServer() {
  return spawn("npm", ["run", "start", "--", "-p", String(port)], {
    cwd,
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: String(port),
      NEXT_PUBLIC_API_URL: `${baseUrl}/api`,
    },
  });
}

async function waitForServer() {
  for (let i = 0; i < 30; i += 1) {
    try {
      const response = await fetch(`${baseUrl}/login`);
      if (response.ok) return;
    } catch {
      // ignore
    }
    await delay(500);
  }
  throw new Error("Server did not start in time.");
}

function startOfWeek(date) {
  const copy = new Date(date);
  const day = copy.getDay() || 7;
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - (day - 1));
  return copy;
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function formatDateKey(date) {
  return date.toLocaleDateString("sv-SE");
}

const weekStart = startOfWeek(new Date());
const employees = [
  {
    id: "emp-1",
    firstName: "Anna",
    lastName: "Kowalska",
    avatarUrl: null,
    email: "anna@kadryhr.pl",
    phone: null,
    position: "Kasa",
    locations: [{ id: "loc-1", name: "Centrum" }],
    isActive: true,
    isDeleted: false,
    employmentEndDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "emp-2",
    firstName: "Piotr",
    lastName: "Nowak",
    avatarUrl: null,
    email: "piotr@kadryhr.pl",
    phone: null,
    position: "Magazyn",
    locations: [{ id: "loc-1", name: "Centrum" }],
    isActive: true,
    isDeleted: false,
    employmentEndDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "emp-3",
    firstName: "Marta",
    lastName: "Zielińska",
    avatarUrl: null,
    email: "marta@kadryhr.pl",
    phone: null,
    position: "Obsługa",
    locations: [{ id: "loc-2", name: "Galeria" }],
    isActive: true,
    isDeleted: false,
    employmentEndDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const locations = [
  {
    id: "loc-1",
    name: "Centrum",
    address: "ul. Nowa 12",
    employees: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "loc-2",
    name: "Galeria",
    address: "ul. Handlowa 4",
    employees: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const shifts = [
  {
    id: "shift-1",
    employeeId: "emp-1",
    locationId: "loc-1",
    position: "Kasa",
    notes: "Zmiana poranna",
    color: "#C99B64",
    startsAt: new Date(`${formatDateKey(weekStart)}T08:00:00`).toISOString(),
    endsAt: new Date(`${formatDateKey(weekStart)}T16:00:00`).toISOString(),
    location: { id: "loc-1", name: "Centrum" },
    status: "DRAFT",
  },
  {
    id: "shift-2",
    employeeId: "emp-2",
    locationId: "loc-1",
    position: "Magazyn",
    notes: "Dostawa",
    color: "#4F9F9E",
    startsAt: new Date(`${formatDateKey(addDays(weekStart, 1))}T10:00:00`).toISOString(),
    endsAt: new Date(`${formatDateKey(addDays(weekStart, 1))}T18:00:00`).toISOString(),
    location: { id: "loc-1", name: "Centrum" },
    status: "DRAFT",
  },
  {
    id: "shift-3",
    employeeId: "emp-3",
    locationId: "loc-2",
    position: "Obsługa",
    notes: "Popołudnie",
    color: "#8F78C9",
    startsAt: new Date(`${formatDateKey(addDays(weekStart, 3))}T12:00:00`).toISOString(),
    endsAt: new Date(`${formatDateKey(addDays(weekStart, 3))}T20:00:00`).toISOString(),
    location: { id: "loc-2", name: "Galeria" },
    status: "DRAFT",
  },
];

const availability = [
  {
    id: "avail-1",
    employeeId: "emp-1",
    availabilityWindowId: null,
    weekday: "MONDAY",
    startMinutes: 420,
    endMinutes: 1020,
    status: "AVAILABLE",
    notes: null,
  },
  {
    id: "avail-2",
    employeeId: "emp-2",
    availabilityWindowId: null,
    weekday: "TUESDAY",
    startMinutes: 480,
    endMinutes: 1080,
    status: "AVAILABLE",
    notes: null,
  },
  {
    id: "avail-3",
    employeeId: "emp-3",
    availabilityWindowId: null,
    weekday: "THURSDAY",
    startMinutes: 600,
    endMinutes: 1200,
    status: "AVAILABLE",
    notes: null,
  },
];

const leaves = [
  {
    id: "leave-1",
    employeeId: "emp-2",
    startDate: new Date(`${formatDateKey(addDays(weekStart, 4))}T00:00:00`).toISOString(),
    endDate: new Date(`${formatDateKey(addDays(weekStart, 4))}T23:59:59`).toISOString(),
    type: "ANNUAL",
    leaveType: { id: "lt-1", name: "Urlop wypoczynkowy", color: "#E38C7A" },
    employee: { id: "emp-2", firstName: "Piotr", lastName: "Nowak" },
  },
];

const scheduleSummary = {
  range: {
    from: formatDateKey(weekStart),
    to: formatDateKey(addDays(weekStart, 6)),
  },
  totals: {
    hours: 24,
    cost: 3120,
    currency: "PLN",
    shiftsCount: 3,
    shiftsWithoutRate: 0,
    employeesWithoutRate: 0,
  },
  byDay: [
    { date: formatDateKey(weekStart), hours: 8, cost: 960 },
    { date: formatDateKey(addDays(weekStart, 1)), hours: 8, cost: 1040 },
    { date: formatDateKey(addDays(weekStart, 3)), hours: 8, cost: 1120 },
  ],
};

const templates = [
  {
    id: "tpl-1",
    name: "Centrum - standard",
    description: "Najczęściej używany układ",
    createdAt: new Date().toISOString(),
    _count: { shifts: 6 },
  },
];

const user = {
  id: "user-1",
  email: "manager@kadryhr.pl",
  firstName: "Alicja",
  lastName: "Manager",
  role: "OWNER",
  organisation: { id: "org-1", name: "KadryHR" },
  permissions: ["SCHEDULE_MANAGE", "SCHEDULE_VIEW", "RCP_EDIT"],
};

async function run() {
  const server = startServer();
  try {
    await waitForServer();
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    await page.addInitScript(() => {
      localStorage.setItem("kadryhr_auth_tokens", JSON.stringify({ accessToken: "test-token" }));
      localStorage.setItem(
        "kadryhr:onboarding:main-panel-tour:user-1",
        JSON.stringify({ completed: true, skipped: false, lastStepIndex: 0 }),
      );
      localStorage.setItem(
        "kadryhr:onboarding:schedule-v2-tour:user-1",
        JSON.stringify({ completed: true, skipped: false, lastStepIndex: 0 }),
      );
    });

    await page.route("**/api/**", async (route) => {
      const url = new URL(route.request().url());
      const pathname = url.pathname.replace("/api", "");

      if (pathname.startsWith("/auth/me")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(user),
        });
      }

      if (pathname.startsWith("/employees")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: employees, total: employees.length, skip: 0, take: 200 }),
        });
      }

      if (pathname.startsWith("/locations")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(locations),
        });
      }

      if (pathname.startsWith("/availability")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(availability),
        });
      }

      if (pathname.startsWith("/leave-requests/approved")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(leaves),
        });
      }

      if (pathname.startsWith("/schedule-templates")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(templates),
        });
      }

      if (pathname.startsWith("/schedule/summary")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(scheduleSummary),
        });
      }

      if (pathname.startsWith("/schedule")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(shifts),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({}),
      });
    });

    await page.goto(`${baseUrl}/panel/grafik`, { waitUntil: "networkidle" });
    await page.waitForSelector('[data-onboarding-target="schedule-grid"]', { timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    await browser.close();
  } finally {
    server.kill("SIGTERM");
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
