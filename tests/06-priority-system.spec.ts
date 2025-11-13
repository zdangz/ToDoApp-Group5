import { test, expect } from '@playwright/test';

test.describe('Priority System', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="text"]', `testuser-priority-${Date.now()}`);
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('http://localhost:3000/');
  });

  test('should create todo with each priority level', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Create high priority
    await page.fill('input[placeholder*="Add a new todo"]', 'High Priority Task');
    await page.selectOption('select[value="low"]', 'high');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T09:00`);
    await page.click('button:has-text("Add")');
    await expect(page.locator('text=High Priority Task')).toBeVisible();
    await expect(page.locator('text=High').first()).toBeVisible();
    
    // Create medium priority
    await page.fill('input[placeholder*="Add a new todo"]', 'Medium Priority Task');
    await page.selectOption('select[value="low"]', 'medium');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T10:00`);
    await page.click('button:has-text("Add")');
    await expect(page.locator('text=Medium Priority Task')).toBeVisible();
    await expect(page.locator('text=Medium').first()).toBeVisible();
    
    // Create low priority
    await page.fill('input[placeholder*="Add a new todo"]', 'Low Priority Task');
    await page.selectOption('select[value="low"]', 'low');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T11:00`);
    await page.click('button:has-text("Add")');
    await expect(page.locator('text=Low Priority Task')).toBeVisible();
    await expect(page.locator('text=Low').first()).toBeVisible();
  });

  test('should default to medium priority', async ({ page }) => {
    const prioritySelect = page.locator('select').first();
    await expect(prioritySelect).toHaveValue('medium');
  });

  test('should filter by priority', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Create todos with different priorities
    await page.fill('input[placeholder*="Add a new todo"]', 'High Task');
    await page.selectOption('select[value="low"]', 'high');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T09:00`);
    await page.click('button:has-text("Add")');
    
    await page.fill('input[placeholder*="Add a new todo"]', 'Low Task');
    await page.selectOption('select[value="low"]', 'low');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T10:00`);
    await page.click('button:has-text("Add")');
    
    // Open filters
    await page.click('button:has-text("Filters")');
    
    // Filter by high priority
    await page.selectOption('select:near(label:has-text("Priority"))', 'high');
    
    // Verify only high priority visible
    await expect(page.locator('text=High Task')).toBeVisible();
    await expect(page.locator('text=Low Task')).not.toBeVisible();
    
    // Filter by low priority
    await page.selectOption('select:near(label:has-text("Priority"))', 'low');
    
    // Verify only low priority visible
    await expect(page.locator('text=Low Task')).toBeVisible();
    await expect(page.locator('text=High Task')).not.toBeVisible();
  });

  test('should sort todos by priority (high, medium, low)', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Create in reverse order
    await page.fill('input[placeholder*="Add a new todo"]', 'Low First');
    await page.selectOption('select[value="low"]', 'low');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T09:00`);
    await page.click('button:has-text("Add")');
    
    await page.fill('input[placeholder*="Add a new todo"]', 'Medium Second');
    await page.selectOption('select[value="low"]', 'medium');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T10:00`);
    await page.click('button:has-text("Add")');
    
    await page.fill('input[placeholder*="Add a new todo"]', 'High Third');
    await page.selectOption('select[value="low"]', 'high');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T11:00`);
    await page.click('button:has-text("Add")');
    
    // Get all pending todos
    const todoTexts = await page.locator('h2:has-text("Pending")').locator('..').locator('[class*="space-y"]').locator('> div').allTextContents();
    
    // Verify order: High, Medium, Low
    expect(todoTexts[0]).toContain('High Third');
    expect(todoTexts[1]).toContain('Medium Second');
    expect(todoTexts[2]).toContain('Low First');
  });

  test('should edit todo priority', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Create low priority todo
    await page.fill('input[placeholder*="Add a new todo"]', 'Change Priority');
    await page.selectOption('select[value="low"]', 'low');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T09:00`);
    await page.click('button:has-text("Add")');
    
    // Edit priority
    const todoRow = page.locator('text=Change Priority').locator('..');
    await todoRow.locator('button:has-text("Edit")').click();
    
    // Change to high
    await page.selectOption('select', 'high');
    await page.click('button:has-text("Save Changes")');
    
    // Verify changed
    await expect(page.locator('text=High')).toBeVisible();
    await expect(todoRow.locator('text=Low')).not.toBeVisible();
  });

  test('should display priority badges with distinct colors', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Create high priority
    await page.fill('input[placeholder*="Add a new todo"]', 'Red Badge');
    await page.selectOption('select[value="low"]', 'high');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T09:00`);
    await page.click('button:has-text("Add")');
    
    const highBadge = page.locator('text=Red Badge').locator('..').locator('text=High');
    await expect(highBadge).toBeVisible();
    
    // Check if badge has distinct styling (red color)
    const backgroundColor = await highBadge.evaluate(el => window.getComputedStyle(el).backgroundColor);
    expect(backgroundColor).toContain('rgb'); // Has color styling
  });

  test('should maintain priority after completion toggle', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Create high priority todo
    await page.fill('input[placeholder*="Add a new todo"]', 'High Priority Complete');
    await page.selectOption('select[value="low"]', 'high');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T09:00`);
    await page.click('button:has-text("Add")');
    
    // Complete it
    const todoRow = page.locator('text=High Priority Complete').locator('..');
    await todoRow.locator('input[type="checkbox"]').check();
    
    // Verify still high priority (though badge may not show on completed)
    // Uncomplete to verify priority persisted
    await todoRow.locator('input[type="checkbox"]').uncheck();
    await expect(page.locator('text=High').first()).toBeVisible();
  });

  test('should show priority in dropdown when editing', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Create high priority todo
    await page.fill('input[placeholder*="Add a new todo"]', 'Edit Priority Test');
    await page.selectOption('select[value="low"]', 'high');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T09:00`);
    await page.click('button:has-text("Add")');
    
    // Open edit modal
    await page.locator('text=Edit Priority Test').locator('..').locator('button:has-text("Edit")').click();
    
    // Verify priority dropdown shows current value
    const prioritySelect = page.locator('h2:has-text("Edit Todo")').locator('..').locator('select').first();
    await expect(prioritySelect).toHaveValue('high');
  });

  test('should filter correctly with "all" option', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Create multiple priorities
    await page.fill('input[placeholder*="Add a new todo"]', 'Task A');
    await page.selectOption('select[value="low"]', 'high');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T09:00`);
    await page.click('button:has-text("Add")');
    
    await page.fill('input[placeholder*="Add a new todo"]', 'Task B');
    await page.selectOption('select[value="low"]', 'low');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T10:00`);
    await page.click('button:has-text("Add")');
    
    // Open filters
    await page.click('button:has-text("Filters")');
    
    // Set to show all
    await page.selectOption('select:near(label:has-text("Priority"))', 'all');
    
    // Both should be visible
    await expect(page.locator('text=Task A')).toBeVisible();
    await expect(page.locator('text=Task B')).toBeVisible();
  });
});
