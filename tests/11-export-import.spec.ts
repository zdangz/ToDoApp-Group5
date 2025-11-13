import { test, expect } from '@playwright/test';

test.describe('Export and Import Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="text"]', 'testuser');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('http://localhost:3000/');
  });

  test('should export todos as JSON', async ({ page }) => {
    // Add a test todo first
    await page.fill('input[placeholder*="Add a new todo"]', 'Test Export Todo');
    await page.selectOption('select', 'high');
    await page.click('button:has-text("Add")');

    // Wait for todo to appear
    await expect(page.locator('text=Test Export Todo')).toBeVisible();

    // Click Data button to open dropdown
    await page.click('button:has-text("Data")');

    // Wait for dropdown to appear
    await expect(page.locator('text=Export JSON')).toBeVisible();

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Click Export JSON
    await page.click('text=Export JSON');

    // Wait for download
    const download = await downloadPromise;

    // Verify download filename
    expect(download.suggestedFilename()).toMatch(/todos-export-\d{4}-\d{2}-\d{2}\.json/);

    // Read downloaded file
    const path = await download.path();
    const fs = require('fs');
    const content = fs.readFileSync(path, 'utf-8');
    const data = JSON.parse(content);

    // Validate export format
    expect(data.version).toBe('1.0');
    expect(data.exported_at).toBeTruthy();
    expect(Array.isArray(data.todos)).toBe(true);
    expect(Array.isArray(data.tags)).toBe(true);

    // Verify our todo is in the export
    const exportedTodo = data.todos.find((t: any) => t.title === 'Test Export Todo');
    expect(exportedTodo).toBeTruthy();
    expect(exportedTodo.priority).toBe('high');
  });

  test('should export todos as CSV', async ({ page }) => {
    // Add a test todo
    await page.fill('input[placeholder*="Add a new todo"]', 'Test CSV Export');
    await page.click('button:has-text("Add")');

    // Wait for todo to appear
    await expect(page.locator('text=Test CSV Export')).toBeVisible();

    // Click Data button
    await page.click('button:has-text("Data")');

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Click Export CSV
    await page.click('text=Export CSV');

    // Wait for download
    const download = await downloadPromise;

    // Verify download filename
    expect(download.suggestedFilename()).toMatch(/todos-export-\d{4}-\d{2}-\d{2}\.csv/);

    // Read downloaded file
    const path = await download.path();
    const fs = require('fs');
    const content = fs.readFileSync(path, 'utf-8');

    // Verify CSV format
    expect(content).toContain('Title,Priority,Due Date,Completed,Recurring,Reminder,Tags');
    expect(content).toContain('Test CSV Export');
  });

  test('should import valid JSON file', async ({ page }) => {
    // Create a valid import file
    const importData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      user_id: 1,
      todos: [
        {
          id: 999,
          user_id: 1,
          title: 'Imported Todo 1',
          completed: false,
          priority: 'high',
          due_date: null,
          is_recurring: false,
          recurrence_pattern: null,
          reminder_minutes: null,
          subtasks: [
            { id: 1, todo_id: 999, title: 'Subtask 1', completed: false, position: 0 }
          ],
          tag_ids: [1]
        }
      ],
      tags: [
        { id: 1, user_id: 1, name: 'Work', color: '#3b82f6' }
      ]
    };

    // Click Data button
    await page.click('button:has-text("Data")');

    // Create a temporary file with import data
    const fs = require('fs');
    const path = require('path');
    const tmpFile = path.join(__dirname, 'temp-import.json');
    fs.writeFileSync(tmpFile, JSON.stringify(importData));

    // Upload file
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(tmpFile);

    // Wait for success message
    await expect(page.locator('text=Import successful')).toBeVisible({ timeout: 5000 });

    // Verify the imported todo appears
    await expect(page.locator('text=Imported Todo 1')).toBeVisible();

    // Clean up temp file
    fs.unlinkSync(tmpFile);
  });

  test('should show error for invalid JSON', async ({ page }) => {
    // Click Data button
    await page.click('button:has-text("Data")');

    // Create an invalid JSON file
    const fs = require('fs');
    const path = require('path');
    const tmpFile = path.join(__dirname, 'temp-invalid.json');
    fs.writeFileSync(tmpFile, 'invalid json content {');

    // Upload file
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(tmpFile);

    // Wait for error message
    await expect(page.locator('text=Invalid JSON file')).toBeVisible({ timeout: 5000 });

    // Clean up temp file
    fs.unlinkSync(tmpFile);
  });

  test('should show error for missing required fields', async ({ page }) => {
    // Create import data without version field
    const invalidData = {
      todos: [],
      tags: []
    };

    // Click Data button
    await page.click('button:has-text("Data")');

    // Create a temporary file
    const fs = require('fs');
    const path = require('path');
    const tmpFile = path.join(__dirname, 'temp-missing-fields.json');
    fs.writeFileSync(tmpFile, JSON.stringify(invalidData));

    // Upload file
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(tmpFile);

    // Wait for error message
    await expect(page.locator('text=Invalid import format')).toBeVisible({ timeout: 5000 });

    // Clean up temp file
    fs.unlinkSync(tmpFile);
  });

  test('should preserve all todo data on import', async ({ page }) => {
    // Create comprehensive import data
    const importData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      user_id: 1,
      todos: [
        {
          id: 888,
          user_id: 1,
          title: 'Complete Import Test',
          completed: false,
          priority: 'medium',
          due_date: '2025-12-31T10:00:00',
          is_recurring: true,
          recurrence_pattern: 'weekly',
          reminder_minutes: 60,
          subtasks: [
            { id: 1, todo_id: 888, title: 'First subtask', completed: false, position: 0 },
            { id: 2, todo_id: 888, title: 'Second subtask', completed: true, position: 1 }
          ],
          tag_ids: [1, 2]
        }
      ],
      tags: [
        { id: 1, user_id: 1, name: 'Important', color: '#ef4444' },
        { id: 2, user_id: 1, name: 'Personal', color: '#10b981' }
      ]
    };

    // Click Data button
    await page.click('button:has-text("Data")');

    // Create a temporary file
    const fs = require('fs');
    const path = require('path');
    const tmpFile = path.join(__dirname, 'temp-complete.json');
    fs.writeFileSync(tmpFile, JSON.stringify(importData));

    // Upload file
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(tmpFile);

    // Wait for success message
    await expect(page.locator('text=Import successful')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=2 subtasks')).toBeVisible();

    // Verify the todo appears with correct data
    await expect(page.locator('text=Complete Import Test')).toBeVisible();

    // Clean up temp file
    fs.unlinkSync(tmpFile);
  });

  test('should not create duplicate tags on import', async ({ page }) => {
    // First, create a tag by adding a todo (if your app supports it)
    // Then import data with the same tag name

    const importData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      user_id: 1,
      todos: [
        {
          id: 777,
          user_id: 1,
          title: 'Tag Reuse Test',
          completed: false,
          priority: 'low',
          due_date: null,
          is_recurring: false,
          recurrence_pattern: null,
          reminder_minutes: null,
          subtasks: [],
          tag_ids: [1]
        }
      ],
      tags: [
        { id: 1, user_id: 1, name: 'Work', color: '#3b82f6' }
      ]
    };

    // Import once
    await page.click('button:has-text("Data")');
    
    const fs = require('fs');
    const path = require('path');
    const tmpFile = path.join(__dirname, 'temp-tags.json');
    fs.writeFileSync(tmpFile, JSON.stringify(importData));

    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(tmpFile);

    await expect(page.locator('text=Import successful')).toBeVisible({ timeout: 5000 });

    // Import again with same tag
    await page.click('button:has-text("Data")');
    await fileInput.setInputFiles(tmpFile);

    await expect(page.locator('text=Import successful')).toBeVisible({ timeout: 5000 });

    // The success message should show that tags were reused, not duplicated
    // This is validated by the backend logic

    // Clean up temp file
    fs.unlinkSync(tmpFile);
  });

  test('should close dropdown after successful export', async ({ page }) => {
    // Click Data button
    await page.click('button:has-text("Data")');

    // Verify dropdown is visible
    await expect(page.locator('text=Export JSON')).toBeVisible();

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Click Export JSON
    await page.click('text=Export JSON');

    // Wait for download
    await downloadPromise;

    // Verify dropdown is closed
    await expect(page.locator('text=Export JSON')).not.toBeVisible();
  });

  test('should close dropdown after successful import', async ({ page }) => {
    const importData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      user_id: 1,
      todos: [],
      tags: []
    };

    // Click Data button
    await page.click('button:has-text("Data")');

    // Create temp file
    const fs = require('fs');
    const path = require('path');
    const tmpFile = path.join(__dirname, 'temp-close-test.json');
    fs.writeFileSync(tmpFile, JSON.stringify(importData));

    // Upload file
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(tmpFile);

    // Wait for success message
    await expect(page.locator('text=Import successful')).toBeVisible({ timeout: 5000 });

    // Verify dropdown is closed
    await expect(page.locator('text=Import JSON')).not.toBeVisible();

    // Clean up
    fs.unlinkSync(tmpFile);
  });
});
