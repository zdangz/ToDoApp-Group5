import { test, expect } from '@playwright/test';

test.describe('Recurring Todos', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="text"]', 'testuser-recurring');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('http://localhost:3000/');
  });

  test('should show recurrence dropdown when Repeat checkbox is checked', async ({ page }) => {
    // Verify dropdown is not visible initially
    await expect(page.locator('select option:has-text("Daily")')).not.toBeVisible();

    // Check the Repeat checkbox
    await page.check('input[type="checkbox"]');

    // Verify dropdown is now visible
    await expect(page.locator('select option:has-text("Daily")')).toBeVisible();
    await expect(page.locator('select option:has-text("Weekly")')).toBeVisible();
    await expect(page.locator('select option:has-text("Monthly")')).toBeVisible();
    await expect(page.locator('select option:has-text("Yearly")')).toBeVisible();
  });

  test('should hide recurrence dropdown when Repeat checkbox is unchecked', async ({ page }) => {
    // Check the Repeat checkbox
    await page.check('input[type="checkbox"]');
    await expect(page.locator('select option:has-text("Daily")')).toBeVisible();

    // Uncheck the Repeat checkbox
    await page.uncheck('input[type="checkbox"]');

    // Verify dropdown is hidden
    await expect(page.locator('select option:has-text("Daily")')).not.toBeVisible();
  });

  test('should create daily recurring todo', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Fill in todo details
    await page.fill('input[placeholder*="Add a new todo"]', 'Daily Task');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T09:00`);

    // Enable recurring and select Daily
    await page.check('input[type="checkbox"]');
    await page.selectOption('select', 'daily');

    // Submit
    await page.click('button:has-text("Add")');

    // Verify todo was created
    await expect(page.locator('text=Daily Task')).toBeVisible();
  });

  test('should create weekly recurring todo', async ({ page }) => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    await page.fill('input[placeholder*="Add a new todo"]', 'Weekly Meeting');
    await page.fill('input[type="datetime-local"]', `${nextWeekStr}T14:00`);

    await page.check('input[type="checkbox"]');
    await page.selectOption('select', 'weekly');

    await page.click('button:has-text("Add")');

    await expect(page.locator('text=Weekly Meeting')).toBeVisible();
  });

  test('should create monthly recurring todo', async ({ page }) => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().split('T')[0];

    await page.fill('input[placeholder*="Add a new todo"]', 'Monthly Report');
    await page.fill('input[type="datetime-local"]', `${nextMonthStr}T17:00`);

    await page.check('input[type="checkbox"]');
    await page.selectOption('select', 'monthly');

    await page.click('button:has-text("Add")');

    await expect(page.locator('text=Monthly Report')).toBeVisible();
  });

  test('should create yearly recurring todo', async ({ page }) => {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextYearStr = nextYear.toISOString().split('T')[0];

    await page.fill('input[placeholder*="Add a new todo"]', 'Annual Review');
    await page.fill('input[type="datetime-local"]', `${nextYearStr}T10:00`);

    await page.check('input[type="checkbox"]');
    await page.selectOption('select', 'yearly');

    await page.click('button:has-text("Add")');

    await expect(page.locator('text=Annual Review')).toBeVisible();
  });

  test('should create next instance when completing daily recurring todo', async ({ page }) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Create daily recurring todo
    await page.fill('input[placeholder*="Add a new todo"]', 'Daily Standup');
    await page.fill('input[type="datetime-local"]', `${todayStr}T09:30`);
    await page.check('input[type="checkbox"]');
    await page.selectOption('select', 'daily');
    await page.click('button:has-text("Add")');

    await expect(page.locator('text=Daily Standup').first()).toBeVisible();

    // Complete the todo
    const checkbox = page.locator('input[type="checkbox"][class*="w-4"]').first();
    await checkbox.check();

    // Wait for the update
    await page.waitForTimeout(1000);

    // Should see two instances now: completed and new pending
    const todoItems = page.locator('text=Daily Standup');
    await expect(todoItems).toHaveCount(2);
  });

  test('should create next instance when completing weekly recurring todo', async ({ page }) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Create weekly recurring todo
    await page.fill('input[placeholder*="Add a new todo"]', 'Weekly Sync');
    await page.fill('input[type="datetime-local"]', `${todayStr}T15:00`);
    await page.check('input[type="checkbox"]');
    await page.selectOption('select', 'weekly');
    await page.click('button:has-text("Add")');

    await expect(page.locator('text=Weekly Sync').first()).toBeVisible();

    // Complete the todo
    const checkbox = page.locator('input[type="checkbox"][class*="w-4"]').first();
    await checkbox.check();

    await page.waitForTimeout(1000);

    // Should see two instances
    const todoItems = page.locator('text=Weekly Sync');
    await expect(todoItems).toHaveCount(2);
  });

  test('should preserve priority in next recurring instance', async ({ page }) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Create high priority daily recurring todo
    await page.fill('input[placeholder*="Add a new todo"]', 'High Priority Daily');
    await page.selectOption('select[class*="px-4"]', 'high');
    await page.fill('input[type="datetime-local"]', `${todayStr}T10:00`);
    await page.check('input[type="checkbox"]');
    await page.selectOption('select', 'daily');
    await page.click('button:has-text("Add")');

    // Verify high priority badge
    await expect(page.locator('span:has-text("High")')).toBeVisible();

    // Complete the todo
    const checkbox = page.locator('input[type="checkbox"][class*="w-4"]').first();
    await checkbox.check();

    await page.waitForTimeout(1000);

    // Both instances should have high priority
    const highBadges = page.locator('span:has-text("High")');
    await expect(highBadges).toHaveCount(2);
  });

  test('should not create next instance for non-recurring todo', async ({ page }) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Create non-recurring todo (don't check Repeat)
    await page.fill('input[placeholder*="Add a new todo"]', 'One Time Task');
    await page.fill('input[type="datetime-local"]', `${todayStr}T11:00`);
    await page.click('button:has-text("Add")');

    await expect(page.locator('text=One Time Task')).toBeVisible();

    // Complete the todo
    const checkbox = page.locator('input[type="checkbox"][class*="w-4"]').first();
    await checkbox.check();

    await page.waitForTimeout(1000);

    // Should only see one instance (completed)
    const todoItems = page.locator('text=One Time Task');
    await expect(todoItems).toHaveCount(1);
  });

  test('should default to Weekly when Repeat is checked', async ({ page }) => {
    // Check the Repeat checkbox
    await page.check('input[type="checkbox"]');

    // Verify Weekly is selected by default
    const select = page.locator('select').nth(1); // Second select is recurrence
    await expect(select).toHaveValue('weekly');
  });
});
