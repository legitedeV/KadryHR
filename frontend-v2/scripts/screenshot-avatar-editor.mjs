#!/usr/bin/env node

import playwright from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'artifacts', 'build-screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const avatarBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==',
  'base64',
);

async function waitForServer() {
  const timeoutMs = 60000;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE_URL}/panel/profil`);
      if (res.ok) return;
    } catch {
      // ignore
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error('Server did not start in time');
}

async function takeScreenshot() {
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'user-1',
        email: 'user@test.com',
        role: 'MANAGER',
        organisationId: 'org-1',
        organisation: { id: 'org-1', name: 'Firma Testowa' },
      }),
    });
  });

  await page.route('**/api/users/profile', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'user-1',
        email: 'user@test.com',
        role: 'MANAGER',
        firstName: 'Jan',
        lastName: 'Kowalski',
        avatarUrl: null,
        avatarUpdatedAt: null,
        organisationId: 'org-1',
        createdAt: new Date().toISOString(),
        organisation: { id: 'org-1', name: 'Firma Testowa' },
      }),
    });
  });

  await page.goto(`${BASE_URL}/panel/profil`);
  await page.getByRole('button', { name: 'Edytuj' }).click();

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: 'avatar.png',
    mimeType: 'image/png',
    buffer: avatarBuffer,
  });

  await page.getByText('Edytuj zdjęcie').waitFor({ state: 'visible' });

  const screenshotPath = path.join(OUTPUT_DIR, 'avatar-editor.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`✅ Saved: ${screenshotPath}`);

  await browser.close();
}

async function main() {
  const server = spawn('npm', ['run', 'start'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: '3000' },
    stdio: 'inherit',
  });

  try {
    await waitForServer();
    await takeScreenshot();
  } finally {
    server.kill('SIGTERM');
  }
}

main().catch((error) => {
  console.error('❌ Error taking avatar editor screenshot:', error);
  process.exit(1);
});
