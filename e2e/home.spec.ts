import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');

    // Should have the main heading or logo
    await expect(page).toHaveTitle(/BuidingTok|Building/i);
  });

  test('should display navigation menu', async ({ page }) => {
    await page.goto('/');

    // Check for navigation elements
    const nav = page.locator('nav, header');
    await expect(nav.first()).toBeVisible();
  });

  test('should have connect wallet button', async ({ page }) => {
    await page.goto('/');

    // Look for wallet connect button
    const connectButton = page.getByRole('button', { name: /connect|wallet|conectar/i });
    await expect(connectButton).toBeVisible();
  });
});
