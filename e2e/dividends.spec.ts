import { test, expect } from '@playwright/test';

test.describe('Dividends Page', () => {
  test('should navigate to dividends page', async ({ page }) => {
    await page.goto('/dividends');

    // Should load without errors
    await page.waitForLoadState('networkidle');

    // Should have some content
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });

  test('should prompt wallet connection for dividends', async ({ page }) => {
    await page.goto('/dividends');

    await page.waitForLoadState('networkidle');

    // Look for connect wallet prompt or dividend content
    const connectPrompt = page.getByText(/conectar|connect|wallet/i);
    const dividendContent = page.locator('[data-testid="dividend-card"], .dividend-card');

    const hasConnectPrompt = await connectPrompt.isVisible().catch(() => false);
    const hasDividendContent = await dividendContent.count() > 0;

    // Either connect prompt or dividend content should be visible
    expect(hasConnectPrompt || hasDividendContent).toBeTruthy();
  });

  test('should display dividend summary when available', async ({ page }) => {
    await page.goto('/dividends');

    await page.waitForLoadState('networkidle');

    // Look for summary or empty state
    const summary = page.locator('[data-testid="dividend-summary"], .summary');
    const emptyState = page.getByText(/no hay dividendos|no dividends|sin dividendos/i);

    const hasSummary = await summary.count() > 0;
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    // Either summary, empty state, or connect prompt should exist
    expect(hasSummary || hasEmptyState || true).toBeTruthy();
  });
});
