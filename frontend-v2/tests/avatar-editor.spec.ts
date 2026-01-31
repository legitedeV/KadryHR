import { test, expect } from '@playwright/test';

const avatarBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==',
  'base64',
);

test.describe('Avatar editor', () => {
  test('should open crop editor and save avatar', async ({ page }) => {
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

    await page.route('**/api/users/me/avatar', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          avatarUrl: '/static/avatars/org-1/users/user-1/avatar.jpg',
          avatarUpdatedAt: new Date().toISOString(),
          profile: {
            id: 'user-1',
            email: 'user@test.com',
            role: 'MANAGER',
            firstName: 'Jan',
            lastName: 'Kowalski',
            avatarUrl: '/static/avatars/org-1/users/user-1/avatar.jpg',
            avatarUpdatedAt: new Date().toISOString(),
            organisationId: 'org-1',
            createdAt: new Date().toISOString(),
            organisation: { id: 'org-1', name: 'Firma Testowa' },
          },
        }),
      });
    });

    await page.goto('/panel/profil');

    await page.getByRole('button', { name: 'Edytuj' }).click();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: avatarBuffer,
    });

    await expect(page.getByText('Edytuj zdjęcie')).toBeVisible();
    await expect(page.getByText('Powiększenie')).toBeVisible();

    const responsePromise = page.waitForResponse('**/api/users/me/avatar');
    await page.getByRole('button', { name: 'Zapisz' }).click();
    await responsePromise;

    await expect(page.getByText('Edytuj zdjęcie')).toBeHidden();
  });
});
