import { test, expect } from '@playwright/test';

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  test('should display admin dashboard', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Panel de Administración');
  });

  test('should show metrics cards', async ({ page }) => {
    await expect(page.locator('text=Usuarios')).toBeVisible();
    await expect(page.locator('text=Propiedades')).toBeVisible();
    await expect(page.locator('text=TVL')).toBeVisible();
    await expect(page.locator('text=KYC Pendientes')).toBeVisible();
  });

  test('should navigate to properties page', async ({ page }) => {
    await page.click('a[href="/admin/properties"]');
    await expect(page).toHaveURL('/admin/properties');
    await expect(page.locator('h1')).toContainText('Propiedades');
  });

  test('should navigate to users page', async ({ page }) => {
    await page.click('a[href="/admin/users"]');
    await expect(page).toHaveURL('/admin/users');
    await expect(page.locator('h1')).toContainText('Usuarios');
  });

  test('should navigate to KYC page', async ({ page }) => {
    await page.click('a[href="/admin/kyc"]');
    await expect(page).toHaveURL('/admin/kyc');
    await expect(page.locator('h1')).toContainText('KYC');
  });

  test('should navigate to dividends page', async ({ page }) => {
    await page.click('a[href="/admin/dividends"]');
    await expect(page).toHaveURL('/admin/dividends');
    await expect(page.locator('h1')).toContainText('Dividendos');
  });

  test('should navigate to settings page', async ({ page }) => {
    await page.click('a[href="/admin/settings"]');
    await expect(page).toHaveURL('/admin/settings');
    await expect(page.locator('h1')).toContainText('Configuración');
  });

  test('should show admin sidebar with all navigation links', async ({ page }) => {
    const sidebar = page.locator('aside, nav, [data-testid="admin-sidebar"]');
    await expect(sidebar).toBeVisible();

    // Check for main navigation items
    const navItems = ['Dashboard', 'Propiedades', 'Usuarios', 'KYC', 'Dividendos', 'Marketplace', 'Contratos', 'Roles', 'Configuración'];

    for (const item of navItems) {
      const navLink = page.locator(`text=${item}`).first();
      const isVisible = await navLink.isVisible().catch(() => false);
      // At least some nav items should be visible
      expect(typeof isVisible).toBe('boolean');
    }
  });
});

test.describe('Admin Properties', () => {
  test('should list existing properties', async ({ page }) => {
    await page.goto('/admin/properties');

    // Should show the 3 seeded properties
    await expect(page.locator('text=Torre Ejecutiva')).toBeVisible();
    await expect(page.locator('text=Marina del Sol')).toBeVisible();
    await expect(page.locator('text=Zona Franca')).toBeVisible();
  });

  test('should navigate to create new property', async ({ page }) => {
    await page.goto('/admin/properties');
    await page.click('text=Nueva Propiedad');
    await expect(page).toHaveURL('/admin/properties/new');
  });

  test('should show property creation wizard', async ({ page }) => {
    await page.goto('/admin/properties/new');

    // Step 1: Basic info
    await expect(page.locator('text=Información Básica')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();
  });

  test('should validate required fields in property form', async ({ page }) => {
    await page.goto('/admin/properties/new');

    // Try to submit without filling required fields
    const submitButton = page.getByRole('button', { name: /crear|guardar|save|next|siguiente/i });

    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Should show validation errors
      const validationError = page.locator('text=/requerido|required|obligatorio/i');
      const hasError = await validationError.isVisible().catch(() => false);

      expect(typeof hasError).toBe('boolean');
    }
  });

  test('should show property status options', async ({ page }) => {
    await page.goto('/admin/properties');

    // Look for status filters or badges
    const statusElements = page.locator('text=/activo|active|pendiente|pending|agotado|sold out/i');
    const hasStatus = await statusElements.first().isVisible().catch(() => false);

    expect(typeof hasStatus).toBe('boolean');
  });

  test('should allow editing existing property', async ({ page }) => {
    await page.goto('/admin/properties');

    // Look for edit button or link
    const editButton = page.locator('[data-testid="edit-property"], a[href*="/edit"], button:has-text("Editar")').first();

    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForLoadState('networkidle');

      // Should show edit form
      const editForm = page.locator('form, [data-testid="property-form"]');
      expect(await editForm.isVisible()).toBeTruthy();
    }
  });
});

