import { test, expect } from '@playwright/test';

test.describe('Templates Management', () => {
  test.beforeEach(async ({ page }) => {
    // Go to template creation page

    await page.goto('/templates/new');
  });

  test('should display template metadata input fields', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Create New Template');
    await expect(page.getByPlaceholder('e.g. Job Application Response')).toBeVisible();
    await expect(page.getByPlaceholder('e.g. Application Status at {{company_name}}')).toBeVisible();
  });

  test('should allow entering template name and subject', async ({ page }) => {
    const nameInput = page.getByPlaceholder('e.g. Job Application Response');
    const subjectInput = page.getByPlaceholder('e.g. Application Status at {{company_name}}');

    await nameInput.fill('Follow-up Template');
    await subjectInput.fill('Checking in: {{position}} at {{company_name}}');

    await expect(nameInput).toHaveValue('Follow-up Template');
    await expect(subjectInput).toHaveValue('Checking in: {{position}} at {{company_name}}');
  });

  test('should support adding custom variable chips and inserting them into TipTap editor', async ({ page }) => {
    // Check default variables exist
    await expect(page.locator('button:has-text("{{ first_name }}")')).toBeVisible();
    await expect(page.locator('button:has-text("{{ sender_name }}")')).toBeVisible();

    // Add a custom variable
    const customVarInput = page.getByPlaceholder('Custom variable...');
    await customVarInput.fill('interview_date');
    await page.locator('form:has(input[placeholder="Custom variable..."]) button').click();

    // Verify new variable chip is created
    const customChip = page.locator('button:has-text("{{ interview_date }}")');
    await expect(customChip).toBeVisible();

    // Write content into TipTap editor
    const editor = page.locator('.ProseMirror');
    await editor.focus();
    await page.keyboard.type('Dear candidate, you are scheduled for ');

    // Click variable chip to insert it
    await customChip.click();

    // Assert that the editor contents contain the inserted variable syntax
    const editorContent = await editor.innerHTML();
    expect(editorContent).toContain('{{interview_date}}');
  });

  test('should validate template before saving', async ({ page }) => {
    // Fill only template name
    await page.getByPlaceholder('e.g. Job Application Response').fill('Incomplete Template');

    // Click save
    await page.click('text=Save Template');

    // Should show validation warning
    await expect(page.locator('text=Please fill in the template name, subject, and body')).toBeVisible();
  });
});
