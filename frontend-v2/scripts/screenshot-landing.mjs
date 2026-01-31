import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { mkdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd().endsWith("frontend-v2")
  ? path.resolve(process.cwd(), "..")
  : process.cwd();
const cwd = path.resolve(repoRoot, "frontend-v2");
const port = Number(process.env.LANDING_SCREENSHOT_PORT ?? 3011);
const baseUrl = `http://localhost:${port}`;
const artifactsDir = path.join(cwd, "artifacts", "build-screenshots");
const screenshotPath = path.join(artifactsDir, "landing.png");

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
      const response = await fetch(`${baseUrl}/`);
      if (response.ok) return;
    } catch {
      // ignore
    }
    await delay(500);
  }
  throw new Error("Server did not start in time.");
}

async function run() {
  const server = startServer();

  try {
    await waitForServer();

    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

    await page.goto(baseUrl, { waitUntil: "networkidle" });
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