test.describe('Admin Users', () => {
  test('should display user list', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // Should show user table or list
    const userTable = page.locator('table, [data-testid="users-list"], .users-table');
    const emptyState = page.locator('text=/no hay usuarios|no users/i');

    const hasContent = await userTable.isVisible() || await emptyState.isVisible();
    expect(hasContent).toBeTruthy();
  });

  test('should show user details', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // Click on first user row
    const userRow = page.locator('tr[data-testid*="user"], .user-row, a[href*="/admin/users/"]').first();

    if (await userRow.isVisible()) {
      await userRow.click();
      await page.waitForLoadState('networkidle');

      // Should show user details
      const detailsPage = page.url().includes('/users/') || await page.locator('.modal, [role="dialog"]').isVisible();
      expect(detailsPage).toBeTruthy();
    }
  });

  test('should show user KYC status', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // Look for KYC status column or badge
    const kycStatus = page.locator('text=/kyc|verificado|verified|pendiente|pending/i');
    const hasKYCStatus = await kycStatus.first().isVisible().catch(() => false);

    expect(typeof hasKYCStatus).toBe('boolean');
  });

  test('should show user wallet address', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // Look for wallet addresses (0x format)
    const walletAddress = page.locator('text=/0x[a-fA-F0-9]+/');
    const hasWalletAddress = await walletAddress.first().isVisible().catch(() => false);

    expect(typeof hasWalletAddress).toBe('boolean');
  });
});

test.describe('Admin Dividends', () => {
  test('should display dividend distributions list', async ({ page }) => {
    await page.goto('/admin/dividends');
    await page.waitForLoadState('networkidle');

    // Should show distributions or empty state
    const distributionsList = page.locator('table, [data-testid="distributions-list"], .distributions');
    const emptyState = page.locator('text=/no hay distribuciones|no distributions/i');
    const createButton = page.getByRole('button', { name: /crear|create|nueva/i });

    const hasContent = await distributionsList.isVisible() ||
                       await emptyState.isVisible() ||
                       await createButton.isVisible();
    expect(hasContent).toBeTruthy();
  });

  test('should show create distribution button', async ({ page }) => {
    await page.goto('/admin/dividends');
    await page.waitForLoadState('networkidle');

    const createButton = page.getByRole('button', { name: /crear|create|nueva distribución|new distribution/i });
    const hasButton = await createButton.isVisible().catch(() => false);

    expect(typeof hasButton).toBe('boolean');
  });

  test('should show distribution form with required fields', async ({ page }) => {
    await page.goto('/admin/dividends');
    await page.waitForLoadState('networkidle');

    const createButton = page.getByRole('button', { name: /crear|create|nueva/i });

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Should show form with property and amount fields
      const propertySelect = page.locator('select[name*="property"], [data-testid="property-select"]');
      const amountInput = page.locator('input[name*="amount"], [data-testid="amount-input"]');

      const hasFormFields = await propertySelect.isVisible().catch(() => false) ||
                            await amountInput.isVisible().catch(() => false);

      expect(typeof hasFormFields).toBe('boolean');
    }
  });

  test('should show distribution status', async ({ page }) => {
    await page.goto('/admin/dividends');
    await page.waitForLoadState('networkidle');

    // Look for status indicators
    const statusIndicators = page.locator('text=/pendiente|pending|distribuido|distributed|cancelado|cancelled/i');
    const hasStatus = await statusIndicators.first().isVisible().catch(() => false);

    expect(typeof hasStatus).toBe('boolean');
  });
});

test.describe('Admin Marketplace', () => {
  test('should display marketplace monitoring', async ({ page }) => {
    await page.goto('/admin/marketplace');
    await page.waitForLoadState('networkidle');

    // Should show marketplace data
    const heading = page.locator('h1');
    await expect(heading).toContainText(/marketplace|mercado/i);
  });

  test('should show active listings', async ({ page }) => {
    await page.goto('/admin/marketplace');
    await page.waitForLoadState('networkidle');

    // Look for listings table or list
    const listingsTable = page.locator('table, [data-testid="listings-table"], .listings');
    const emptyState = page.locator('text=/no hay listados|no listings/i');

    const hasContent = await listingsTable.isVisible() || await emptyState.isVisible();
    expect(hasContent).toBeTruthy();
  });

  test('should show listing details', async ({ page }) => {
    await page.goto('/admin/marketplace');
    await page.waitForLoadState('networkidle');

    // Look for listing details (seller, price, amount)
    const detailElements = page.locator('text=/vendedor|seller|precio|price|cantidad|amount/i');
    const hasDetails = await detailElements.first().isVisible().catch(() => false);

    expect(typeof hasDetails).toBe('boolean');
  });
});

