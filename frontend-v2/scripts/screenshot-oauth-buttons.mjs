import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

const cwd = path.resolve(process.cwd(), "frontend-v2");
const port = Number(process.env.OAUTH_SCREENSHOT_PORT ?? 3011);
const baseUrl = `http://localhost:${port}`;
const artifactsDir = path.join(cwd, "artifacts", "build-screenshots");
const screenshotPath = path.join(artifactsDir, "oauth-buttons.png");

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

const server = startServer();

try {
  await waitForServer();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Kontynuuj z Google" }).waitFor();
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await browser.close();
} finally {
  server.kill("SIGTERM");
}
