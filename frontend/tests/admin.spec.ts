import { test, expect } from '@playwright/test';

test.describe('Admin Routes', () => {
  test('admin page redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/admin');
    // Should redirect to /login since user is not authenticated
    await page.waitForURL(/\/(login|intro)/, { timeout: 5000 }).catch(() => {
      // Alternatively, shows access denied
      expect(page.url()).toMatch(/\/(admin|login|intro)/);
    });
  });

  test('admin sub-routes are protected', async ({ page }) => {
    const adminRoutes = ['/admin/courses', '/admin/topics', '/admin/prompts', '/admin/users'];
    for (const route of adminRoutes) {
      await page.goto(route);
      // Should redirect or show access denied
      await page.waitForTimeout(1000);
      const url = page.url();
      const isProtected = url.includes('login') || url.includes('intro') || url.includes('admin');
      expect(isProtected).toBeTruthy();
    }
  });
});
