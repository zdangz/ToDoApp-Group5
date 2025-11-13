import { test, expect } from '@playwright/test';

test.describe('Subtasks & Progress Tracking', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="text"]', 'testuser-subtasks');
    await page.click('button:has-text("Register")');
    await page.waitForURL('http://localhost:3000/');

    // Create a test todo
    await page.fill('input[placeholder*="Add a new todo"]', 'Project Task');
    await page.fill('input[type="datetime-local"]', '2025-11-20T10:00');
    await page.click('button:has-text("Add")');
    await expect(page.locator('text=Project Task')).toBeVisible();
  });

  test('should expand/collapse subtasks section', async ({ page }) => {
    // Subtasks section should not be visible initially
    await expect(page.locator('text=Add a subtask...')).not.toBeVisible();

    // Click Subtasks button
    await page.click('button:has-text("Subtasks")');

    // Subtasks section should be visible
    await expect(page.locator('text=Add a subtask...')).toBeVisible();
    await expect(page.locator('text=No subtasks yet')).toBeVisible();

    // Click again to collapse
    await page.click('button:has-text("Subtasks")');

    // Should be hidden
    await expect(page.locator('text=Add a subtask...')).not.toBeVisible();
  });

  test('should add a subtask', async ({ page }) => {
    // Expand subtasks
    await page.click('button:has-text("Subtasks")');

    // Add subtask
    await page.fill('input[placeholder*="Add a subtask"]', 'First subtask');
    await page.click('button:has-text("Add")');

    // Verify subtask appears
    await expect(page.locator('text=First subtask')).toBeVisible();
    await expect(page.locator('text=No subtasks yet')).not.toBeVisible();
  });

  test('should add multiple subtasks', async ({ page }) => {
    // Expand subtasks
    await page.click('button:has-text("Subtasks")');

    // Add multiple subtasks
    const subtasks = ['Design mockups', 'Write code', 'Test features', 'Deploy'];
    
    for (const subtask of subtasks) {
      await page.fill('input[placeholder*="Add a subtask"]', subtask);
      await page.click('button:has-text("Add")');
      await expect(page.locator(`text=${subtask}`)).toBeVisible();
    }

    // Verify all subtasks are present
    for (const subtask of subtasks) {
      await expect(page.locator(`text=${subtask}`)).toBeVisible();
    }
  });

  test('should add subtask using Enter key', async ({ page }) => {
    // Expand subtasks
    await page.click('button:has-text("Subtasks")');

    // Add subtask using Enter
    await page.fill('input[placeholder*="Add a subtask"]', 'Quick subtask');
    await page.press('input[placeholder*="Add a subtask"]', 'Enter');

    // Verify subtask appears
    await expect(page.locator('text=Quick subtask')).toBeVisible();
  });

  test('should toggle subtask completion', async ({ page }) => {
    // Expand and add subtask
    await page.click('button:has-text("Subtasks")');
    await page.fill('input[placeholder*="Add a subtask"]', 'Complete me');
    await page.click('button:has-text("Add")');

    // Find subtask checkbox
    const subtaskCheckbox = page.locator('input[type="checkbox"][class*="w-4"]').first();
    
    // Initially unchecked
    await expect(subtaskCheckbox).not.toBeChecked();

    // Check it
    await subtaskCheckbox.check();
    await page.waitForTimeout(500);

    // Should be checked and have strikethrough
    await expect(subtaskCheckbox).toBeChecked();
    const subtaskText = page.locator('text=Complete me').first();
    await expect(subtaskText).toHaveClass(/line-through/);
  });

  test('should show progress bar when subtasks exist', async ({ page }) => {
    // Expand subtasks
    await page.click('button:has-text("Subtasks")');

    // Progress bar should not be visible without subtasks
    await expect(page.locator('text=Progress:')).not.toBeVisible();

    // Add a subtask
    await page.fill('input[placeholder*="Add a subtask"]', 'Task 1');
    await page.click('button:has-text("Add")');

    // Progress bar should appear
    await expect(page.locator('text=Progress: 0/1 completed (0%)')).toBeVisible();
  });

  test('should update progress when toggling subtasks', async ({ page }) => {
    // Expand and add 3 subtasks
    await page.click('button:has-text("Subtasks")');
    
    await page.fill('input[placeholder*="Add a subtask"]', 'Subtask 1');
    await page.click('button:has-text("Add")');
    
    await page.fill('input[placeholder*="Add a subtask"]', 'Subtask 2');
    await page.click('button:has-text("Add")');
    
    await page.fill('input[placeholder*="Add a subtask"]', 'Subtask 3');
    await page.click('button:has-text("Add")');

    // Initial progress
    await expect(page.locator('text=Progress: 0/3 completed (0%)')).toBeVisible();

    // Complete first subtask
    const checkboxes = page.locator('input[type="checkbox"][class*="w-4"]');
    await checkboxes.nth(0).check();
    await page.waitForTimeout(500);

    // Progress should update
    await expect(page.locator('text=Progress: 1/3 completed (33%)')).toBeVisible();

    // Complete second subtask
    await checkboxes.nth(1).check();
    await page.waitForTimeout(500);

    // Progress should update
    await expect(page.locator('text=Progress: 2/3 completed (67%)')).toBeVisible();

    // Complete third subtask
    await checkboxes.nth(2).check();
    await page.waitForTimeout(500);

    // Progress should be 100%
    await expect(page.locator('text=Progress: 3/3 completed (100%)')).toBeVisible();
  });

  test('should show progress bar as green at 100%', async ({ page }) => {
    // Expand and add 2 subtasks
    await page.click('button:has-text("Subtasks")');
    
    await page.fill('input[placeholder*="Add a subtask"]', 'Task A');
    await page.click('button:has-text("Add")');
    
    await page.fill('input[placeholder*="Add a subtask"]', 'Task B');
    await page.click('button:has-text("Add")');

    // Complete both
    const checkboxes = page.locator('input[type="checkbox"][class*="w-4"]');
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();
    await page.waitForTimeout(500);

    // Check progress bar color (green at 100%)
    const progressBar = page.locator('div[style*="width: 100%"]').first();
    const bgColor = await progressBar.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // RGB for #10b981 is approximately rgb(16, 185, 129)
    expect(bgColor).toContain('16'); // Green color
  });

  test('should show progress bar as blue before 100%', async ({ page }) => {
    // Expand and add 2 subtasks
    await page.click('button:has-text("Subtasks")');
    
    await page.fill('input[placeholder*="Add a subtask"]', 'Task A');
    await page.click('button:has-text("Add")');
    
    await page.fill('input[placeholder*="Add a subtask"]', 'Task B');
    await page.click('button:has-text("Add")');

    // Complete only one
    const checkboxes = page.locator('input[type="checkbox"][class*="w-4"]');
    await checkboxes.nth(0).check();
    await page.waitForTimeout(500);

    // Check progress bar color (blue before 100%)
    const progressBar = page.locator('div[style*="width: 50%"]').first();
    const bgColor = await progressBar.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // RGB for #3b82f6 is approximately rgb(59, 130, 246)
    expect(bgColor).toContain('59'); // Blue color
  });

  test('should delete subtask', async ({ page }) => {
    // Expand and add subtask
    await page.click('button:has-text("Subtasks")');
    await page.fill('input[placeholder*="Add a subtask"]', 'Delete this');
    await page.click('button:has-text("Add")');

    // Verify it exists
    await expect(page.locator('text=Delete this')).toBeVisible();

    // Click delete button (×)
    await page.click('button:has-text("×")');

    // Verify it's gone
    await expect(page.locator('text=Delete this')).not.toBeVisible();
    await expect(page.locator('text=No subtasks yet')).toBeVisible();
  });

  test('should show subtask count on todo item', async ({ page }) => {
    // Initially no count
    await expect(page.locator('text=/^0\\/0$/')).not.toBeVisible();

    // Expand and add 3 subtasks
    await page.click('button:has-text("Subtasks")');
    
    for (let i = 1; i <= 3; i++) {
      await page.fill('input[placeholder*="Add a subtask"]', `Task ${i}`);
      await page.click('button:has-text("Add")');
    }

    // Collapse to see count on main item
    await page.click('button:has-text("Subtasks")');

    // Should show 0/3
    await expect(page.locator('text=0/3')).toBeVisible();

    // Expand and complete one
    await page.click('button:has-text("Subtasks")');
    const checkbox = page.locator('input[type="checkbox"][class*="w-4"]').first();
    await checkbox.check();
    await page.waitForTimeout(500);

    // Collapse and check count
    await page.click('button:has-text("Subtasks")');
    await expect(page.locator('text=1/3')).toBeVisible();
  });

  test('should delete todo and cascade to subtasks', async ({ page }) => {
    // Add subtasks
    await page.click('button:has-text("Subtasks")');
    await page.fill('input[placeholder*="Add a subtask"]', 'Will be deleted');
    await page.click('button:has-text("Add")');
    await expect(page.locator('text=Will be deleted')).toBeVisible();

    // Close subtasks panel
    await page.click('button:has-text("Subtasks")');

    // Delete the todo
    page.once('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Delete")');

    // Wait for deletion
    await page.waitForTimeout(500);

    // Todo should be gone
    await expect(page.locator('text=Project Task')).not.toBeVisible();

    // If we create a new todo and expand subtasks, the old subtask shouldn't be there
    await page.fill('input[placeholder*="Add a new todo"]', 'New Task');
    await page.click('button:has-text("Add")');
    await page.click('button:has-text("Subtasks")');
    await expect(page.locator('text=Will be deleted')).not.toBeVisible();
    await expect(page.locator('text=No subtasks yet')).toBeVisible();
  });

  test('should show dashboard statistics', async ({ page }) => {
    // Dashboard should be visible with pending count
    await expect(page.locator('text=Pending').first()).toBeVisible();
    await expect(page.locator('text=Overdue').first()).toBeVisible();
    await expect(page.locator('text=Completed').first()).toBeVisible();

    // Initially: 1 pending (created in beforeEach), 0 overdue, 0 completed
    const pendingCount = page.locator('text=Pending').first().locator('..').locator('div').first();
    await expect(pendingCount).toHaveText('1');
  });

  test('should update dashboard when completing todo', async ({ page }) => {
    // Initial state: 1 pending, 0 completed
    let pendingDiv = page.locator('text=Pending').locator('..').locator('div[class*="text-4xl"]');
    let completedDiv = page.locator('text=Completed').locator('..').locator('div[class*="text-4xl"]');
    
    await expect(pendingDiv).toHaveText('1');
    await expect(completedDiv).toHaveText('0');

    // Complete the todo
    const todoCheckbox = page.locator('input[type="checkbox"][class*="w-5"]').first();
    await todoCheckbox.check();
    await page.waitForTimeout(500);

    // Should update: 0 pending, 1 completed
    await expect(pendingDiv).toHaveText('0');
    await expect(completedDiv).toHaveText('1');
  });

  test('should show overdue count for past due dates', async ({ page }) => {
    // Create an overdue todo (past date)
    await page.fill('input[placeholder*="Add a new todo"]', 'Overdue Task');
    await page.fill('input[type="datetime-local"]', '2025-11-01T10:00');
    await page.click('button:has-text("Add")');

    // Dashboard should show 1 overdue
    const overdueDiv = page.locator('text=Overdue').locator('..').locator('div[class*="text-4xl"]');
    await expect(overdueDiv).toHaveText('1');
  });

  test('should persist subtasks after page reload', async ({ page }) => {
    // Add subtasks
    await page.click('button:has-text("Subtasks")');
    await page.fill('input[placeholder*="Add a subtask"]', 'Persistent subtask');
    await page.click('button:has-text("Add")');
    await expect(page.locator('text=Persistent subtask')).toBeVisible();

    // Reload page
    await page.reload();

    // Expand subtasks again
    await page.click('button:has-text("Subtasks")');

    // Subtask should still be there
    await expect(page.locator('text=Persistent subtask')).toBeVisible();
  });
});