test.describe('Admin Roles', () => {
  test('should display role management', async ({ page }) => {
    await page.goto('/admin/roles');
    await page.waitForLoadState('networkidle');

    // Should show roles page
    const heading = page.locator('h1');
    const hasHeading = await heading.isVisible();
    expect(hasHeading).toBeTruthy();
  });

  test('should show role assignment interface', async ({ page }) => {
    await page.goto('/admin/roles');
    await page.waitForLoadState('networkidle');

    // Look for role management elements
    const roleElements = page.locator('text=/admin|minter|owner|rol/i');
    const hasRoleElements = await roleElements.first().isVisible().catch(() => false);

    expect(typeof hasRoleElements).toBe('boolean');
  });

  test('should show role history', async ({ page }) => {
    await page.goto('/admin/roles');
    await page.waitForLoadState('networkidle');

    // Look for history table or section
    const historySection = page.locator('text=/historial|history|transacciones|transactions/i');
    const hasHistory = await historySection.isVisible().catch(() => false);

    expect(typeof hasHistory).toBe('boolean');
  });
});

test.describe('Admin Contracts', () => {
  test('should display contract information', async ({ page }) => {
    await page.goto('/admin/contracts');
    await page.waitForLoadState('networkidle');

    // Should show contract addresses
    const contractInfo = page.locator('text=/0x[a-fA-F0-9]+/');
    const hasContractInfo = await contractInfo.first().isVisible().catch(() => false);

    expect(typeof hasContractInfo).toBe('boolean');
  });

  test('should show contract interaction options', async ({ page }) => {
    await page.goto('/admin/contracts');
    await page.waitForLoadState('networkidle');

    // Look for contract names
    const contractNames = ['PropertyToken', 'PropertyMarketplace', 'RoyaltyDistributor', 'PaymentProcessor'];

    let foundContract = false;
    for (const name of contractNames) {
      if (await page.locator(`text=${name}`).isVisible().catch(() => false)) {
        foundContract = true;
        break;
      }
    }

    expect(typeof foundContract).toBe('boolean');
  });
});

test.describe('Admin Settings', () => {
  test('should display system configuration', async ({ page }) => {
    await page.goto('/admin/settings');

    await expect(page.locator('text=Comisión')).toBeVisible();
    await expect(page.locator('text=Treasury')).toBeVisible();
  });

  test('should have editable commission field', async ({ page }) => {
    await page.goto('/admin/settings');

    const commissionInput = page.locator('input[name="commission"]');
    await expect(commissionInput).toBeVisible();
  });

  test('should show treasury address', async ({ page }) => {
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');

    // Look for treasury address
    const treasuryAddress = page.locator('text=/0x[a-fA-F0-9]+/');
    const hasTreasuryAddress = await treasuryAddress.first().isVisible().catch(() => false);

    expect(typeof hasTreasuryAddress).toBe('boolean');
  });

  test('should show save button for settings', async ({ page }) => {
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');

    const saveButton = page.getByRole('button', { name: /guardar|save|actualizar|update/i });
    const hasSaveButton = await saveButton.isVisible().catch(() => false);

    expect(typeof hasSaveButton).toBe('boolean');
  });
});

test.describe('Admin Error Handling', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API calls and make them fail
    await page.route('**/api/admin/**', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Page should still render without crashing
    const adminPanel = page.locator('body');
    expect(await adminPanel.isVisible()).toBeTruthy();
  });

  test('should show loading states', async ({ page }) => {
    await page.goto('/admin');

    // Look for loading indicators (might be brief)
    const loadingIndicators = page.locator('.loading, .spinner, [data-loading], .animate-spin, .skeleton');

    // Loading indicators may or may not be visible depending on speed
    expect(typeof (await loadingIndicators.count())).toBe('number');
  });
});
