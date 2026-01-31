import fs from "node:fs";
import path from "node:path";
import { test } from "@playwright/test";

test("landing icons screenshot", async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto("/");
  await page.waitForSelector("text=Nasze usługi");

  const outputPath = path.resolve(process.cwd(), "..", "artifacts", "build-screenshots", "landing-icons.png");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await page.screenshot({ path: outputPath, fullPage: true });
});
