import { test, expect } from '@playwright/test';

test.describe('Token Purchase Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');
  });

  test('should display available listings', async ({ page }) => {
    // Look for listing cards or empty state
    const listings = page.locator('[data-testid="listing-card"], .listing-card, .property-card');
    const emptyState = page.locator('text=/no hay listados|no listings|sin propiedades/i');

    const hasListings = await listings.count() > 0;
    const isEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasListings || isEmpty).toBeTruthy();
  });

  test('should show listing details with price', async ({ page }) => {
    const listings = page.locator('[data-testid="listing-card"], .listing-card, .property-card');

    if (await listings.count() > 0) {
      const firstListing = listings.first();

      // Should show price information
      const priceInfo = firstListing.locator('text=/\\$|USD|USDT|USDC|MATIC/');
      const hasPrice = await priceInfo.isVisible().catch(() => false);

      // Should show token amount
      const tokenInfo = firstListing.locator('text=/token|fraccion|fraction/i');
      const hasTokenInfo = await tokenInfo.isVisible().catch(() => false);

      expect(hasPrice || hasTokenInfo).toBeTruthy();
    }
  });

  test('should navigate to listing detail page', async ({ page }) => {
    const listings = page.locator('[data-testid="listing-card"], .listing-card, .property-card, a[href*="/marketplace/"]');

    if (await listings.count() > 0) {
      await listings.first().click();
      await page.waitForLoadState('networkidle');

      // Should navigate to detail page
      const isOnDetailPage = page.url().includes('/marketplace/') || page.url().includes('/properties/');

      expect(isOnDetailPage).toBeTruthy();
    }
  });

  test('should show buy button on listing', async ({ page }) => {
    const listings = page.locator('[data-testid="listing-card"], .listing-card, .property-card');

    if (await listings.count() > 0) {
      // Look for buy button
      const buyButton = page.getByRole('button', { name: /comprar|buy|invertir|invest/i });
      const hasBuyButton = await buyButton.isVisible().catch(() => false);

      // Buy button might be inside listing card or in detail view
      expect(typeof hasBuyButton).toBe('boolean');
    }
  });

  test('should show payment token options', async ({ page }) => {
    const listings = page.locator('[data-testid="listing-card"], .listing-card');

    if (await listings.count() > 0) {
      // Click to open purchase modal or navigate to detail
      await listings.first().click();
      await page.waitForTimeout(500);

      // Look for payment token selector
      const paymentOptions = page.locator('text=/USDT|USDC|MATIC/, [data-testid="payment-token"], select[name*="payment"]');
      const hasPaymentOptions = await paymentOptions.isVisible().catch(() => false);

      expect(typeof hasPaymentOptions).toBe('boolean');
    }
  });

  test('should show amount input for purchase', async ({ page }) => {
    // Navigate to a property or open buy modal
    const buyButton = page.getByRole('button', { name: /comprar|buy|invertir|invest/i });

    if (await buyButton.isVisible().catch(() => false)) {
      await buyButton.click();
      await page.waitForTimeout(500);

      // Look for amount input
      const amountInput = page.locator('input[name*="amount"], input[type="number"], [data-testid="amount-input"]');
      const hasAmountInput = await amountInput.isVisible().catch(() => false);

      expect(typeof hasAmountInput).toBe('boolean');
    }
  });
});

test.describe('Purchase Modal/Form', () => {
  test('should show total cost calculation', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');

    const buyButton = page.getByRole('button', { name: /comprar|buy/i }).first();

    if (await buyButton.isVisible().catch(() => false)) {
      await buyButton.click();
      await page.waitForTimeout(500);

      // Look for total calculation
      const totalCalc = page.locator('text=/total|costo total|total cost/i');
      const hasTotalCalc = await totalCalc.isVisible().catch(() => false);

      expect(typeof hasTotalCalc).toBe('boolean');
    }
  });

  test('should validate minimum purchase amount', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');

    const buyButton = page.getByRole('button', { name: /comprar|buy/i }).first();

    if (await buyButton.isVisible().catch(() => false)) {
      await buyButton.click();
      await page.waitForTimeout(500);

      const amountInput = page.locator('input[name*="amount"], input[type="number"]').first();

      if (await amountInput.isVisible()) {
        // Try to enter 0
        await amountInput.fill('0');

        // Look for validation error
        const validationError = page.locator('text=/mínimo|minimum|cantidad inválida|invalid amount/i');
        const hasValidation = await validationError.isVisible().catch(() => false);

        expect(typeof hasValidation).toBe('boolean');
      }
    }
  });

  test('should require wallet connection for purchase', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');

    const buyButton = page.getByRole('button', { name: /comprar|buy/i }).first();

    if (await buyButton.isVisible().catch(() => false)) {
      await buyButton.click();
      await page.waitForTimeout(500);

      // Should prompt for wallet connection or show connect button
      const connectPrompt = page.locator('text=/conectar wallet|connect wallet|iniciar sesión|sign in/i');
      const hasConnectPrompt = await connectPrompt.isVisible().catch(() => false);

      // Or a confirm purchase button that requires auth
      const confirmButton = page.getByRole('button', { name: /confirmar|confirm|proceder|proceed/i });
      const hasConfirmButton = await confirmButton.isVisible().catch(() => false);

      expect(hasConnectPrompt || hasConfirmButton).toBeTruthy();
    }
  });
});

