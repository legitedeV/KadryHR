import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

const cwd = path.resolve(process.cwd(), "frontend-v2");
const port = Number(process.env.SCHEDULE_EXPORT_PORT ?? 3012);
const baseUrl = `http://localhost:${port}`;
const month = process.env.SCHEDULE_EXPORT_MONTH ?? new Date().toISOString().slice(0, 7);
const artifactsDir = path.join(cwd, "artifacts", "exports");
const pdfPath = path.join(artifactsDir, `schedule-${month}.pdf`);
const pngPath = path.join(artifactsDir, `schedule-${month}.png`);

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

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function formatDateKey(date) {
  return date.toLocaleDateString("sv-SE");
}

const [monthYear, monthIndexRaw] = month.split("-").map((value) => Number(value));
const monthIndex = Number.isNaN(monthIndexRaw) ? new Date().getMonth() : monthIndexRaw - 1;
const monthStart = new Date(monthYear, monthIndex, 1);
const monthEnd = new Date(monthYear, monthIndex + 1, 0);

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
  {
    id: "emp-4",
    firstName: "Karol",
    lastName: "Wiśniewski",
    avatarUrl: null,
    email: "karol@kadryhr.pl",
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

const shiftOffsets = [0, 6, 12, 18, 24];
const shifts = [];

employees.forEach((employee, index) => {
  shiftOffsets.forEach((offset, shiftIndex) => {
    const shiftDate = addDays(monthStart, offset + index);
    if (shiftDate > monthEnd) return;
    const startHour = 8 + (index % 3) * 2;
    shifts.push({
      id: `shift-${employee.id}-${shiftIndex}`,
      employeeId: employee.id,
      locationId: employee.locations[0]?.id ?? null,
      position: employee.position,
      notes: "Zmiana",
      color: ["#C99B64", "#4F9F9E", "#8F78C9", "#5C8DD1"][index % 4],
      startsAt: new Date(`${formatDateKey(shiftDate)}T${String(startHour).padStart(2, "0")}:00:00`).toISOString(),
      endsAt: new Date(`${formatDateKey(shiftDate)}T${String(startHour + 8).padStart(2, "0")}:00:00`).toISOString(),
      location: employee.locations[0] ? { id: employee.locations[0].id, name: employee.locations[0].name } : null,
      status: "DRAFT",
    });
  });
});

const availability = [];

const leaves = [
  {
    id: "leave-1",
    employeeId: "emp-2",
    startDate: new Date(`${formatDateKey(addDays(monthStart, 10))}T00:00:00`).toISOString(),
    endDate: new Date(`${formatDateKey(addDays(monthStart, 12))}T23:59:59`).toISOString(),
    type: "ANNUAL",
    leaveType: { id: "lt-1", name: "Urlop wypoczynkowy", color: "#E38C7A" },
    employee: { id: "emp-2", firstName: "Piotr", lastName: "Nowak" },
  },
];

async function run() {
  const server = startServer();
  try {
    await waitForServer();
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

    await page.addInitScript(() => {
      localStorage.setItem("kadryhr_auth_tokens", JSON.stringify({ accessToken: "test-token" }));
    });

    await page.route("**/api/**", async (route) => {
      const url = new URL(route.request().url());
      const pathname = url.pathname.replace("/api", "");

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

      if (pathname.startsWith("/schedule")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(shifts),
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

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({}),
      });
    });

    await page.goto(`${baseUrl}/grafik/export?month=${month}`, { waitUntil: "networkidle" });
    await page.waitForSelector('[data-export-ready="true"]', { timeout: 20000 });

    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    }));

    await page.pdf({
      path: pdfPath,
      printBackground: true,
      width: `${dimensions.width}px`,
      height: `${dimensions.height}px`,
    });

    await page.screenshot({ path: pngPath, fullPage: true });
    await browser.close();
  } finally {
    server.kill("SIGTERM");
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
