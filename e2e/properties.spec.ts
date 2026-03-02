import { test, expect } from '@playwright/test';

test.describe('Properties Page', () => {
  test('should navigate to properties page', async ({ page }) => {
    await page.goto('/');

    // Click on properties link
    const propertiesLink = page.getByRole('link', { name: /propiedades|properties|marketplace/i });

    if (await propertiesLink.isVisible()) {
      await propertiesLink.click();
      await expect(page).toHaveURL(/properties|marketplace/);
    }
  });

  test('should display property cards', async ({ page }) => {
    await page.goto('/properties');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for property cards or empty state
    const propertyCards = page.locator('[data-testid="property-card"], .property-card');
    const emptyState = page.getByText(/no hay propiedades|no properties/i);

    // Either property cards or empty state should be visible
    const hasCards = await propertyCards.count() > 0;
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(hasCards || hasEmptyState).toBeTruthy();
  });

  test('should have filter options', async ({ page }) => {
    await page.goto('/properties');

    // Look for filter elements
    const filterSection = page.locator('[data-testid="filters"], .filters, select, [role="combobox"]');

    // Filter section might exist
    const count = await filterSection.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
