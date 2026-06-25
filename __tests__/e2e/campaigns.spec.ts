import { test, expect } from '@playwright/test';

test.describe('Campaigns Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock GraphQL requests for templates, CSV files, and campaigns to return standard test data
    await page.route('**/api/graphql', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      if (postData && postData.query.includes('GetCampaignsAndResources')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              campaigns: [
                {
                  id: 'camp-1',
                  status: 'DRAFT',
                  autoSend: true,
                  emailColumn: 'email',
                  columnMapping: { first_name: 'first_name', company_name: 'company' },
                  createdAt: String(Date.now()),
                  template: {
                    id: 'tpl-1',
                    name: 'Job Application Followup',
                    subject: 'Application Status at {{company_name}}',
                    body: '<p>Hi {{first_name}}...</p>',
                  },
                  csvFile: {
                    id: 'csv-1',
                    filename: 'candidates.csv',
                    rowCount: 15,
                  },
                },
              ],
              templates: [
                {
                  id: 'tpl-1',
                  name: 'Job Application Followup',
                  subject: 'Application Status at {{company_name}}',
                  body: '<p>Hi {{first_name}}...</p>',
                  variables: ['first_name', 'company_name'],
                },
              ],
              csvFiles: [
                {
                  id: 'csv-1',
                  filename: 'candidates.csv',
                  columns: ['first_name', 'email', 'company', 'position'],
                  storagePath: 'uploads/candidates.csv',
                },
              ],
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/campaigns');
  });

  test('should load campaigns page and show active campaigns list', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Campaigns Dashboard');
    await expect(page.locator('text=Job Application Followup')).toBeVisible();
    await expect(page.locator('text=candidates.csv')).toBeVisible();
    await expect(page.locator('text=Auto-Send Active')).toBeVisible();
  });

  test('should trigger the Build Campaign modal when clicking Build Campaign button', async ({ page }) => {
    await page.click('button:has-text("Build Campaign")');
    await expect(page.locator('h3:has-text("Build Email Campaign")')).toBeVisible();

    // Verify drop-down lists are visible
    await expect(page.locator('select').first()).toBeVisible();
    await expect(page.locator('select').last()).toBeVisible();
  });

  test('should allow selecting template, CSV, and toggling auto-send checkbox', async ({ page }) => {
    await page.click('button:has-text("Build Campaign")');

    const templateSelect = page.locator('select').first();
    const csvSelect = page.locator('select').last();

    await templateSelect.selectOption({ label: 'Job Application Followup' });
    await csvSelect.selectOption({ label: 'candidates.csv' });

    // Auto-send checkbox check
    const checkbox = page.locator('input[type="checkbox"]');
    await expect(checkbox).toBeVisible();
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  });

  test('should support triggering campaign run dispatch', async ({ page }) => {
    // Mock successful trigger campaign mutation response
    await page.route('**/api/graphql', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();
      if (postData && postData.query.includes('TriggerCampaign')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              triggerCampaign: true,
            },
          }),
        });
      } else {
        await route.fallback();
      }
    });

    await page.click('button:has-text("Run Dispatch")');

    // Should display toast success confirmation message
    await expect(page.locator('text=Campaign email queue processing started!')).toBeVisible();
  });
});
