import { expect, test } from "@playwright/test";

type TestRole = "OWNER" | "EMPLOYEE";

async function setupSession(page: Parameters<typeof test>[0]["page"], role: TestRole) {
  await page.addInitScript((currentRole) => {
    window.localStorage.setItem("kadryhr_auth_tokens", JSON.stringify({ accessToken: "test-token" }));
    const onboardingState = JSON.stringify({ completed: true, skipped: false });
    window.localStorage.setItem("kadryhr:onboarding:main-panel-tour:user-1", onboardingState);
    window.localStorage.setItem("test:role", currentRole);
  }, role);
}

test("owner disables and enables RCP module", async ({ page }) => {
  await setupSession(page, "OWNER");

  let modules = {
    grafik: true,
    dyspozycje: true,
    rcp: true,
    urlopy: true,
    raporty: true,
  };

  let rcpForbidden = false;

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace("/api", "");
    const method = request.method();

    const fulfillJson = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });

    if (path === "/auth/me" && method === "GET") {
      const role = (await page.evaluate(() => window.localStorage.getItem("test:role"))) as TestRole;
      return fulfillJson({
        id: "user-1",
        email: "owner@test.com",
        role,
        firstName: "Owner",
        lastName: "User",
        organisation: { id: "org-1", name: "Test Org" },
        permissions: role === "OWNER" ? ["ORGANISATION_SETTINGS", "RCP_EDIT", "SCHEDULE_VIEW", "REPORTS_EXPORT"] : ["SCHEDULE_VIEW"],
      });
    }

    if (path === "/organisations/me/modules" && method === "GET") {
      return fulfillJson({ modules, coreModules: ["grafik"] });
    }

    if (path === "/organisation/modules" && method === "PATCH") {
      modules = { ...modules, ...(request.postDataJSON() as object) } as typeof modules;
      rcpForbidden = modules.rcp === false;
      return fulfillJson({ modules, coreModules: ["grafik"] });
    }

    if (path === "/organisation/me" && method === "GET") return fulfillJson({ id: "org-1", name: "Test Org" });
    if (path === "/organisation/locations" && method === "GET") return fulfillJson([]);
    if (path === "/organisation/members" && method === "GET") return fulfillJson([]);
    if (path === "/organisation/schedule-settings" && method === "GET") {
      return fulfillJson({ defaultWorkdayStart: "08:00", defaultWorkdayEnd: "16:00", defaultBreakMinutes: 30, dailyWorkNormHours: 8, weeklyWorkNormHours: 40, workDays: ["MONDAY"], holidays: [], schedulePeriod: "WEEKLY" });
    }

    if (path.startsWith("/rcp")) {
      if (rcpForbidden) {
        return fulfillJson({ code: "MODULE_DISABLED", message: "Moduł jest wyłączony dla tej organizacji." }, 403);
      }
      if (path === "/rcp/status" && method === "GET") return fulfillJson({ rcpStatus: { isClocked: false }, activeSession: null, location: null });
      if (path.includes("events") || path.includes("corrections")) return fulfillJson({ data: [], total: 0 });
      return fulfillJson({});
    }

    return fulfillJson({});
  });

  await page.goto("/panel/organizacja");
  await page.getByRole("button", { name: "Moduły systemu" }).click();
  const rcpToggle = page.getByRole("checkbox").nth(2);
  await rcpToggle.click();
  await page.getByRole("button", { name: "Potwierdź" }).click();

  await expect(page.getByText("Wyłączony").nth(0)).toBeVisible();

  await page.goto("/panel/dashboard");
  await expect(page.getByRole("link", { name: "RCP" })).toHaveCount(0);

  await page.goto("/panel/rcp");
  await expect(page.getByText("Moduł wyłączony przez administratora organizacji")).toBeVisible();

  await page.goto("/panel/organizacja");
  await page.getByRole("button", { name: "Moduły systemu" }).click();
  await rcpToggle.click();

  await page.goto("/panel/dashboard");
  await expect(page.getByRole("link", { name: "RCP" })).toBeVisible();
  await page.goto("/panel/rcp");
  await expect(page.getByText("Moduł wyłączony przez administratora organizacji")).toHaveCount(0);
});

test("employee cannot see module toggles and sees disabled module screen", async ({ page }) => {
  await setupSession(page, "EMPLOYEE");

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace("/api", "");
    const method = request.method();

    const fulfillJson = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });

    if (path === "/auth/me" && method === "GET") {
      return fulfillJson({
        id: "user-2",
        email: "employee@test.com",
        role: "EMPLOYEE",
        firstName: "Emp",
        lastName: "One",
        organisation: { id: "org-1", name: "Test Org" },
        permissions: ["SCHEDULE_VIEW"],
      });
    }

    if (path === "/organisations/me/modules" && method === "GET") {
      return fulfillJson({
        modules: { grafik: true, dyspozycje: true, rcp: false, urlopy: true, raporty: true },
        coreModules: ["grafik"],
      });
    }

    if (path === "/rcp/status" && method === "GET") {
      return fulfillJson({ code: "MODULE_DISABLED" }, 403);
    }

    if (path === "/organisation/me" && method === "GET") return fulfillJson({ id: "org-1", name: "Test Org" });
    if (path === "/organisation/locations" && method === "GET") return fulfillJson([]);
    if (path === "/organisation/members" && method === "GET") return fulfillJson([]);
    if (path === "/organisation/schedule-settings" && method === "GET") {
      return fulfillJson({ defaultWorkdayStart: "08:00", defaultWorkdayEnd: "16:00", defaultBreakMinutes: 30, dailyWorkNormHours: 8, weeklyWorkNormHours: 40, workDays: ["MONDAY"], holidays: [], schedulePeriod: "WEEKLY" });
    }

    return fulfillJson({});
  });

  await page.goto("/panel/organizacja");
  await expect(page.getByText("Brak uprawnień do wyświetlenia ustawień organizacji.")).toBeVisible();

  await page.goto("/panel/rcp");
  await expect(page.getByText("Moduł wyłączony przez administratora organizacji")).toBeVisible();
});
