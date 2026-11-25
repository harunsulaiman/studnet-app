import { expect, test } from '@playwright/test';

test('guest pages load without authentication', async ({ page }) => {
  for (const route of ['/', '/auth', '/profile', '/people', '/settings', '/u/tobihcreates']) {
    await page.goto(route);
    await expect(page.locator('body')).not.toHaveText(/Internal Server Error/);
  }
});

test('local login works through the Next.js proxy', async ({ page, request }) => {
  const response = await request.post('/api/v1/auth/login', {
    data: { email: 'harun881@yahoo.com', password: 'harun881' },
  });
  expect(response.ok()).toBeTruthy();
  await page.goto('/profile');
  await expect(page.locator('body')).not.toHaveText(/Internal Server Error/);
});
