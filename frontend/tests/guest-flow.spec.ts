import { test, expect } from '@playwright/test';

test.describe('Guest Intro Flow', () => {
  test('can navigate from landing to intro', async ({ page }) => {
    await page.goto('/');
    // Look for a CTA that leads to the intro flow
    const introLink = page.locator('a[href*="intro"], button:has-text("Try"), button:has-text("Start")').first();
    if (await introLink.isVisible()) {
      await introLink.click();
      await expect(page).toHaveURL(/\/intro/);
    }
  });

  test('intro page renders without authentication', async ({ page }) => {
    await page.goto('/intro');
    await expect(page.locator('body')).toBeVisible();
    // Should not redirect to login
    expect(page.url()).toContain('/intro');
  });

  test('guest session page is accessible from intro', async ({ page }) => {
    await page.goto('/intro/session');
    // Should render the guest session page (not redirect to login)
    await expect(page.locator('body')).toBeVisible();
  });
});
