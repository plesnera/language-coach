import { test, expect } from '@playwright/test';

test.describe('Main Application', () => {
  test('should load learn page', async ({ page }) => {
    await page.goto('/learn');
    await page.waitForSelector('#root > div > main > div:nth-child(5) > div.space-y-4 > div:nth-child(1) > button:has-text("Start")');
    await expect(page.locator('h2', { hasText: 'Spanish for Beginners' })).toBeVisible();
  });

  test('should load topics page', async ({ page }) => {
    await page.goto('/topics');
    await page.waitForSelector('#root > div > main > div.text-center.mb-12 > p:has-text("Choose a conversation topic or bring your own material to discuss!")');
    await expect(page.locator('h1', { hasText: 'Pick a Topic' })).toBeVisible();
  });

  test('should load freestyle page', async ({ page }) => {
    await page.goto('/freestyle');
    await page.waitForSelector('h1:has-text("Freestyle")');
    await expect(page.locator('h1', { hasText: 'Freestyle' })).toBeVisible();
  });

  test('should load history page', async ({ page }) => {
    await page.goto('/history');
    await page.waitForSelector('h1:has-text("Conversation History")');
    await expect(page.locator('h1', { hasText: 'Conversation History' })).toBeVisible();
  });

  test('should be able to select a language on learn page', async ({ page }) => {
    await page.goto('/learn');
    const languageSelector = page.locator('#root > div > main > div:nth-child(3) > div.flex.flex-wrap.gap-3 > button').filter({ hasText: /^Language/ }).nth(1);
    await languageSelector.waitFor();
    await expect(languageSelector).toBeVisible();
    await languageSelector.click();
    await page.locator('div', { hasText: 'Spanish' }).click();
    await expect(page.locator('div', { hasText: 'Spanish' })).toBeVisible();
  });
});
