import { expect, Page, test } from '@playwright/test';

const ROOT_URL = 'http://localhost:4200/';

const authenticate = async (page: Page): Promise<void> => {
  const email = process.env['E2E_AUTH_EMAIL'];
  const password = process.env['E2E_AUTH_PASSWORD'];

  if (!email || !password) {
    throw new Error('E2E_AUTH_EMAIL and E2E_AUTH_PASSWORD must be configured before running authenticated tests.');
  }

  await page.context().clearCookies();
  await page.goto('/');
  await page.getByTestId('nav-auth').click();
  await page.getByTestId('login-email-input').fill(email);
  await page.getByTestId('login-password-input').fill(password);
  await page.getByTestId('login-submit-button').getByRole('button').click();
  await expect(page.getByTestId('header-logo-no-link')).toBeVisible({ timeout: 15_000 });

  await page.goto('/');
  await expect(page.getByTestId('header-logo-no-link')).toBeVisible({ timeout: 15_000 });
};

test.describe('Authenticated header', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
  });

  test('shows the free-plan desktop header and navigation destinations', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    await expect(page.getByTestId('header-logo-no-link')).toBeVisible();
    await expect(page.getByTestId('header-logo')).toHaveCount(0);
    await expect(page.getByTestId('nav-auth')).toHaveCount(0);
    await expect(page.getByTestId('header-navigation-language-switcher')).toHaveCount(0);
    await expect(page.getByTestId('personal-home')).toHaveAttribute('href', '/app/wheel');
    await expect(page.getByTestId('nav-dashboard')).toHaveAttribute('href', '/app/dashboard');
    await expect(page.getByTestId('nav-profile')).toHaveAttribute('href', '/app/account/profile');
    await expect(page.getByTestId('nav-logout')).toBeVisible();
  });

  test('renders the wheel switcher branch only on a wheel route', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    await expect(page.getByTestId('header-wheel-switcher')).toHaveCount(0);

    await page.goto('/app/wheel');

    await expect(page.getByTestId('header-wheel-switcher-container')).toHaveCount(1);
    await expect(page.getByTestId('header-wheel-switcher')).toHaveCount(1);
    await expect(page.getByTestId('personal-home')).toHaveClass(/header__nav-link--active/);

    await page.goto('/app/dashboard');

    await expect(page.getByTestId('header-wheel-switcher')).toHaveCount(0);
    await expect(page.getByTestId('nav-dashboard')).toHaveClass(/header__nav-link--active/);
  });

  test('opens and closes authenticated mobile navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const hamburger = page.getByTestId('header-hamburger-button');
    const mobileMenu = page.getByTestId('header-mobile-menu');

    await expect(page.getByTestId('header-navigation-container')).toBeHidden();
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    await expect(mobileMenu).not.toHaveClass(/header__mobile-menu--open/);

    await hamburger.click();

    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
    await expect(mobileMenu).toHaveClass(/header__mobile-menu--open/);
    await expect(page.getByTestId('mobile-personal-home')).toHaveAttribute('href', '/app/wheel');
    await expect(page.getByTestId('mobile-nav-dashboard')).toHaveAttribute('href', '/app/dashboard');
    await expect(page.getByTestId('mobile-nav-profile')).toHaveAttribute('href', '/app/account/profile');
    await expect(page.getByTestId('mobile-nav-logout')).toBeVisible();
    await expect(page.getByTestId('mobile-nav-auth')).toHaveCount(0);
    await expect(page.getByTestId('mobile-header-navigation-language-switcher')).toHaveCount(0);

    await hamburger.click();

    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    await expect(mobileMenu).not.toHaveClass(/header__mobile-menu--open/);
  });

  test('closes the mobile menu after navigating from it', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByTestId('header-hamburger-button').click();

    await page.getByTestId('mobile-personal-home').click();

    await expect(page).toHaveURL('http://localhost:4200/app/wheel');
    await expect(page.getByTestId('header-hamburger-button')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByTestId('header-mobile-menu')).not.toHaveClass(/header__mobile-menu--open/);
    await expect(page.getByTestId('header-wheel-switcher')).toBeVisible();
  });

  test('logs out from the desktop header', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.getByTestId('nav-logout').getByRole('button').click();

    await expect(page).toHaveURL(ROOT_URL);
    await expect(page.getByTestId('nav-auth')).toBeVisible();
    await expect(page.getByTestId('nav-logout')).toHaveCount(0);
    await expect(page.getByTestId('header-logo')).toBeVisible();
    await expect(page.getByTestId('header-logo-no-link')).toHaveCount(0);
  });

  test('logs out from mobile navigation and closes the menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByTestId('header-hamburger-button').click();

    await page.getByTestId('mobile-nav-logout').click();

    await expect(page).toHaveURL(ROOT_URL);
    await expect(page.getByTestId('header-hamburger-button')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByTestId('header-mobile-menu')).not.toHaveClass(/header__mobile-menu--open/);
    await expect(page.getByTestId('mobile-nav-logout')).toHaveCount(0);

    await page.getByTestId('header-hamburger-button').click();

    await expect(page.getByTestId('mobile-nav-auth')).toBeVisible();
  });
});
