import { test, expect } from '@playwright/test';

test.describe('KadryHR Phase 1 E2E', () => {
  test('complete user journey: register → login → dashboard → schedule', async ({ page }) => {
    // Set viewport to standard desktop size
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Step 1: Navigate to landing page
    await page.goto('http://kadryhr.localtest.me:5173');
    await expect(page).toHaveTitle(/KadryHR/);

    // Step 2: Go to register page
    await page.goto('http://kadryhr.localtest.me:5173/register');
    
    // Fill registration form
    const timestamp = Date.now();
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', `test${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'testpassword123');
    await page.fill('input[name="orgName"]', `Test Org ${timestamp}`);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/panel.*dashboard/);
    
    // Step 3: Verify dashboard loads with stats
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Total Employees')).toBeVisible();
    
    // Step 4: Navigate to schedule page (Grafik v2)
    await page.click('text=Grafik v2');
    await expect(page).toHaveURL(/panel.*grafik-v2/);
    
    // Step 5: Verify schedule grid loads
    await expect(page.locator('text=January')).toBeVisible();
    
    // Step 6: Check for horizontal overflow (critical requirement)
    const grafikContainer = page.locator('[data-testid="grafik-container"]');
    const hasHorizontalScroll = await grafikContainer.evaluate((el) => {
      return el.scrollWidth > el.clientWidth;
    });
    
    // Should NOT have horizontal overflow
    expect(hasHorizontalScroll).toBe(false);
    
    // Step 7: Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');
    
    // Should redirect to landing/login
    await expect(page).toHaveURL(/login|^\//);
  });

  test('existing user login flow', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Navigate to login
    await page.goto('http://panel.kadryhr.localtest.me:5173/login');
    
    // Login with seeded credentials
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('schedule page no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Login first
    await page.goto('http://panel.kadryhr.localtest.me:5173/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to schedule
    await page.goto('http://panel.kadryhr.localtest.me:5173/panel/grafik-v2');
    await page.waitForLoadState('networkidle');
    
    // Get the main content area
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
    
    // Check viewport width
    const viewportWidth = page.viewportSize()?.width || 1920;
    
    // Check content width
    const contentWidth = await mainContent.evaluate((el) => el.scrollWidth);
    
    // Content should fit within viewport (with small margin for scrollbars)
    expect(contentWidth).toBeLessThanOrEqual(viewportWidth + 50);
  });
});
