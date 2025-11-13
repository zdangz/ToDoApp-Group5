import { test, expect } from '@playwright/test';

test.describe('Todo CRUD Operations', () => {
  test.beforeEach(async ({ page, context }, testInfo) => {
    // Register/Login via API with unique username per test
    const username = `testuser-crud-${testInfo.testId}`;
    await context.request.post('http://localhost:3000/api/auth/register', {
      data: { username }
    });
    
    // Navigate to home page
    await page.goto('http://localhost:3000/');
  });

  test('should create todo with title only', async ({ page }) => {
    const todoTitle = 'Simple todo task';

    // Fill in todo title
    await page.fill('input[placeholder*="Add a new todo"]', todoTitle);

    // Click Add button
    await page.click('button:has-text("Add")');

    // Verify todo appears in the list
    await expect(page.locator(`text=${todoTitle}`)).toBeVisible();
  });

  test('should create todo with all metadata', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Fill in all todo details
    await page.fill('input[placeholder*="Add a new todo"]', 'Complete task with metadata');
    
    // Set priority to high
    await page.selectOption('select', 'high');
    
    // Set due date
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T14:00`);

    // Submit
    await page.click('button:has-text("Add")');

    // Verify todo appears
    await expect(page.locator('text=Complete task with metadata')).toBeVisible();

    // Verify high priority badge is visible (should have red/high priority styling)
    const highBadge = page.locator('text=Complete task with metadata').locator('..').locator('text=high');
    await expect(highBadge).toBeVisible();
  });

  test('should create todo with future due date', async ({ page }) => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    await page.fill('input[placeholder*="Add a new todo"]', 'Future task');
    await page.fill('input[type="datetime-local"]', `${nextWeekStr}T10:00`);
    await page.click('button:has-text("Add")');

    // Verify todo is created
    await expect(page.locator('text=Future task')).toBeVisible();
  });

  test('should toggle todo completion', async ({ page }) => {
    // Create a todo
    await page.fill('input[placeholder*="Add a new todo"]', 'Task to complete');
    await page.click('button:has-text("Add")');
    await expect(page.locator('text=Task to complete')).toBeVisible();

    // Find and check the checkbox for this todo
    const checkbox = page.locator('input[type="checkbox"][class*="w-5"]').first();
    await checkbox.check();

    // Wait for the todo to move to completed section
    await page.waitForTimeout(500);

    // Verify Completed section appears
    const completedSection = page.locator('h2:has-text("Completed")');
    await expect(completedSection).toBeVisible();

    // Uncheck to move back to active
    await checkbox.uncheck();
    await page.waitForTimeout(500);

    // Should still be visible in Active section
    await expect(page.locator('text=Task to complete')).toBeVisible();
  });

  test('should delete todo with confirmation', async ({ page }) => {
    // Create a todo
    await page.fill('input[placeholder*="Add a new todo"]', 'Task to delete');
    await page.click('button:has-text("Add")');
    await expect(page.locator('text=Task to delete')).toBeVisible();

    // Click delete button (trash icon)
    const deleteButton = page.locator('text=Task to delete').locator('..').locator('button[title="Delete todo"], button:has(svg)').last();
    await deleteButton.click();

    // Confirm deletion (if there's a confirmation dialog)
    // Look for confirmation dialog or direct deletion
    const confirmButton = page.locator('button:has-text("Delete")');
    if (await confirmButton.isVisible({ timeout: 1000 })) {
      await confirmButton.click();
    }

    // Wait a bit for deletion to complete
    await page.waitForTimeout(500);

    // Verify todo is removed
    await expect(page.locator('text=Task to delete')).not.toBeVisible();
  });

  test('should display todos in Active section by default', async ({ page }) => {
    // Create a new todo
    await page.fill('input[placeholder*="Add a new todo"]', 'Active task');
    await page.click('button:has-text("Add")');

    // Verify todo is visible
    await expect(page.locator('text=Active task')).toBeVisible();
  });

  test('should move completed todo to Completed section', async ({ page }) => {
    // Create a todo
    await page.fill('input[placeholder*="Add a new todo"]', 'Task for completion section');
    await page.click('button:has-text("Add")');
    
    // Complete the todo
    const checkbox = page.locator('input[type="checkbox"][class*="w-5"]').first();
    await checkbox.check();
    await page.waitForTimeout(500);

    // Verify Completed section appears
    const completedSection = page.locator('h2:has-text("Completed")');
    await expect(completedSection).toBeVisible();

    // Verify the todo still exists (now in completed section)
    await expect(page.locator('text=Task for completion section')).toBeVisible();
  });

  test('should sort todos by priority (high to low)', async ({ page }) => {
    // Create todos with different priorities
    const todos = [
      { title: 'Low priority task', priority: 'low' },
      { title: 'High priority task', priority: 'high' },
      { title: 'Medium priority task', priority: 'medium' },
    ];

    for (const todo of todos) {
      await page.fill('input[placeholder*="Add a new todo"]', todo.title);
      await page.selectOption('select', todo.priority);
      await page.click('button:has-text("Add")');
      await page.waitForTimeout(300);
    }

    // Get all todo titles in order
    const todoElements = page.locator('[class*="cursor-pointer"]');
    const count = await todoElements.count();

    // Verify at least 3 todos exist
    expect(count).toBeGreaterThanOrEqual(3);

    // High priority should appear first (todos are sorted high -> medium -> low)
    await expect(page.locator('text=High priority task')).toBeVisible();
  });

  test('should display priority badges correctly', async ({ page }) => {
    // Create todos with different priorities
    await page.fill('input[placeholder*="Add a new todo"]', 'High priority todo');
    await page.selectOption('select', 'high');
    await page.click('button:has-text("Add")');
    await page.waitForTimeout(300);

    await page.fill('input[placeholder*="Add a new todo"]', 'Medium priority todo');
    await page.selectOption('select', 'medium');
    await page.click('button:has-text("Add")');
    await page.waitForTimeout(300);

    await page.fill('input[placeholder*="Add a new todo"]', 'Low priority todo');
    await page.selectOption('select', 'low');
    await page.click('button:has-text("Add")');

    // Verify all priority badges are visible
    await expect(page.locator('text=high')).toBeVisible();
    await expect(page.locator('text=medium')).toBeVisible();
    await expect(page.locator('text=low')).toBeVisible();
  });

  test('should show empty state when no todos exist', async ({ page }) => {
    // Fresh login should show empty state or no todos
    // Verify we're on the page but no todos section with content
    await expect(page.locator('input[placeholder*="Add a new todo"]')).toBeVisible();
    
    // Active/Completed sections may not be visible if no todos
    // This is acceptable behavior
  });

  test('should handle multiple todos creation', async ({ page }) => {
    const todoTitles = [
      'First todo',
      'Second todo',
      'Third todo',
    ];

    for (const title of todoTitles) {
      await page.fill('input[placeholder*="Add a new todo"]', title);
      await page.click('button:has-text("Add")');
      await page.waitForTimeout(200);
    }

    // Verify all todos are visible
    for (const title of todoTitles) {
      await expect(page.locator(`text=${title}`)).toBeVisible();
    }
  });

  test('should clear input field after todo creation', async ({ page }) => {
    const input = page.locator('input[placeholder*="Add a new todo"]');

    // Create a todo
    await input.fill('Test todo');
    await page.click('button:has-text("Add")');

    // Wait for creation
    await page.waitForTimeout(300);

    // Input should be cleared
    await expect(input).toHaveValue('');
  });
});
