import { expect, test } from '@playwright/test';

test('guest pages load without authentication', async ({ page }) => {
  for (const route of ['/', '/auth', '/profile', '/people', '/settings', '/u/tobihcreates']) {
    await page.goto(route);
    await expect(page.locator('body')).not.toHaveText(/Internal Server Error/);
  }
});

test('local login must fail without a real account', async ({ page, request }) => {
  const response = await request.post('/api/v1/auth/login', {
    data: { email: 'e2e+unique@example.invalid', password: 'not-a-real-password' },
  });
  expect(response.ok()).toBeFalsy();
  await page.goto('/profile');
  await expect(page.locator('body')).not.toHaveText(/Internal Server Error/);
});
