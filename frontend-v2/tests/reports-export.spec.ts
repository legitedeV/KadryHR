import { expect, test, type Page } from "@playwright/test";

type ExportEntry = {
  id: string;
  reportType: "work-time" | "absences";
  format: "csv" | "xlsx";
  rowCount: number;
  filters: Record<string, string | null>;
  createdAt: string;
  createdBy: { id: string; firstName: string; lastName: string; email: string };
};

async function setupReportsMocks(page: Page) {
  const exportsHistory: ExportEntry[] = [];

  await page.addInitScript(() => {
    window.localStorage.setItem(
      "kadryhr_auth_tokens",
      JSON.stringify({ accessToken: "test-token" }),
    );
    const onboardingState = JSON.stringify({ completed: true, skipped: false });
    window.localStorage.setItem(
      "kadryhr:onboarding:main-panel-tour:user-1",
      onboardingState,
    );
    window.localStorage.setItem(
      "kadryhr:onboarding:schedule-v2-tour:user-1",
      onboardingState,
    );
  });

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace("/api", "");
    const method = request.method();
    const json = (data: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(data),
      });

    if (path === "/auth/me" && method === "GET") {
      return json({
        id: "user-1",
        email: "manager@test.com",
        role: "MANAGER",
        firstName: "Marta",
        lastName: "Manager",
        organisation: { id: "org-1", name: "Org" },
        permissions: ["SCHEDULE_VIEW", "SCHEDULE_MANAGE", "REPORTS_EXPORT"],
      });
    }

    if (path === "/org/members" && method === "GET") {
      return json([
        {
          id: "emp-1",
          firstName: "Ewa",
          lastName: "Nowak",
          email: "ewa@example.com",
          role: "EMPLOYEE",
          status: "ACTIVE",
        },
      ]);
    }

    if (path === "/org/locations" && method === "GET") {
      return json([{ id: "loc-1", name: "Warszawa" }]);
    }

    if (path === "/reports/work-time" && method === "GET") {
      return json({
        total: 1,
        items: [
          {
            employeeId: "emp-1",
            employeeName: "Ewa Nowak",
            locationId: "loc-1",
            locationName: "Warszawa",
            date: "2026-01-10",
            firstClockIn: "2026-01-10T08:00:00.000Z",
            lastClockOut: "2026-01-10T16:00:00.000Z",
            totalHours: 8,
            entries: 2,
          },
        ],
      });
    }

    if (path === "/reports/absences" && method === "GET") {
      return json({ total: 1, items: [{ id: "leave-1" }] });
    }

    if (path === "/reports/exports/recent" && method === "GET") {
      return json(exportsHistory);
    }

    if (path === "/reports/work-time/export" && method === "GET") {
      exportsHistory.unshift({
        id: `exp-${exportsHistory.length + 1}`,
        reportType: "work-time",
        format: "csv",
        rowCount: 1,
        filters: { from: "2026-01-01", to: "2026-01-31" },
        createdAt: new Date().toISOString(),
        createdBy: {
          id: "user-1",
          firstName: "Marta",
          lastName: "Manager",
          email: "manager@test.com",
        },
      });

      return route.fulfill({
        status: 200,
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": "attachment; filename=work-time-2026-01.csv",
        },
        body: "employee,date,totalHours\nEwa Nowak,2026-01-10,8",
      });
    }

    return json({ message: "not mocked", path, method }, 404);
  });
}

test("manager exports CSV report and sees export in download center", async ({
  page,
}) => {
  await setupReportsMocks(page);
  await page.goto("/panel/raporty");

  const exportResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/reports/work-time/export") &&
      response.request().method() === "GET",
  );

  await page.getByRole("button", { name: "Eksport CSV" }).click();

  const exportResponse = await exportResponsePromise;
  expect(exportResponse.ok()).toBeTruthy();
  expect(exportResponse.headers()["content-type"]).toContain("text/csv");
  const body = await exportResponse.text();
  expect(body.length).toBeGreaterThan(0);

  await expect(
    page.getByRole("heading", { name: /Centrum pobrań/i }),
  ).toBeVisible();
  await expect(page.getByText("Czas pracy")).toBeVisible();
  await expect(page.getByText("CSV")).toBeVisible();
});
