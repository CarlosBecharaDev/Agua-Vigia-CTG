import { test, expect } from '@playwright/test';

test('has title and renders map', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/AguaVigía/);
});

test('navigation to bitacora works', async ({ page }) => {
  await page.goto('/');

  // Click the bitacora link.
  await page.click('text=Bitácora');

  // Expects page to have a heading with the name of Bitácora.
  await expect(page.locator('h1', { hasText: 'Bitácora' })).toBeVisible();
});
