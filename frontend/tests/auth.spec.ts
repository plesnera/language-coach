import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should auto-login in dev mode', async ({ page }) => {
    // In LOCAL_DEV mode, the app should auto-login.
    // We can verify this by going directly to a protected route
    // and checking for an element that only appears when logged in.
    await page.goto('/learn');
    await page.waitForSelector('button:has-text("Log Out")');
    await expect(page.locator('button', { hasText: 'Log Out' })).toBeVisible();
  });
});
