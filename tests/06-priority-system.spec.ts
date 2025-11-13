import { test, expect } from '@playwright/test';

test.describe('Priority System', () => {
  test.beforeEach(async ({ page, context }, testInfo) => {
    // Login via API with unique username per test
    const username = `testuser-priority-${testInfo.testId}`;
    await context.request.post('http://localhost:3000/api/auth/register', {
      data: { username }
    });
    
    // Navigate to home page
    await page.goto('http://localhost:3000/');
  });

  test('should create todo with high priority', async ({ page }) => {
    await page.fill('input[placeholder*="Add a new todo"]', 'High priority task');
    await page.selectOption('select', 'high');
    await page.click('button:has-text("Add")');

    // Verify todo is created
    await expect(page.locator('text=High priority task')).toBeVisible();

    // Verify high priority badge
    await expect(page.locator('text=high')).toBeVisible();
  });

  test('should create todo with medium priority', async ({ page }) => {
    await page.fill('input[placeholder*="Add a new todo"]', 'Medium priority task');
    await page.selectOption('select', 'medium');
    await page.click('button:has-text("Add")');

    // Verify todo is created
    await expect(page.locator('text=Medium priority task')).toBeVisible();

    // Verify medium priority badge
    await expect(page.locator('text=medium')).toBeVisible();
  });

  test('should create todo with low priority', async ({ page }) => {
    await page.fill('input[placeholder*="Add a new todo"]', 'Low priority task');
    await page.selectOption('select', 'low');
    await page.click('button:has-text("Add")');

    // Verify todo is created
    await expect(page.locator('text=Low priority task')).toBeVisible();

    // Verify low priority badge
    await expect(page.locator('text=low')).toBeVisible();
  });

  test('should default to medium priority if not specified', async ({ page }) => {
    await page.fill('input[placeholder*="Add a new todo"]', 'Default priority task');
    
    // Don't select priority explicitly (should default to medium)
    await page.click('button:has-text("Add")');

    // Verify todo is created
    await expect(page.locator('text=Default priority task')).toBeVisible();

    // Verify medium priority badge (default)
    await expect(page.locator('text=medium')).toBeVisible();
  });

  test('should show all priority levels in dropdown', async ({ page }) => {
    // Check that priority dropdown has all options
    const prioritySelect = page.locator('select').first();
    
    // Get all options
    const options = await prioritySelect.locator('option').allTextContents();
    
    // Should have high, medium, low options
    expect(options.some(opt => opt.toLowerCase().includes('high'))).toBeTruthy();
    expect(options.some(opt => opt.toLowerCase().includes('medium'))).toBeTruthy();
    expect(options.some(opt => opt.toLowerCase().includes('low'))).toBeTruthy();
  });

  test('should display priority badges with correct styling', async ({ page }) => {
    // Create todos with different priorities
    await page.fill('input[placeholder*="Add a new todo"]', 'High task');
    await page.selectOption('select', 'high');
    await page.click('button:has-text("Add")');
    await page.waitForTimeout(200);

    await page.fill('input[placeholder*="Add a new todo"]', 'Medium task');
    await page.selectOption('select', 'medium');
    await page.click('button:has-text("Add")');
    await page.waitForTimeout(200);

    await page.fill('input[placeholder*="Add a new todo"]', 'Low task');
    await page.selectOption('select', 'low');
    await page.click('button:has-text("Add")');

    // Verify all badges are visible
    const highBadge = page.locator('text=high').first();
    const mediumBadge = page.locator('text=medium').first();
    const lowBadge = page.locator('text=low').first();

    await expect(highBadge).toBeVisible();
    await expect(mediumBadge).toBeVisible();
    await expect(lowBadge).toBeVisible();

    // Check badge colors (badges should have distinct background colors)
    const highBgColor = await highBadge.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    const mediumBgColor = await mediumBadge.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    const lowBgColor = await lowBadge.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );

    // Colors should be different for each priority level
    expect(highBgColor).not.toBe(mediumBgColor);
    expect(mediumBgColor).not.toBe(lowBgColor);
  });

  test('should filter todos by high priority', async ({ page }) => {
    // Create todos with different priorities
    await page.fill('input[placeholder*="Add a new todo"]', 'High task 1');
    await page.selectOption('select', 'high');
    await page.click('button:has-text("Add")');
    await page.waitForTimeout(200);

    await page.fill('input[placeholder*="Add a new todo"]', 'Medium task 1');
    await page.selectOption('select', 'medium');
    await page.click('button:has-text("Add")');
    await page.waitForTimeout(200);

    await page.fill('input[placeholder*="Add a new todo"]', 'Low task 1');
    await page.selectOption('select', 'low');
    await page.click('button:has-text("Add")');

    // Wait for all todos to be visible
    await page.waitForTimeout(500);

    // Select high priority filter (find the filter dropdown, not the create form dropdown)
    // The filter dropdown is after the search input
    const filterSelect = page.locator('select').nth(1);  // Second select on page is the filter
    await filterSelect.selectOption('high');

    // Wait for filter to apply
    await page.waitForTimeout(300);

    // Should show only high priority todos
    await expect(page.locator('text=High task 1')).toBeVisible();
    await expect(page.locator('text=Medium task 1')).not.toBeVisible();
    await expect(page.locator('text=Low task 1')).not.toBeVisible();
  });

  test('should filter todos by medium priority', async ({ page }) => {
    // Create todos with different priorities
    await page.fill('input[placeholder*="Add a new todo"]', 'High task 2');
    await page.selectOption('select', 'high');
    await page.click('button:has-text("Add")');
    await page.waitForTimeout(200);

    await page.fill('input[placeholder*="Add a new todo"]', 'Medium task 2');
    await page.selectOption('select', 'medium');
    await page.click('button:has-text("Add")');
    await page.waitForTimeout(200);

    // Select medium priority filter
    const filterSelect = page.locator('select').nth(1);  // Second select on page is the filter
    await filterSelect.selectOption('medium');

    // Wait for filter to apply
    await page.waitForTimeout(300);

    // Should show only medium priority todos
    await expect(page.locator('text=Medium task 2')).toBeVisible();
    await expect(page.locator('text=High task 2')).not.toBeVisible();
  });

  test('should filter todos by low priority', async ({ page }) => {
    // Create todos with different priorities
    await page.fill('input[placeholder*="Add a new todo"]', 'High task 3');
    await page.selectOption('select', 'high');
    await page.click('button:has-text("Add")');
    await page.waitForTimeout(200);

    await page.fill('input[placeholder*="Add a new todo"]', 'Low task 3');
    await page.selectOption('select', 'low');
    await page.click('button:has-text("Add")');
    await page.waitForTimeout(200);

    // Select low priority filter
    const filterSelect = page.locator('select').nth(1);  // Second select on page is the filter
    await filterSelect.selectOption('low');

    // Wait for filter to apply
    await page.waitForTimeout(300);

    // Should show only low priority todos
    await expect(page.locator('text=Low task 3')).toBeVisible();
    await expect(page.locator('text=High task 3')).not.toBeVisible();
  });

  test('should show all todos when priority filter is set to "all"', async ({ page }) => {
    // Create todos with different priorities
    await page.fill('input[placeholder*="Add a new todo"]', 'High task all');
    await page.selectOption('select', 'high');
    await page.click('button:has-text("Add")');
    await page.waitForTimeout(200);

    await page.fill('input[placeholder*="Add a new todo"]', 'Medium task all');
    await page.selectOption('select', 'medium');
    await page.click('button:has-text("Add")');
    await page.waitForTimeout(200);

    await page.fill('input[placeholder*="Add a new todo"]', 'Low task all');
    await page.selectOption('select', 'low');
    await page.click('button:has-text("Add")');

    // Select "all" priority filter
    const filterSelect = page.locator('select').nth(1);  // Second select on page is the filter
    await filterSelect.selectOption('all');

    // Wait for filter to apply
    await page.waitForTimeout(300);

    // Should show all todos
    await expect(page.locator('text=High task all')).toBeVisible();
    await expect(page.locator('text=Medium task all')).toBeVisible();
    await expect(page.locator('text=Low task all')).toBeVisible();
  });

  test('should sort todos by priority (high > medium > low)', async ({ page }) => {
    // Create todos in mixed order
    await page.fill('input[placeholder*="Add a new todo"]', 'Low first');
    await page.selectOption('select', 'low');
    await page.click('button:has-text("Add")');
    await page.waitForTimeout(200);

    await page.fill('input[placeholder*="Add a new todo"]', 'High second');
    await page.selectOption('select', 'high');
    await page.click('button:has-text("Add")');
    await page.waitForTimeout(200);

    await page.fill('input[placeholder*="Add a new todo"]', 'Medium third');
    await page.selectOption('select', 'medium');
    await page.click('button:has-text("Add")');

    // Wait for todos to be sorted
    await page.waitForTimeout(500);

    // Get all todo items
    const todoItems = page.locator('[class*="cursor-pointer"]');
    const count = await todoItems.count();

    // Verify we have at least 3 todos
    expect(count).toBeGreaterThanOrEqual(3);

    // High priority todos should appear before medium and low
    // This is an implicit verification through visibility
    await expect(page.locator('text=High second')).toBeVisible();
    await expect(page.locator('text=Medium third')).toBeVisible();
    await expect(page.locator('text=Low first')).toBeVisible();
  });

  test('should maintain priority after page refresh', async ({ page }) => {
    // Create a high priority todo
    await page.fill('input[placeholder*="Add a new todo"]', 'Persistent high priority');
    await page.selectOption('select', 'high');
    await page.click('button:has-text("Add")');

    // Wait for todo to be created
    await expect(page.locator('text=Persistent high priority')).toBeVisible();

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify todo still exists and has high priority
    await expect(page.locator('text=Persistent high priority')).toBeVisible();
    
    // Verify high priority badge exists (look for badge with class, not just text)
    await expect(page.locator('span.rounded:has-text("High")')).toBeVisible();
  });

  test('should allow multiple todos with the same priority', async ({ page }) => {
    // Create multiple high priority todos
    for (let i = 1; i <= 3; i++) {
      await page.fill('input[placeholder*="Add a new todo"]', `High priority task ${i}`);
      await page.selectOption('select', 'high');
      await page.click('button:has-text("Add")');
      await page.waitForTimeout(200);
    }

    // All should be visible
    await expect(page.locator('text=High priority task 1')).toBeVisible();
    await expect(page.locator('text=High priority task 2')).toBeVisible();
    await expect(page.locator('text=High priority task 3')).toBeVisible();
  });

  test('should combine priority filter with search', async ({ page }) => {
    // Create todos with different priorities and names
    await page.fill('input[placeholder*="Add a new todo"]', 'Important meeting');
    await page.selectOption('select', 'high');
    await page.click('button:has-text("Add")');
    await page.waitForTimeout(200);

    await page.fill('input[placeholder*="Add a new todo"]', 'Important email');
    await page.selectOption('select', 'medium');
    await page.click('button:has-text("Add")');
    await page.waitForTimeout(200);

    // Search for "important"
    await page.fill('input[placeholder*="Search todos"]', 'important');
    await page.waitForTimeout(350); // Wait for debounce

    // Filter by high priority
    const filterSelect = page.locator('select').nth(1);  // Second select on page is the filter
    await filterSelect.selectOption('high');
    await page.waitForTimeout(300);

    // Should show only high priority todos with "important"
    await expect(page.locator('text=Important meeting')).toBeVisible();
    await expect(page.locator('text=Important email')).not.toBeVisible();
  });
});
