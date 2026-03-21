import { test, expect } from '@playwright/test';

test.describe('Main Application', () => {
  test('should load learn page', async ({ page }) => {
    await page.goto('/learn');
    await page.waitForSelector('h1:has-text("Start Learning")');
    await expect(page.locator('h1', { hasText: 'Start Learning' })).toBeVisible();
  });

  test('should load topics page', async ({ page }) => {
    await page.goto('/topics');
    await page.waitForSelector('h1:has-text("Topics")');
    await expect(page.locator('h1', { hasText: 'Topics' })).toBeVisible();
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
    const languageSelector = page.locator('div').filter({ hasText: /^Language/ }).nth(1);
    await languageSelector.waitFor();
    await expect(languageSelector).toBeVisible();
    await languageSelector.click();
    await page.locator('div', { hasText: 'Spanish' }).click();
    await expect(page.locator('div', { hasText: 'Spanish' })).toBeVisible();
  });
});