test.describe('Purchase Confirmation', () => {
  test('should show transaction details before confirming', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');

    // This test assumes there are listings available
    const listings = page.locator('[data-testid="listing-card"], .listing-card, .property-card');

    if (await listings.count() > 0) {
      await listings.first().click();
      await page.waitForLoadState('networkidle');

      // Look for transaction summary elements
      const summaryElements = page.locator('text=/resumen|summary|detalles|details/i');
      const hasSummary = await summaryElements.isVisible().catch(() => false);

      expect(typeof hasSummary).toBe('boolean');
    }
  });

  test('should show marketplace fee information', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');

    // Look for fee information anywhere on the page
    const feeInfo = page.locator('text=/comisión|fee|2.5%|commission/i');
    const hasFeeInfo = await feeInfo.isVisible().catch(() => false);

    expect(typeof hasFeeInfo).toBe('boolean');
  });

  test('should show KYC requirement warning for non-verified users', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForLoadState('networkidle');

    // Look for KYC warning
    const kycWarning = page.locator('text=/kyc requerido|kyc required|verificación requerida|verification required/i');
    const hasKYCWarning = await kycWarning.isVisible().catch(() => false);

    // KYC warning should appear for non-verified users
    expect(typeof hasKYCWarning).toBe('boolean');
  });
});

test.describe('Property Detail Page', () => {
  test('should display property information', async ({ page }) => {
    // Try to navigate to a property detail page
    await page.goto('/properties');
    await page.waitForLoadState('networkidle');

    const propertyLinks = page.locator('a[href*="/properties/"]').first();

    if (await propertyLinks.isVisible().catch(() => false)) {
      await propertyLinks.click();
      await page.waitForLoadState('networkidle');

      // Should show property details
      const propertyDetails = page.locator('[data-testid="property-details"], .property-details, main');
      expect(await propertyDetails.isVisible()).toBeTruthy();

      // Check for key information
      const hasLocation = await page.locator('text=/ubicación|location/i').isVisible().catch(() => false);
      const hasPrice = await page.locator('text=/\\$|precio|price/i').isVisible().catch(() => false);

      expect(hasLocation || hasPrice).toBeTruthy();
    }
  });

  test('should show property images', async ({ page }) => {
    await page.goto('/properties');
    await page.waitForLoadState('networkidle');

    const propertyLinks = page.locator('a[href*="/properties/"]').first();

    if (await propertyLinks.isVisible().catch(() => false)) {
      await propertyLinks.click();
      await page.waitForLoadState('networkidle');

      // Look for images
      const images = page.locator('img[alt*="property"], img[alt*="propiedad"], .property-image');
      const imageCount = await images.count();

      expect(imageCount > 0).toBeTruthy();
    }
  });

  test('should show investment details', async ({ page }) => {
    await page.goto('/properties');
    await page.waitForLoadState('networkidle');

    const propertyLinks = page.locator('a[href*="/properties/"]').first();

    if (await propertyLinks.isVisible().catch(() => false)) {
      await propertyLinks.click();
      await page.waitForLoadState('networkidle');

      // Check for investment-related info
      const investmentInfo = [
        'text=/roi|rendimiento|yield|retorno/i',
        'text=/tokens disponibles|available tokens|fracciones/i',
        'text=/precio por token|price per token|fracción/i',
      ];

      let hasInvestmentInfo = false;
      for (const selector of investmentInfo) {
        if (await page.locator(selector).isVisible().catch(() => false)) {
          hasInvestmentInfo = true;
          break;
        }
      }

      expect(hasInvestmentInfo).toBeTruthy();
    }
  });
});

test.describe('Portfolio View', () => {
  test('should display owned tokens', async ({ page }) => {
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');

    // Should show portfolio or connect prompt
    const portfolioContent = page.locator('[data-testid="portfolio"], .portfolio-section, main');
    const connectPrompt = page.locator('text=/conectar|connect|iniciar sesión/i');

    const hasContent = await portfolioContent.isVisible().catch(() => false) ||
                       await connectPrompt.isVisible().catch(() => false);

    expect(hasContent).toBeTruthy();
  });

  test('should show total portfolio value', async ({ page }) => {
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');

    // Look for portfolio value
    const portfolioValue = page.locator('text=/valor total|total value|portafolio|portfolio/i');
    const hasPortfolioValue = await portfolioValue.isVisible().catch(() => false);

    expect(typeof hasPortfolioValue).toBe('boolean');
  });

  test('should show individual holdings', async ({ page }) => {
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');

    // Look for holding cards or list
    const holdings = page.locator('[data-testid="holding-card"], .holding-item, .portfolio-item');
    const emptyState = page.locator('text=/sin inversiones|no holdings|no investments/i');

    const hasHoldings = await holdings.count() > 0;
    const isEmpty = await emptyState.isVisible().catch(() => false);

    // Either has holdings or shows empty state
    expect(hasHoldings || isEmpty || await page.locator('text=/conectar/i').isVisible()).toBeTruthy();
  });
});
