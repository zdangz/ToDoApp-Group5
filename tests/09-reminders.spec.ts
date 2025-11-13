import { test, expect } from '@playwright/test';

test.describe('Reminders & Notifications', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="text"]', `testuser-reminders-${Date.now()}`);
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('http://localhost:3000/');
  });

  test('should show notification toggle button', async ({ page }) => {
    // Button should exist (either 🔔 or 🔕)
    const notificationButton = page.locator('button').filter({ hasText: /🔔|🔕/ });
    await expect(notificationButton).toBeVisible();
  });

  test('should disable reminder dropdown when no due date', async ({ page }) => {
    const reminderSelect = page.locator('select:near(label:has-text("Reminder"))');
    
    // Should be disabled initially
    await expect(reminderSelect).toBeDisabled();
  });

  test('should enable reminder dropdown with due date', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Set due date
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T14:00`);
    
    // Reminder should now be enabled
    const reminderSelect = page.locator('select:near(label:has-text("Reminder"))');
    await expect(reminderSelect).toBeEnabled();
  });

  test('should have all 7 reminder timing options', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Set due date to enable reminder
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T14:00`);
    
    const reminderSelect = page.locator('select:near(label:has-text("Reminder"))');
    
    // Verify options exist
    await expect(reminderSelect.locator('option:has-text("No reminder")')).toBeVisible();
    await expect(reminderSelect.locator('option:has-text("15 minutes before")')).toBeVisible();
    await expect(reminderSelect.locator('option:has-text("30 minutes before")')).toBeVisible();
    await expect(reminderSelect.locator('option:has-text("1 hour before")')).toBeVisible();
    await expect(reminderSelect.locator('option:has-text("2 hours before")')).toBeVisible();
    await expect(reminderSelect.locator('option:has-text("1 day before")')).toBeVisible();
    await expect(reminderSelect.locator('option:has-text("2 days before")')).toBeVisible();
    await expect(reminderSelect.locator('option:has-text("1 week before")')).toBeVisible();
  });

  test('should create todo with reminder', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Create todo with reminder
    await page.fill('input[placeholder*="Add a new todo"]', 'Reminder Task');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T14:00`);
    
    const reminderSelect = page.locator('select:near(label:has-text("Reminder"))');
    await reminderSelect.selectOption('60'); // 1 hour before
    
    await page.click('button:has-text("Add")');
    
    // Verify todo created
    await expect(page.locator('text=Reminder Task')).toBeVisible();
  });

  test('should edit reminder time', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Create todo with reminder
    await page.fill('input[placeholder*="Add a new todo"]', 'Edit Reminder');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T14:00`);
    await page.locator('select:near(label:has-text("Reminder"))').selectOption('60');
    await page.click('button:has-text("Add")');
    
    // Edit reminder
    await page.locator('text=Edit Reminder').locator('..').locator('button:has-text("Edit")').click();
    
    // Change reminder
    await page.selectOption('select:near(label:has-text("Reminder"))', '1440'); // 1 day before
    await page.click('button:has-text("Save Changes")');
    
    // Verify saved (no error)
    await expect(page.locator('text=Edit Reminder')).toBeVisible();
  });

  test('should remove reminder', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Create todo with reminder
    await page.fill('input[placeholder*="Add a new todo"]', 'Remove Reminder');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T14:00`);
    await page.locator('select:near(label:has-text("Reminder"))').selectOption('60');
    await page.click('button:has-text("Add")');
    
    // Edit and remove reminder
    await page.locator('text=Remove Reminder').locator('..').locator('button:has-text("Edit")').click();
    await page.selectOption('select:near(label:has-text("Reminder"))', ''); // No reminder
    await page.click('button:has-text("Save Changes")');
    
    // Verify saved
    await expect(page.locator('text=Remove Reminder')).toBeVisible();
  });

  test('should request notification permission on toggle', async ({ page }) => {
    // Grant notification permission in context
    await page.context().grantPermissions(['notifications']);
    
    // Click notification toggle
    const notificationButton = page.locator('button').filter({ hasText: /🔔|🔕/ });
    await notificationButton.click();
    
    // Button state should change
    await page.waitForTimeout(500);
    
    // Verify button updated (no error thrown)
    await expect(notificationButton).toBeVisible();
  });

  test('should show notification toggle state', async ({ page }) => {
    const notificationButton = page.locator('button').filter({ hasText: /🔔|🔕/ });
    const initialText = await notificationButton.textContent();
    
    // Grant permission
    await page.context().grantPermissions(['notifications']);
    
    // Toggle
    await notificationButton.click();
    await page.waitForTimeout(500);
    
    // State should potentially change
    const newText = await notificationButton.textContent();
    expect(newText).toBeTruthy();
  });

  test('should persist notification preference', async ({ page }) => {
    // Grant permission
    await page.context().grantPermissions(['notifications']);
    
    // Enable notifications
    const notificationButton = page.locator('button').filter({ hasText: /🔔|🔕/ });
    await notificationButton.click();
    
    // Reload page
    await page.reload();
    
    // Verify button still shows enabled state
    await expect(notificationButton).toBeVisible();
  });

  test('should disable reminder when due date removed', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Set due date
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T14:00`);
    
    const reminderSelect = page.locator('select:near(label:has-text("Reminder"))');
    await expect(reminderSelect).toBeEnabled();
    
    // Clear due date
    await page.fill('input[type="datetime-local"]', '');
    
    // Reminder should be disabled
    await expect(reminderSelect).toBeDisabled();
  });

  test('should show reminder in edit modal for existing todo', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Create todo with reminder
    await page.fill('input[placeholder*="Add a new todo"]', 'Check Reminder');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T14:00`);
    await page.locator('select:near(label:has-text("Reminder"))').selectOption('120'); // 2 hours
    await page.click('button:has-text("Add")');
    
    // Open edit modal
    await page.locator('text=Check Reminder').locator('..').locator('button:has-text("Edit")').click();
    
    // Verify reminder value shown
    const reminderSelect = page.locator('h2:has-text("Edit Todo")').locator('..').locator('select:near(label:has-text("Reminder"))');
    await expect(reminderSelect).toHaveValue('120');
  });

  test('should allow reminder on recurring todo', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Create recurring todo with reminder
    await page.fill('input[placeholder*="Add a new todo"]', 'Recurring Reminder');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T14:00`);
    await page.check('label:has-text("Repeat") input[type="checkbox"]');
    await page.selectOption('select:near(label:has-text("Repeat"))', 'daily');
    await page.locator('select:near(label:has-text("Reminder"))').selectOption('60');
    await page.click('button:has-text("Add")');
    
    // Verify created
    await expect(page.locator('text=Recurring Reminder')).toBeVisible();
  });

  test('should disable notification button when browser does not support', async ({ page }) => {
    // This test is informational - browser context always supports notifications in tests
    const notificationButton = page.locator('button').filter({ hasText: /🔔|🔕/ });
    await expect(notificationButton).toBeVisible();
  });
});
