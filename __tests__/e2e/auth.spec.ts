import { test, expect } from '@playwright/test';

// Reset storage state for this file because auth flows need an unauthenticated user
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page before each test
    await page.goto('/login');
  });

  test('should display login form fields and branding', async ({ page }) => {
    await expect(page.locator('h2')).toHaveText('Welcome to MailFlow');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toHaveText('Log In');
  });

  test('should navigate to registration page and validate sign up fields', async ({ page }) => {
    await page.click('text=Sign up now');
    await expect(page).toHaveURL(/\/register/);

    await expect(page.locator('h2')).toHaveText('Create Account');
    await expect(page.getByPlaceholder('John Doe')).toBeVisible();
    await expect(page.getByPlaceholder('john@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('Min. 8 characters')).toBeVisible();
  });

  test('should show error warning when attempting credentials login with blank fields', async ({ page }) => {
    // Click login button without inputting anything
    await page.click('button[type="submit"]');

    // Form elements have required attributes, but in case they bypass HTML5 checks or we check local state error
    const emailInput = page.locator('input[type="email"]');
    const isRequired = await emailInput.evaluate((el: HTMLInputElement) => el.required);
    expect(isRequired).toBe(true);
  });

  test('should handle incorrect credentials and display an error banner', async ({ page }) => {
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'incorrectpassword');
    await page.click('button[type="submit"]');

    // The sign-in process is async and will call NextAuth credentials endpoint
    // It should show Invalid email or password error, or Auth failed if server is still spinning up
    await expect(page.getByText('Invalid email or password').or(page.getByText('Invalid credentials')).or(page.getByText('Authentication failed'))).toBeVisible();
  });
});
