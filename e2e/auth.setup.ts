import { expect, test as setup } from '@playwright/test';
import * as path from 'node:path';

const authFile = path.join(__dirname, '.auth', 'user.json');

setup('authenticate test user', async ({ page }) => {
  const email = process.env['E2E_AUTH_EMAIL'];
  const password = process.env['E2E_AUTH_PASSWORD'];

  if (!email || !password) {
    throw new Error('E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD must be configured before running authenticated tests.');
  }

  await page.goto('/');

  await page.getByTestId('nav-auth').click();
  await page.getByTestId('login-email-input').fill(email);
  await page.getByTestId('login-password-input').fill(password);

  await page.getByTestId('login-submit-button').getByRole('button').click();

  await Promise.race([
    page.getByTestId('header-logo-no-link').waitFor({ state: 'visible', timeout: 15_000 }),
    page.getByTestId('login-error-banner').waitFor({ state: 'visible', timeout: 15_000 }),
  ]);

  const loginError = page.getByTestId('login-error-banner');
  if (await loginError.isVisible()) {
    throw new Error(`Test-account login failed: ${(await loginError.innerText()).trim()}`);
  }

  await expect(page.getByTestId('header-logo-no-link')).toBeVisible({ timeout: 15_000 });

  await page.context().storageState({ path: authFile });
});
