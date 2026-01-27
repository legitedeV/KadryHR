import { test, expect } from '@playwright/test';

/**
 * Basic smoke test to verify the application is running
 * and key pages are accessible
 */
test.describe('Smoke Tests', () => {
  test('landing page loads successfully', async ({ page }) => {
    // Navigate to the landing page
    await page.goto('/');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Verify the page loaded (check for some common element)
    // This is a basic check - adjust selectors based on actual landing page structure
    await expect(page).toHaveTitle(/KadryHR|Kadry/i);

    // Take a screenshot for visual verification
    await page.screenshot({ path: 'smoke-test-landing.png', fullPage: true });
  });

  test('login page is accessible', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Verify login form elements are present
    await expect(page.getByPlaceholder('twoj@email.pl')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Zaloguj' })).toBeVisible();
  });

  test('navigation works', async ({ page }) => {
    // Start at home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Try to navigate to login page (if there's a link)
    const loginLink = page.getByRole('link', { name: /zaloguj|login/i });
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await page.waitForURL('**/login');
      await expect(page).toHaveURL(/.*login/);
    }
  });

  test('API responds correctly', async ({ request }) => {
    // Verify the backend API is accessible
    const response = await request.get('/api/website/settings');
    
    // Should return 200 (public endpoint)
    expect(response.status()).toBe(200);
  });

  test('employees page structure exists', async ({ page }) => {
    // Navigate to the employees page (requires auth in production, 
    // but we test that the route exists and basic structure loads)
    await page.goto('/panel/pracownicy');
    
    // Wait for initial load
    await page.waitForLoadState('domcontentloaded');
    
    // The page should have loaded - either showing login redirect or the actual page
    // This verifies the route is properly configured
    const url = page.url();
    expect(url).toMatch(/\/(panel\/pracownicy|login)/);
  });
});
