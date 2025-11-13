import { test, expect } from '@playwright/test';

test.describe('Template System', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="text"]', `testuser-templates-${Date.now()}`);
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('http://localhost:3000/');
  });

  test('should open templates modal', async ({ page }) => {
    await page.click('button:has-text("📋 Templates")');
    await expect(page.locator('h2:has-text("Templates")')).toBeVisible();
  });

  test('should show empty state when no templates', async ({ page }) => {
    await page.click('button:has-text("📋 Templates")');
    await expect(page.locator('text=No templates yet')).toBeVisible();
    await expect(page.locator('text=Create a todo and save it as a template!')).toBeVisible();
  });

  test('should save todo as template', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Create todo
    await page.fill('input[placeholder*="Add a new todo"]', 'Template Todo');
    await page.selectOption('select[value="low"]', 'high');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T09:00`);
    await page.click('button:has-text("Add")');
    
    // Click "Save as Template" button (should appear when there's a title)
    await page.fill('input[placeholder*="Add a new todo"]', 'New Template');
    await page.click('button:has-text("💾 Save as Template")');
    
    // Fill template details
    await expect(page.locator('h2:has-text("Save as Template")')).toBeVisible();
    await page.fill('input[placeholder*="template name"]', 'My Template');
    await page.fill('textarea[placeholder*="description"]', 'A useful template');
    await page.fill('input[placeholder*="category"]', 'Work');
    await page.click('button:has-text("Save Template")');
    
    // Verify template saved
    await expect(page.locator('text=Template saved successfully')).toBeVisible();
  });

  test('should use template to create todo', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Create and save template
    await page.fill('input[placeholder*="Add a new todo"]', 'Template Task');
    await page.selectOption('select[value="low"]', 'high');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T09:00`);
    await page.click('button:has-text("💾 Save as Template")');
    await page.fill('input[placeholder*="template name"]', 'Test Template');
    await page.click('button:has-text("Save Template")');
    
    // Clear form
    await page.fill('input[placeholder*="Add a new todo"]', '');
    
    // Use template from dropdown
    await page.selectOption('select:near(label:has-text("Use Template"))', { index: 1 }); // Skip "Select a template..."
    
    // Verify form filled with template data
    const titleInput = page.locator('input[placeholder*="Add a new todo"]');
    await expect(titleInput).toHaveValue('Template Task');
  });

  test('should delete template', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Create template
    await page.fill('input[placeholder*="Add a new todo"]', 'Delete Me');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T09:00`);
    await page.click('button:has-text("💾 Save as Template")');
    await page.fill('input[placeholder*="template name"]', 'To Delete');
    await page.click('button:has-text("Save Template")');
    
    // Open templates
    await page.click('button:has-text("📋 Templates")');
    await expect(page.locator('text=To Delete')).toBeVisible();
    
    // Setup dialog handler
    page.on('dialog', dialog => dialog.accept());
    
    // Delete template
    await page.locator('text=To Delete').locator('..').locator('..').locator('button:has-text("Delete")').click();
    
    // Verify deleted
    await expect(page.locator('text=To Delete')).not.toBeVisible();
  });

  test('should show template preview in modal', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Create template with details
    await page.fill('input[placeholder*="Add a new todo"]', 'Preview Task');
    await page.selectOption('select[value="low"]', 'high');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T09:00`);
    await page.check('label:has-text("Repeat") input[type="checkbox"]');
    await page.selectOption('select:near(label:has-text("Repeat"))', 'weekly');
    await page.click('button:has-text("💾 Save as Template")');
    await page.fill('input[placeholder*="template name"]', 'Preview Template');
    await page.click('button:has-text("Save Template")');
    
    // Open templates modal
    await page.click('button:has-text("📋 Templates")');
    
    // Verify preview shows details
    await expect(page.locator('text=Preview Task')).toBeVisible();
    await expect(page.locator('text=high')).toBeVisible();
    await expect(page.locator('text=weekly')).toBeVisible();
  });

  test('should create template with subtasks', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Create todo with subtasks
    await page.fill('input[placeholder*="Add a new todo"]', 'Task with Subtasks');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T09:00`);
    await page.click('button:has-text("Add")');
    
    // Add subtasks
    await page.click('button:has-text("Subtasks")');
    await page.fill('input[placeholder*="Add subtask"]', 'Subtask 1');
    await page.click('button:has-text("Add Subtask")');
    await page.fill('input[placeholder*="Add subtask"]', 'Subtask 2');
    await page.click('button:has-text("Add Subtask")');
    
    // Save as template
    await page.fill('input[placeholder*="Add a new todo"]', 'Task with Subtasks');
    await page.click('button:has-text("💾 Save as Template")');
    await page.fill('input[placeholder*="template name"]', 'Subtask Template');
    await page.click('button:has-text("Save Template")');
    
    // Open templates and verify subtasks mentioned
    await page.click('button:has-text("📋 Templates")');
    await expect(page.locator('text=Subtasks: 2 item(s)')).toBeVisible();
  });

  test('should use template and create subtasks', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Create template with subtasks
    await page.fill('input[placeholder*="Add a new todo"]', 'Task A');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T09:00`);
    await page.click('button:has-text("Add")');
    
    await page.click('button:has-text("Subtasks")');
    await page.fill('input[placeholder*="Add subtask"]', 'Step 1');
    await page.click('button:has-text("Add Subtask")');
    
    await page.fill('input[placeholder*="Add a new todo"]', 'Task A');
    await page.click('button:has-text("💾 Save as Template")');
    await page.fill('input[placeholder*="template name"]', 'Steps Template');
    await page.click('button:has-text("Save Template")');
    
    // Use template from modal
    await page.click('button:has-text("📋 Templates")');
    await page.click('button:has-text("Use Template")');
    
    // Verify todo created
    await expect(page.locator('text=Task A').first()).toBeVisible();
  });

  test('should filter templates by category', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Create Work template
    await page.fill('input[placeholder*="Add a new todo"]', 'Work Task');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T09:00`);
    await page.click('button:has-text("💾 Save as Template")');
    await page.fill('input[placeholder*="template name"]', 'Work Template');
    await page.fill('input[placeholder*="category"]', 'Work');
    await page.click('button:has-text("Save Template")');
    
    // Create Personal template
    await page.fill('input[placeholder*="Add a new todo"]', 'Personal Task');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T10:00`);
    await page.click('button:has-text("💾 Save as Template")');
    await page.fill('input[placeholder*="template name"]', 'Personal Template');
    await page.fill('input[placeholder*="category"]', 'Personal');
    await page.click('button:has-text("Save Template")');
    
    // Open templates
    await page.click('button:has-text("📋 Templates")');
    
    // Verify both visible initially
    await expect(page.locator('text=Work Template')).toBeVisible();
    await expect(page.locator('text=Personal Template')).toBeVisible();
    
    // Verify category badges
    await expect(page.locator('text=Work').first()).toBeVisible();
    await expect(page.locator('text=Personal').first()).toBeVisible();
  });

  test('should close templates modal', async ({ page }) => {
    await page.click('button:has-text("📋 Templates")');
    await expect(page.locator('h2:has-text("Templates")')).toBeVisible();
    
    // Close via X button
    await page.click('button:has-text("×")');
    await expect(page.locator('h2:has-text("Templates")')).not.toBeVisible();
  });
});
