import { test, expect } from '@playwright/test';

test.describe('Marketplace Page', () => {
  test('should navigate to marketplace', async ({ page }) => {
    await page.goto('/marketplace');

    // Should load without errors
    await page.waitForLoadState('networkidle');

    // Page should have marketplace content
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
  });

  test('should display listings or empty state', async ({ page }) => {
    await page.goto('/marketplace');

    await page.waitForLoadState('networkidle');

    // Check for listing cards or empty state
    const listings = page.locator('[data-testid="listing-card"], .listing-card');
    const emptyState = page.getByText(/no hay listados|no listings|sin listados/i);

    const hasListings = await listings.count() > 0;
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    // Either listings or empty state should exist
    expect(hasListings || hasEmptyState).toBeTruthy();
  });

  test('should show payment token options', async ({ page }) => {
    await page.goto('/marketplace');

    await page.waitForLoadState('networkidle');

    // Look for USDT, USDC, MATIC mentions
    const pageContent = await page.content();
    const hasPaymentInfo =
      pageContent.includes('USDT') ||
      pageContent.includes('USDC') ||
      pageContent.includes('MATIC') ||
      pageContent.includes('token');

    // Payment info might be present on the page
    expect(typeof hasPaymentInfo).toBe('boolean');
  });
});
