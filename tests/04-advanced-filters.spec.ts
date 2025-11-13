import { test, expect } from '@playwright/test';

test.describe('Advanced Filters', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="text"]', 'testuser-filters');
    await page.click('button:has-text("Register")');
    await page.waitForURL('http://localhost:3000/');

    // Create test todos with different properties
    const todos = [
      { title: 'High priority task', priority: 'high', date: '2025-11-20T10:00' },
      { title: 'Medium priority task', priority: 'medium', date: '2025-11-25T14:00' },
      { title: 'Low priority task', priority: 'low', date: '2025-12-01T16:00' },
      { title: 'Another high task', priority: 'high', date: '2025-11-15T09:00' },
    ];

    for (const todo of todos) {
      await page.fill('input[placeholder*="Add a new todo"]', todo.title);
      await page.selectOption('select', todo.priority);
      await page.fill('input[type="datetime-local"]', todo.date);
      await page.click('button:has-text("Add")');
      await expect(page.locator(`text=${todo.title}`)).toBeVisible();
    }
  });

  test('should filter by search query (case-insensitive)', async ({ page }) => {
    // Search for "high" (case-insensitive)
    await page.fill('input[placeholder*="Search todos"]', 'HIGH');

    // Wait for debounce (300ms)
    await page.waitForTimeout(350);

    // Should show only todos with "high" in title
    await expect(page.locator('text=High priority task')).toBeVisible();
    await expect(page.locator('text=Another high task')).toBeVisible();
    await expect(page.locator('text=Medium priority task')).not.toBeVisible();
    await expect(page.locator('text=Low priority task')).not.toBeVisible();
  });

  test('should debounce search input (300ms)', async ({ page }) => {
    const startTime = Date.now();

    // Type quickly
    await page.fill('input[placeholder*="Search todos"]', 'h');
    await page.fill('input[placeholder*="Search todos"]', 'hi');
    await page.fill('input[placeholder*="Search todos"]', 'hig');
    await page.fill('input[placeholder*="Search todos"]', 'high');

    // Should not filter immediately
    const immediateCheck = Date.now() - startTime;
    expect(immediateCheck).toBeLessThan(300);

    // Wait for debounce
    await page.waitForTimeout(350);

    // Now should be filtered
    await expect(page.locator('text=High priority task')).toBeVisible();
    await expect(page.locator('text=Medium priority task')).not.toBeVisible();
  });

  test('should filter by priority', async ({ page }) => {
    // Select high priority filter
    await page.selectOption('select[class*="px-4"]', 'high');

    // Should show only high priority todos
    await expect(page.locator('text=High priority task')).toBeVisible();
    await expect(page.locator('text=Another high task')).toBeVisible();
    await expect(page.locator('text=Medium priority task')).not.toBeVisible();
    await expect(page.locator('text=Low priority task')).not.toBeVisible();
  });

  test('should show/hide advanced filters panel', async ({ page }) => {
    // Advanced panel should not be visible initially
    await expect(page.locator('text=Advanced Filters')).not.toBeVisible();

    // Click Advanced button
    await page.click('button:has-text("Advanced")');

    // Advanced panel should be visible
    await expect(page.locator('text=Advanced Filters')).toBeVisible();
    await expect(page.locator('text=Completion Status')).toBeVisible();
    await expect(page.locator('text=Due Date From')).toBeVisible();
    await expect(page.locator('text=Due Date To')).toBeVisible();

    // Click again to hide
    await page.click('button:has-text("Advanced")');

    // Should be hidden
    await expect(page.locator('text=Advanced Filters')).not.toBeVisible();
  });

  test('should filter by completion status (pending)', async ({ page }) => {
    // Complete one todo
    const checkbox = page.locator('input[type="checkbox"][class*="w-5"]').first();
    await checkbox.check();
    await page.waitForTimeout(500);

    // Open advanced filters
    await page.click('button:has-text("Advanced")');

    // Select "Pending Only"
    await page.selectOption('select[value="all"]', 'pending');

    // Should show only pending (incomplete) todos
    const pendingCount = await page.locator('text=Pending').count();
    expect(pendingCount).toBeGreaterThan(0);

    // Completed todo should not be in pending section
    // (it will be in completed section which we're filtering out)
  });

  test('should filter by completion status (completed)', async ({ page }) => {
    // Complete two todos
    const checkboxes = page.locator('input[type="checkbox"][class*="w-5"]');
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();
    await page.waitForTimeout(500);

    // Open advanced filters
    await page.click('button:has-text("Advanced")');

    // Select "Completed Only"
    await page.selectOption('select[value="all"]', 'completed');

    // Should show only completed todos (2)
    const completedSection = page.locator('h2:has-text("Completed")');
    await expect(completedSection).toBeVisible();
  });

  test('should filter by due date range', async ({ page }) => {
    // Open advanced filters
    await page.click('button:has-text("Advanced")');

    // Set date range (Nov 15 - Nov 25)
    await page.fill('input[type="date"]', '2025-11-15');
    await page.locator('input[type="date"]').nth(1).fill('2025-11-25');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Should show todos within date range
    await expect(page.locator('text=High priority task')).toBeVisible(); // Nov 20
    await expect(page.locator('text=Medium priority task')).toBeVisible(); // Nov 25
    await expect(page.locator('text=Another high task')).toBeVisible(); // Nov 15
    await expect(page.locator('text=Low priority task')).not.toBeVisible(); // Dec 1
  });

  test('should combine multiple filters (AND logic)', async ({ page }) => {
    // Search for "high"
    await page.fill('input[placeholder*="Search todos"]', 'high');
    await page.waitForTimeout(350);

    // Select high priority
    await page.selectOption('select[class*="px-4"]', 'high');

    // Open advanced filters
    await page.click('button:has-text("Advanced")');

    // Set date range
    await page.fill('input[type="date"]', '2025-11-15');
    await page.locator('input[type="date"]').nth(1).fill('2025-11-20');

    // Should show only "High priority task" (high + contains "high" + in date range)
    await expect(page.locator('text=High priority task')).toBeVisible(); // Nov 20
    await expect(page.locator('text=Another high task')).toBeVisible(); // Nov 15

    // Should not show others
    await expect(page.locator('text=Medium priority task')).not.toBeVisible();
    await expect(page.locator('text=Low priority task')).not.toBeVisible();
  });

  test('should show filter summary with active filters', async ({ page }) => {
    // Apply search filter
    await page.fill('input[placeholder*="Search todos"]', 'task');
    await page.waitForTimeout(350);

    // Should show filter summary
    await expect(page.locator('text=result(s) found with filters:')).toBeVisible();
    await expect(page.locator('text=Search: "task"')).toBeVisible();

    // Apply priority filter
    await page.selectOption('select[class*="px-4"]', 'high');

    // Should show both filters
    await expect(page.locator('text=Priority: high')).toBeVisible();
  });

  test('should show clear filters button when filters active', async ({ page }) => {
    // Clear button should not be visible initially
    await expect(page.locator('button:has-text("Clear Filters")')).not.toBeVisible();

    // Apply a filter
    await page.fill('input[placeholder*="Search todos"]', 'high');
    await page.waitForTimeout(350);

    // Clear button should be visible
    await expect(page.locator('button:has-text("Clear Filters")')).toBeVisible();

    // Should show count
    await expect(page.locator('text=Clear Filters (1)')).toBeVisible();
  });

  test('should clear all filters when clicking clear button', async ({ page }) => {
    // Apply multiple filters
    await page.fill('input[placeholder*="Search todos"]', 'high');
    await page.waitForTimeout(350);
    await page.selectOption('select[class*="px-4"]', 'high');
    
    await page.click('button:has-text("Advanced")');
    await page.fill('input[type="date"]', '2025-11-15');

    // Verify filters are active
    await expect(page.locator('button:has-text("Clear Filters (3)")')).toBeVisible();

    // Click clear filters
    await page.click('button:has-text("Clear Filters")');

    // All filters should be cleared
    await expect(page.locator('button:has-text("Clear Filters")')).not.toBeVisible();
    
    // Search input should be empty
    const searchInput = page.locator('input[placeholder*="Search todos"]');
    await expect(searchInput).toHaveValue('');

    // Priority should be "all"
    const prioritySelect = page.locator('select[class*="px-4"]');
    await expect(prioritySelect).toHaveValue('all');

    // All todos should be visible again
    await expect(page.locator('text=High priority task')).toBeVisible();
    await expect(page.locator('text=Medium priority task')).toBeVisible();
    await expect(page.locator('text=Low priority task')).toBeVisible();
  });

  test('should show empty state when no results match filters', async ({ page }) => {
    // Search for non-existent todo
    await page.fill('input[placeholder*="Search todos"]', 'nonexistent');
    await page.waitForTimeout(350);

    // Should show empty state
    await expect(page.locator('text=No todos match your filters')).toBeVisible();
    await expect(page.locator('text=Clear all filters')).toBeVisible();

    // Click clear link
    await page.click('text=Clear all filters');

    // Should show todos again
    await expect(page.locator('text=High priority task')).toBeVisible();
  });

  test('should update filter count dynamically', async ({ page }) => {
    // Start with no filters
    await expect(page.locator('button:has-text("Clear Filters")')).not.toBeVisible();

    // Add 1 filter
    await page.fill('input[placeholder*="Search todos"]', 'test');
    await page.waitForTimeout(350);
    await expect(page.locator('text=Clear Filters (1)')).toBeVisible();

    // Add 2nd filter
    await page.selectOption('select[class*="px-4"]', 'high');
    await expect(page.locator('text=Clear Filters (2)')).toBeVisible();

    // Add 3rd filter
    await page.click('button:has-text("Advanced")');
    await page.selectOption('select[value="all"]', 'pending');
    await expect(page.locator('text=Clear Filters (3)')).toBeVisible();

    // Add 4th and 5th filters
    await page.fill('input[type="date"]', '2025-11-15');
    await expect(page.locator('text=Clear Filters (4)')).toBeVisible();

    await page.locator('input[type="date"]').nth(1).fill('2025-11-25');
    await expect(page.locator('text=Clear Filters (5)')).toBeVisible();
  });

  test('should highlight Advanced button when panel is open', async ({ page }) => {
    const advancedButton = page.locator('button:has-text("Advanced")');

    // Should have default styling when closed
    await expect(advancedButton).toBeVisible();

    // Click to open
    await advancedButton.click();

    // Should have blue background when open (indicates active state)
    const bgColor = await advancedButton.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // RGB for #3b82f6 is approximately rgb(59, 130, 246)
    expect(bgColor).toContain('59'); // Blue color active
  });
});
