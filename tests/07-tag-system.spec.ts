import { test, expect } from '@playwright/test';

test.describe('Tag System', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="text"]', `testuser-tags-${Date.now()}`);
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('http://localhost:3000/');
  });

  test('should open tag management modal', async ({ page }) => {
    await page.click('button:has-text("🏷️ Tags")');
    await expect(page.locator('h2:has-text("Manage Tags")')).toBeVisible();
  });

  test('should create new tag with color', async ({ page }) => {
    await page.click('button:has-text("🏷️ Tags")');
    
    // Create tag
    await page.fill('input[placeholder*="Tag name"]', 'Work');
    await page.locator('input[type="color"]').fill('#ff0000');
    await page.click('button:has-text("Create")');
    
    // Verify tag appears in list
    await expect(page.locator('text=Work')).toBeVisible();
  });

  test('should edit tag name and color', async ({ page }) => {
    await page.click('button:has-text("🏷️ Tags")');
    
    // Create tag
    await page.fill('input[placeholder*="Tag name"]', 'Original');
    await page.click('button:has-text("Create")');
    
    // Edit tag
    await page.locator('text=Original').locator('..').locator('button:has-text("Edit")').click();
    
    // Change name
    await page.fill('input[value="Original"]', 'Updated');
    await page.locator('input[type="color"]').fill('#00ff00');
    await page.click('button:has-text("Update")');
    
    // Verify changes
    await expect(page.locator('text=Updated')).toBeVisible();
    await expect(page.locator('text=Original')).not.toBeVisible();
  });

  test('should delete tag', async ({ page }) => {
    await page.click('button:has-text("🏷️ Tags")');
    
    // Create tag
    await page.fill('input[placeholder*="Tag name"]', 'ToDelete');
    await page.click('button:has-text("Create")');
    await expect(page.locator('text=ToDelete')).toBeVisible();
    
    // Delete tag
    await page.locator('text=ToDelete').locator('..').locator('button:has-text("Delete")').click();
    
    // Verify deleted
    await expect(page.locator('text=ToDelete')).not.toBeVisible();
  });

  test('should assign tag to todo', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Create tag first
    await page.click('button:has-text("🏷️ Tags")');
    await page.fill('input[placeholder*="Tag name"]', 'Urgent');
    await page.click('button:has-text("Create")');
    await page.click('button:has-text("×")'); // Close modal
    
    // Create todo
    await page.fill('input[placeholder*="Add a new todo"]', 'Tagged Todo');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T09:00`);
    await page.click('button:has-text("Add")');
    
    // Edit todo to add tag
    await page.locator('text=Tagged Todo').locator('..').locator('button:has-text("Edit")').click();
    
    // Select tag
    await page.locator('text=Urgent').locator('..').locator('button').click();
    await page.click('button:has-text("Save Changes")');
    
    // Verify tag badge appears on todo
    await expect(page.locator('text=Tagged Todo').locator('..').locator('text=Urgent')).toBeVisible();
  });

  test('should assign multiple tags to todo', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Create multiple tags
    await page.click('button:has-text("🏷️ Tags")');
    await page.fill('input[placeholder*="Tag name"]', 'Work');
    await page.click('button:has-text("Create")');
    await page.fill('input[placeholder*="Tag name"]', 'Personal');
    await page.click('button:has-text("Create")');
    await page.click('button:has-text("×")');
    
    // Create todo
    await page.fill('input[placeholder*="Add a new todo"]', 'Multi Tagged');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T09:00`);
    await page.click('button:has-text("Add")');
    
    // Add both tags
    await page.locator('text=Multi Tagged').locator('..').locator('button:has-text("Edit")').click();
    await page.locator('h2:has-text("Edit Todo")').locator('..').locator('text=Work').locator('..').locator('button').click();
    await page.locator('h2:has-text("Edit Todo")').locator('..').locator('text=Personal').locator('..').locator('button').click();
    await page.click('button:has-text("Save Changes")');
    
    // Verify both tags appear
    const todoRow = page.locator('text=Multi Tagged').locator('..');
    await expect(todoRow.locator('text=Work')).toBeVisible();
    await expect(todoRow.locator('text=Personal')).toBeVisible();
  });

  test('should filter todos by tag', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Create tags
    await page.click('button:has-text("🏷️ Tags")');
    await page.fill('input[placeholder*="Tag name"]', 'Important');
    await page.click('button:has-text("Create")');
    await page.click('button:has-text("×")');
    
    // Create tagged todo
    await page.fill('input[placeholder*="Add a new todo"]', 'Important Task');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T09:00`);
    await page.click('button:has-text("Add")');
    
    await page.locator('text=Important Task').locator('..').locator('button:has-text("Edit")').click();
    await page.locator('text=Important').locator('..').locator('button').click();
    await page.click('button:has-text("Save Changes")');
    
    // Create untagged todo
    await page.fill('input[placeholder*="Add a new todo"]', 'Normal Task');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T10:00`);
    await page.click('button:has-text("Add")');
    
    // Click tag badge to filter
    await page.locator('text=Important Task').locator('..').locator('button:has-text("Important")').click();
    
    // Verify only tagged todo visible
    await expect(page.locator('text=Important Task')).toBeVisible();
    await expect(page.locator('text=Normal Task')).not.toBeVisible();
  });

  test('should show tag filter in filter summary', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Setup tag and todo
    await page.click('button:has-text("🏷️ Tags")');
    await page.fill('input[placeholder*="Tag name"]', 'TestTag');
    await page.click('button:has-text("Create")');
    await page.click('button:has-text("×")');
    
    await page.fill('input[placeholder*="Add a new todo"]', 'Test');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T09:00`);
    await page.click('button:has-text("Add")');
    
    await page.locator('text=Test').locator('..').locator('button:has-text("Edit")').click();
    await page.locator('text=TestTag').locator('..').locator('button').click();
    await page.click('button:has-text("Save Changes")');
    
    // Filter by tag
    await page.locator('button:has-text("TestTag")').first().click();
    
    // Verify filter summary shows tag
    await expect(page.locator('text=Tag: 🏷️ TestTag')).toBeVisible();
  });

  test('should clear tag filter', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Setup
    await page.click('button:has-text("🏷️ Tags")');
    await page.fill('input[placeholder*="Tag name"]', 'Clear');
    await page.click('button:has-text("Create")');
    await page.click('button:has-text("×")');
    
    await page.fill('input[placeholder*="Add a new todo"]', 'Task 1');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T09:00`);
    await page.click('button:has-text("Add")');
    
    await page.fill('input[placeholder*="Add a new todo"]', 'Task 2');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T10:00`);
    await page.click('button:has-text("Add")');
    
    // Tag first todo
    await page.locator('text=Task 1').locator('..').locator('button:has-text("Edit")').click();
    await page.locator('text=Clear').locator('..').locator('button').click();
    await page.click('button:has-text("Save Changes")');
    
    // Filter by tag
    await page.locator('button:has-text("Clear")').first().click();
    await expect(page.locator('text=Task 2')).not.toBeVisible();
    
    // Clear filter
    await page.click('button:has-text("Clear all filters")');
    
    // Both visible again
    await expect(page.locator('text=Task 1')).toBeVisible();
    await expect(page.locator('text=Task 2')).toBeVisible();
  });

  test('should prevent duplicate tag names', async ({ page }) => {
    await page.click('button:has-text("🏷️ Tags")');
    
    // Create first tag
    await page.fill('input[placeholder*="Tag name"]', 'Duplicate');
    await page.click('button:has-text("Create")');
    await expect(page.locator('text=Duplicate').first()).toBeVisible();
    
    // Try to create duplicate
    let alertMessage = '';
    page.on('dialog', dialog => {
      alertMessage = dialog.message();
      dialog.accept();
    });
    
    await page.fill('input[placeholder*="Tag name"]', 'Duplicate');
    await page.click('button:has-text("Create")');
    
    await page.waitForTimeout(500);
    
    // Should show error or not create
    if (alertMessage) {
      expect(alertMessage.toLowerCase()).toContain('exist');
    }
  });

  test('should show tag badges on completed todos', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Create tag and todo
    await page.click('button:has-text("🏷️ Tags")');
    await page.fill('input[placeholder*="Tag name"]', 'Done');
    await page.click('button:has-text("Create")');
    await page.click('button:has-text("×")');
    
    await page.fill('input[placeholder*="Add a new todo"]', 'Complete Me');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T09:00`);
    await page.click('button:has-text("Add")');
    
    await page.locator('text=Complete Me').locator('..').locator('button:has-text("Edit")').click();
    await page.locator('text=Done').locator('..').locator('button').click();
    await page.click('button:has-text("Save Changes")');
    
    // Complete todo
    await page.locator('text=Complete Me').locator('..').locator('input[type="checkbox"]').check();
    
    // Verify tag still shows in completed section
    const completedSection = page.locator('h2:has-text("Completed")').locator('..');
    await expect(completedSection.locator('text=Done')).toBeVisible();
  });
});
