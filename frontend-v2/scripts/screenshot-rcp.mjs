#!/usr/bin/env node

/**
 * Screenshot script for RCP feature
 * Captures screenshots of /panel/rcp and /m/rcp pages
 */

import playwright from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, '..', 'artifacts');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function takeScreenshots() {
  const browser = await playwright.chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  // Mock authentication - must have RCP_EDIT permission
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'test-user',
        email: 'manager@test.com',
        name: 'Jan Kowalski',
        role: 'MANAGER',
        organisationId: 'test-org',
        organisation: {
          id: 'test-org',
          name: 'Firma Testowa'
        },
        permissions: ['RCP_EDIT', 'SCHEDULE_VIEW', 'SCHEDULE_MANAGE'],
      }),
    });
  });

  // Mock organisation locations
  await page.route('**/api/organisation/locations**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'loc-1',
            name: 'Sklep Główny - Warszawa Centrum',
            address: 'ul. Marszałkowska 10, 00-000 Warszawa',
            addressStreet: 'ul. Marszałkowska 10',
            addressPostalCode: '00-000',
            addressCity: 'Warszawa',
            addressCountry: 'Polska',
            geoLat: 52.2297,
            geoLng: 21.0122,
            geoRadiusMeters: 100,
            rcpEnabled: true,
            rcpAccuracyMaxMeters: 100,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]),
      });
      return;
    }

    if (route.request().method() === 'PATCH') {
      const payload = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'loc-1',
          name: 'Sklep Główny - Warszawa Centrum',
          address: 'ul. Marszałkowska 10, 00-000 Warszawa',
          addressStreet: 'ul. Marszałkowska 10',
          addressPostalCode: '00-000',
          addressCity: 'Warszawa',
          addressCountry: 'Polska',
          geoLat: payload.geoLat ?? 52.2297,
          geoLng: payload.geoLng ?? 21.0122,
          geoRadiusMeters: payload.geoRadiusMeters ?? 100,
          rcpEnabled: payload.rcpEnabled ?? true,
          rcpAccuracyMaxMeters: payload.rcpAccuracyMaxMeters ?? 100,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });
      return;
    }

    await route.continue();
  });

  // Mock QR generation
  await page.route('**/api/rcp/qr/generate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        qrUrl: 'http://localhost:3000/m/rcp?token=eyJvcmdJZCI6InRlc3Qtb3JnIiwibG9jYXRpb25JZCI6ImxvYy0xIn0',
        tokenExpiresAt: new Date(Date.now() + 3600000).toISOString(),
      }),
    });
  });

  // Mock organisation members
  await page.route('**/api/organisation/members', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'emp-1',
          firstName: 'Agnieszka',
          lastName: 'Nowak',
          email: 'agnieszka.nowak@test.com',
          role: 'EMPLOYEE',
          status: 'ACTIVE',
        },
      ]),
    });
  });

  // Mock RCP events
  await page.route('**/api/rcp/events**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            id: 'event-1',
            type: 'CLOCK_IN',
            happenedAt: new Date(Date.now() - 3600000).toISOString(),
            locationId: 'loc-1',
            locationName: 'Sklep Główny - Warszawa Centrum',
            distanceMeters: 42,
            accuracyMeters: 20,
            clientLat: 52.2297,
            clientLng: 21.0122,
            user: {
              id: 'emp-1',
              firstName: 'Agnieszka',
              lastName: 'Nowak',
              email: 'agnieszka.nowak@test.com',
            },
          },
        ],
        total: 1,
        skip: 0,
        take: 25,
      }),
    });
  });

  // Mock RCP status
  await page.route('**/api/rcp/status**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        lastEvent: {
          type: 'CLOCK_IN',
          happenedAt: new Date(Date.now() - 3600000).toISOString(),
          locationName: 'Sklep Główny - Warszawa Centrum',
        },
        isClockedIn: true,
      }),
    });
  });

  // Screenshot 1: Panel RCP page
  console.log('📸 Capturing /panel/rcp screenshot...');
  await page.goto(`${BASE_URL}/panel/rcp`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Wait for any animations

  const panelScreenshotPath = path.join(OUTPUT_DIR, 'panel-rcp.png');
  await page.screenshot({
    path: panelScreenshotPath,
    fullPage: true,
  });
  console.log(`✅ Saved: ${panelScreenshotPath}`);

  // Try to generate QR code for better screenshot
  try {
    const qrButton = page.locator('button:has-text("Wygeneruj kod QR")');
    await qrButton.click({ timeout: 5000 });
    await page.waitForTimeout(2000); // Wait for QR generation

    const panelWithQrPath = path.join(OUTPUT_DIR, 'panel-rcp-with-qr.png');
    await page.screenshot({
      path: panelWithQrPath,
      fullPage: true,
    });
    console.log(`✅ Saved: ${panelWithQrPath}`);
  } catch {
    console.log('⚠️  Could not generate QR (button might be disabled)');
  }

  // Screenshot 2: Mobile RCP page
  console.log('📸 Capturing /m/rcp screenshot...');
  
  // Mock RCP status
  await page.route('**/api/rcp/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        lastEvent: null,
        isClockedIn: false,
      }),
    });
  });

  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 812 }); // iPhone X

  await page.goto(`${BASE_URL}/m/rcp?token=test-token-12345`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  const mobileScreenshotPath = path.join(OUTPUT_DIR, 'm-rcp.png');
  await page.screenshot({
    path: mobileScreenshotPath,
    fullPage: true,
  });
  console.log(`✅ Saved: ${mobileScreenshotPath}`);

  await browser.close();

  console.log('\n✨ Screenshots captured successfully!');
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
  console.log('Files created:');
  console.log('  - panel-rcp.png (panel settings view)');
  console.log('  - panel-rcp-with-qr.png (panel with generated QR)');
  console.log('  - m-rcp.png (mobile clock-in page)');
}

takeScreenshots().catch((error) => {
  console.error('❌ Error taking screenshots:', error);
  process.exit(1);
});
