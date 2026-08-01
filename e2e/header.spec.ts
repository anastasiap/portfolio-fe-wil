import { expect, test } from '@playwright/test';

const ROOT_URL = 'http://localhost:4200/';

test.describe('Header', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROOT_URL);
  });

  test('shows the guest logo and desktop navigation destinations', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const logo = page.getByTestId('header-logo');
    const navigation = page.getByTestId('header-navigation');

    await expect(logo).toHaveText('Wheel of Life');
    await expect(logo).toHaveAttribute('href', '/');
    await expect(navigation).toBeVisible();
    await expect(page.getByTestId('nav-home')).toHaveAttribute('href', '/');
    await expect(page.getByTestId('nav-pricing')).toHaveAttribute('href', '/plans');
    await expect(page.getByTestId('nav-professionals')).toHaveAttribute('href', '/for-coaches');
    await expect(page.getByTestId('nav-blog')).toHaveAttribute('href', '/blog');
    await expect(page.getByTestId('nav-about')).toHaveAttribute('href', '/about');

    await logo.click();

    await expect(page).toHaveURL(ROOT_URL);
  });

  test('switches the desktop navigation language without leaving the page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const languageSwitcher = page.getByTestId('header-navigation-language-switcher-mat-select');

    await languageSwitcher.click();
    await page.getByRole('option', { name: 'Русский' }).click();

    await expect(languageSwitcher).toContainText('Русский');
    await expect(page.getByTestId('nav-auth')).toContainText('Войти');
    await expect(page).toHaveURL(ROOT_URL);

    await languageSwitcher.click();
    await page.getByRole('option', { name: 'English' }).click();

    await expect(languageSwitcher).toContainText('English');
    await expect(page.getByTestId('nav-auth')).toContainText('Login / Sign up');
  });

  test('opens the login dialog from the desktop header without navigating', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.getByTestId('nav-auth').click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog')).toContainText('Welcome Back');
    await expect(page).toHaveURL(ROOT_URL);
  });

  test('opens and closes the mobile menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const hamburger = page.getByTestId('header-hamburger-button');
    const mobileMenu = page.getByTestId('header-mobile-menu');

    await expect(page.getByTestId('header-navigation-container')).toBeHidden();
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    await expect(mobileMenu).not.toHaveClass(/header__mobile-menu--open/);

    await hamburger.click();

    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
    await expect(mobileMenu).toHaveClass(/header__mobile-menu--open/);
    await expect(page.getByTestId('mobile-nav-home')).toHaveAttribute('href', '/');
    await expect(page.getByTestId('mobile-nav-pricing')).toHaveAttribute('href', '/plans');
    await expect(page.getByTestId('mobile-nav-professionals')).toHaveAttribute('href', '/for-coaches');
    await expect(page.getByTestId('mobile-nav-blog')).toHaveAttribute('href', '/blog');
    await expect(page.getByTestId('mobile-nav-about')).toHaveAttribute('href', '/about');

    await hamburger.click();

    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    await expect(mobileMenu).not.toHaveClass(/header__mobile-menu--open/);
    await expect(page).toHaveURL(ROOT_URL);
  });

  test('switches language from the mobile menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByTestId('header-hamburger-button').click();

    const languageSwitcher = page.getByTestId('mobile-header-navigation-language-switcher-mat-select');

    await languageSwitcher.click();
    await page.getByRole('option', { name: 'Русский' }).click();

    await expect(languageSwitcher).toContainText('Русский');
    await expect(page.getByTestId('mobile-nav-auth')).toContainText('Войти');
    await expect(page.getByTestId('header-hamburger-button')).toHaveAttribute('aria-expanded', 'true');
    await expect(page).toHaveURL(ROOT_URL);
  });

  test('opens login from the mobile menu and closes the menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByTestId('header-hamburger-button').click();

    await page.getByTestId('mobile-nav-auth').click();

    await expect(page.getByTestId('header-hamburger-button')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByTestId('header-mobile-menu')).not.toHaveClass(/header__mobile-menu--open/);
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog')).toContainText('Welcome Back');
    await expect(page).toHaveURL(ROOT_URL);
  });

  test('does not expose authenticated-only controls to a guest', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    await expect(page.getByTestId('header-wheel-switcher')).toHaveCount(0);
    await expect(page.getByTestId('nav-logout')).toHaveCount(0);
    await expect(page.getByTestId('header-logo-no-link')).toHaveCount(0);
    await expect(page.getByTestId('nav-auth')).toBeVisible();
  });
});
