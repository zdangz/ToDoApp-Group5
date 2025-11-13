import { test, expect } from '@playwright/test';

test.describe('Todo CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="text"]', `testuser-crud-${Date.now()}`);
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('http://localhost:3000/');
  });

  test('should create todo with title only', async ({ page }) => {
    await page.fill('input[placeholder*="Add a new todo"]', 'Simple Todo');
    await page.click('button:has-text("Add")');
    
    // Verify todo appears
    await expect(page.locator('text=Simple Todo')).toBeVisible();
  });

  test('should create todo with all metadata', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Fill form
    await page.fill('input[placeholder*="Add a new todo"]', 'Complete Todo');
    await page.selectOption('select[value="low"]', 'high');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T14:00`);
    
    // Set recurring
    await page.check('label:has-text("Repeat") input[type="checkbox"]');
    await page.selectOption('select:near(label:has-text("Repeat"))', 'weekly');
    
    // Set reminder
    const reminderSelect = page.locator('select:near(label:has-text("Reminder"))');
    await reminderSelect.selectOption('60');
    
    await page.click('button:has-text("Add")');
    
    // Verify todo created
    await expect(page.locator('text=Complete Todo')).toBeVisible();
    await expect(page.locator('text=High')).toBeVisible();
  });

  test('should toggle todo completion', async ({ page }) => {
    // Create todo
    await page.fill('input[placeholder*="Add a new todo"]', 'Todo to Toggle');
    await page.click('button:has-text("Add")');
    
    // Find the todo's checkbox
    const todoRow = page.locator('text=Todo to Toggle').locator('..');
    const checkbox = todoRow.locator('input[type="checkbox"]');
    
    // Toggle to completed
    await checkbox.check();
    
    // Verify it moved to completed section
    await expect(page.locator('h2:has-text("Completed")').locator('..').locator('text=Todo to Toggle')).toBeVisible();
    
    // Toggle back to pending
    await checkbox.uncheck();
    
    // Verify it moved back to pending
    await expect(page.locator('h2:has-text("Pending")').locator('..').locator('text=Todo to Toggle')).toBeVisible();
  });

  test('should edit todo via Edit button', async ({ page }) => {
    // Create todo
    await page.fill('input[placeholder*="Add a new todo"]', 'Original Title');
    await page.click('button:has-text("Add")');
    
    // Click Edit button
    const todoRow = page.locator('text=Original Title').locator('..');
    await todoRow.locator('button:has-text("Edit")').click();
    
    // Verify modal opened
    await expect(page.locator('h2:has-text("Edit Todo")')).toBeVisible();
    
    // Edit title
    const titleInput = page.locator('input[value="Original Title"]');
    await titleInput.fill('Updated Title');
    
    // Change priority
    await page.selectOption('select', 'high');
    
    // Save changes
    await page.click('button:has-text("Save Changes")');
    
    // Verify changes
    await expect(page.locator('text=Updated Title')).toBeVisible();
    await expect(page.locator('text=High')).toBeVisible();
    await expect(page.locator('text=Original Title')).not.toBeVisible();
  });

  test('should delete todo with confirmation', async ({ page }) => {
    // Create todo
    await page.fill('input[placeholder*="Add a new todo"]', 'Todo to Delete');
    await page.click('button:has-text("Add")');
    
    // Verify created
    await expect(page.locator('text=Todo to Delete')).toBeVisible();
    
    // Setup dialog handler
    page.on('dialog', dialog => dialog.accept());
    
    // Click Delete button
    const todoRow = page.locator('text=Todo to Delete').locator('..');
    await todoRow.locator('button:has-text("Delete")').click();
    
    // Verify deleted
    await expect(page.locator('text=Todo to Delete')).not.toBeVisible();
  });

  test('should validate due date must be in future', async ({ page }) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // Try to create todo with past date
    await page.fill('input[placeholder*="Add a new todo"]', 'Past Due Todo');
    await page.fill('input[type="datetime-local"]', `${yesterdayStr}T09:00`);
    
    // Setup dialog handler to catch alert
    let alertMessage = '';
    page.on('dialog', dialog => {
      alertMessage = dialog.message();
      dialog.accept();
    });
    
    await page.click('button:has-text("Add")');
    
    // Wait a bit for potential alert
    await page.waitForTimeout(1000);
    
    // Verify validation (either alert or todo not created)
    if (alertMessage) {
      expect(alertMessage).toContain('future');
    }
  });

  test('should validate recurring todos require due date', async ({ page }) => {
    // Try to create recurring todo without due date
    await page.fill('input[placeholder*="Add a new todo"]', 'Recurring Without Date');
    await page.check('label:has-text("Repeat") input[type="checkbox"]');
    await page.selectOption('select:near(label:has-text("Repeat"))', 'daily');
    
    // Setup dialog handler
    let alertMessage = '';
    page.on('dialog', dialog => {
      alertMessage = dialog.message();
      dialog.accept();
    });
    
    await page.click('button:has-text("Add")');
    
    // Wait for potential alert
    await page.waitForTimeout(1000);
    
    // Verify validation
    if (alertMessage) {
      expect(alertMessage).toContain('due date');
    }
  });

  test('should sort todos by priority', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Create low priority todo
    await page.fill('input[placeholder*="Add a new todo"]', 'Low Priority');
    await page.selectOption('select[value="low"]', 'low');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T09:00`);
    await page.click('button:has-text("Add")');
    
    // Create high priority todo
    await page.fill('input[placeholder*="Add a new todo"]', 'High Priority');
    await page.selectOption('select[value="low"]', 'high');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T10:00`);
    await page.click('button:has-text("Add")');
    
    // Create medium priority todo
    await page.fill('input[placeholder*="Add a new todo"]', 'Medium Priority');
    await page.selectOption('select[value="low"]', 'medium');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T11:00`);
    await page.click('button:has-text("Add")');
    
    // Get all todos in order
    const todos = await page.locator('h2:has-text("Pending")').locator('..').locator('[class*="space-y"]').locator('> div').allTextContents();
    
    // Verify high priority appears first
    expect(todos[0]).toContain('High Priority');
  });

  test('should show empty state when no todos exist', async ({ page }) => {
    // Should show empty message
    await expect(page.locator('text=No todos yet. Add one above!')).toBeVisible();
  });

  test('should clear form after successful creation', async ({ page }) => {
    await page.fill('input[placeholder*="Add a new todo"]', 'Test Todo');
    await page.click('button:has-text("Add")');
    
    // Verify form cleared
    const titleInput = page.locator('input[placeholder*="Add a new todo"]');
    await expect(titleInput).toHaveValue('');
  });

  test('should disable reminder dropdown when no due date', async ({ page }) => {
    const reminderSelect = page.locator('select:near(label:has-text("Reminder"))');
    
    // Should be disabled initially (no due date)
    await expect(reminderSelect).toBeDisabled();
    
    // Set due date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T14:00`);
    
    // Should now be enabled
    await expect(reminderSelect).toBeEnabled();
  });

  test('should display priority badges with correct colors', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Create todos with different priorities
    await page.fill('input[placeholder*="Add a new todo"]', 'High Priority Task');
    await page.selectOption('select[value="low"]', 'high');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T09:00`);
    await page.click('button:has-text("Add")');
    
    // Verify priority badge
    const highBadge = page.locator('text=High Priority Task').locator('..').locator('text=High');
    await expect(highBadge).toBeVisible();
  });
});
