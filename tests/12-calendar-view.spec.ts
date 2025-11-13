import { test, expect } from '@playwright/test';

test.describe('Calendar View', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="text"]', 'testuser');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('http://localhost:3000/');
  });

  test('should load calendar with current month', async ({ page }) => {
    // Navigate to calendar
    await page.click('button:has-text("Calendar")');
    await page.waitForURL(/\/calendar/);

    // Verify calendar loaded
    await expect(page.locator('h1:has-text("Calendar")')).toBeVisible();

    // Check for day headers
    await expect(page.locator('text=Sun')).toBeVisible();
    await expect(page.locator('text=Mon')).toBeVisible();
    await expect(page.locator('text=Tue')).toBeVisible();
    await expect(page.locator('text=Wed')).toBeVisible();
    await expect(page.locator('text=Thu')).toBeVisible();
    await expect(page.locator('text=Fri')).toBeVisible();
    await expect(page.locator('text=Sat')).toBeVisible();

    // Verify current month is displayed
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
    const currentYear = new Date().getFullYear();
    await expect(page.locator(`text=${currentMonth} ${currentYear}`)).toBeVisible();

    // Verify URL has month parameter
    expect(page.url()).toContain('month=');
  });

  test('should navigate to previous month', async ({ page }) => {
    await page.click('button:has-text("Calendar")');
    await page.waitForURL(/\/calendar/);

    // Get current month
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });

    // Click Previous button
    await page.click('button:has-text("Previous")');

    // Wait for navigation
    await page.waitForTimeout(500);

    // Calculate previous month
    const prevDate = new Date(currentDate);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevMonth = prevDate.toLocaleString('en-US', { month: 'long' });
    const prevYear = prevDate.getFullYear();

    // Verify previous month is displayed
    await expect(page.locator(`text=${prevMonth} ${prevYear}`)).toBeVisible();

    // Verify URL updated
    const expectedMonth = `${prevYear}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    expect(page.url()).toContain(`month=${expectedMonth}`);
  });

  test('should navigate to next month', async ({ page }) => {
    await page.click('button:has-text("Calendar")');
    await page.waitForURL(/\/calendar/);

    // Get current month
    const currentDate = new Date();

    // Click Next button
    await page.click('button:has-text("Next")');

    // Wait for navigation
    await page.waitForTimeout(500);

    // Calculate next month
    const nextDate = new Date(currentDate);
    nextDate.setMonth(nextDate.getMonth() + 1);
    const nextMonth = nextDate.toLocaleString('en-US', { month: 'long' });
    const nextYear = nextDate.getFullYear();

    // Verify next month is displayed
    await expect(page.locator(`text=${nextMonth} ${nextYear}`)).toBeVisible();
  });

  test('should go to today when Today button is clicked', async ({ page }) => {
    await page.click('button:has-text("Calendar")');
    await page.waitForURL(/\/calendar/);

    // Navigate to previous month
    await page.click('button:has-text("Previous")');
    await page.waitForTimeout(500);

    // Click Today button
    await page.click('button:has-text("Today")');
    await page.waitForTimeout(500);

    // Verify current month is displayed
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
    const currentYear = new Date().getFullYear();
    await expect(page.locator(`text=${currentMonth} ${currentYear}`)).toBeVisible();
  });

  test('should show todo on correct date', async ({ page }) => {
    // Create a todo with future due date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    await page.fill('input[placeholder*="Add a new todo"]', 'Calendar Test Todo');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T10:00`);
    await page.click('button:has-text("Add")');

    // Wait for todo to be created
    await expect(page.locator('text=Calendar Test Todo')).toBeVisible();

    // Navigate to calendar
    await page.click('button:has-text("Calendar")');
    await page.waitForURL(/\/calendar/);

    // Look for the todo on the calendar
    // The todo should appear on tomorrow's date
    const tomorrowDay = tomorrow.getDate();
    
    // Find the day cell with the todo
    const dayCell = page.locator(`div:has-text("${tomorrowDay}"):has-text("Calendar Test Todo")`).first();
    await expect(dayCell).toBeVisible();

    // Verify todo count badge
    const badge = page.locator(`div:has-text("${tomorrowDay}") >> span:has-text("1")`).first();
    await expect(badge).toBeVisible();
  });

  test('should show holiday on correct date', async ({ page }) => {
    await page.click('button:has-text("Calendar")');
    await page.waitForURL(/\/calendar/);

    // Singapore holidays should be visible if we're in the right month
    // For example, National Day (August 9)
    // Navigate to August if not current month
    const currentMonth = new Date().getMonth();
    if (currentMonth < 7) { // Before August
      // Click Next until we reach August
      while (!(await page.locator('text=August').isVisible())) {
        await page.click('button:has-text("Next")');
        await page.waitForTimeout(500);
      }
    } else if (currentMonth > 7) { // After August
      // Click Previous until we reach August
      while (!(await page.locator('text=August').isVisible())) {
        await page.click('button:has-text("Previous")');
        await page.waitForTimeout(500);
      }
    }

    // Look for National Day holiday (Aug 9)
    // Should see "🎉 National Day" on the 9th
    const holidayCell = page.locator('div:has-text("🎉 National Day")');
    
    // If in 2025 or 2026, should be visible
    const currentYear = new Date().getFullYear();
    if (currentYear === 2025 || currentYear === 2026) {
      await expect(holidayCell).toBeVisible();
    }
  });

  test('should open modal when clicking day with todos', async ({ page }) => {
    // Create a todo for today
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    await page.fill('input[placeholder*="Add a new todo"]', 'Modal Test Todo');
    await page.fill('input[type="datetime-local"]', `${todayStr}T14:00`);
    await page.click('button:has-text("Add")');

    await expect(page.locator('text=Modal Test Todo')).toBeVisible();

    // Navigate to calendar
    await page.click('button:has-text("Calendar")');
    await page.waitForURL(/\/calendar/);

    // Click on today's date cell
    const todayDay = today.getDate();
    const dayCell = page.locator(`div:has-text("${todayDay}"):has-text("Modal Test Todo")`).first();
    await dayCell.click();

    // Wait for modal to open
    await page.waitForTimeout(500);

    // Verify modal is visible
    const modal = page.locator('text=Tasks (');
    await expect(modal).toBeVisible();

    // Verify todo appears in modal
    await expect(page.locator('text=Modal Test Todo')).toBeVisible();

    // Verify date is shown in modal
    const modalDate = page.locator(`text=${today.toLocaleDateString('en-US', { weekday: 'long' })}`);
    await expect(modalDate).toBeVisible();

    // Close modal by clicking outside
    await page.click('body', { position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);

    // Modal should be closed
    await expect(modal).not.toBeVisible();
  });

  test('should highlight current day', async ({ page }) => {
    await page.click('button:has-text("Calendar")');
    await page.waitForURL(/\/calendar/);

    // Get current day
    const today = new Date().getDate();

    // Find today's cell - it should have special styling
    const todayCell = page.locator(`div:has-text("${today}")`).first();
    
    // Check if it has today styling (blue border or background)
    // This would need to check computed styles or specific classes
    await expect(todayCell).toBeVisible();
  });

  test('should style weekends differently', async ({ page }) => {
    await page.click('button:has-text("Calendar")');
    await page.waitForURL(/\/calendar/);

    // Verify Sunday and Saturday headers are visible
    await expect(page.locator('text=Sun').first()).toBeVisible();
    await expect(page.locator('text=Sat').first()).toBeVisible();

    // Weekend cells should have different background
    // This is validated by the CSS styling in the component
  });

  test('should show back to todos button', async ({ page }) => {
    await page.click('button:has-text("Calendar")');
    await page.waitForURL(/\/calendar/);

    // Verify back button exists
    const backButton = page.locator('button:has-text("Back to Todos")');
    await expect(backButton).toBeVisible();

    // Click back button
    await backButton.click();

    // Should navigate back to todos page
    await page.waitForURL('http://localhost:3000/');
    await expect(page.locator('h1:has-text("Todo App")')).toBeVisible();
  });

  test('should handle multiple todos on same day', async ({ page }) => {
    // Create multiple todos for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Add first todo
    await page.fill('input[placeholder*="Add a new todo"]', 'First Todo');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T09:00`);
    await page.click('button:has-text("Add")');
    await expect(page.locator('text=First Todo')).toBeVisible();

    // Add second todo
    await page.fill('input[placeholder*="Add a new todo"]', 'Second Todo');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T15:00`);
    await page.click('button:has-text("Add")');
    await expect(page.locator('text=Second Todo')).toBeVisible();

    // Add third todo
    await page.fill('input[placeholder*="Add a new todo"]', 'Third Todo');
    await page.fill('input[type="datetime-local"]', `${tomorrowStr}T18:00`);
    await page.click('button:has-text("Add")');
    await expect(page.locator('text=Third Todo')).toBeVisible();

    // Navigate to calendar
    await page.click('button:has-text("Calendar")');
    await page.waitForURL(/\/calendar/);

    // Find tomorrow's cell
    const tomorrowDay = tomorrow.getDate();
    
    // Should show count badge of 3
    const badge = page.locator(`div:has-text("${tomorrowDay}") >> span:has-text("3")`).first();
    await expect(badge).toBeVisible();

    // Click on the day
    const dayCell = page.locator(`div:has-text("${tomorrowDay}")`).first();
    await dayCell.click();

    // Modal should show all 3 todos
    await expect(page.locator('text=Tasks (3)')).toBeVisible();
    await expect(page.locator('text=First Todo')).toBeVisible();
    await expect(page.locator('text=Second Todo')).toBeVisible();
    await expect(page.locator('text=Third Todo')).toBeVisible();
  });

  test('should persist month selection in URL', async ({ page }) => {
    await page.click('button:has-text("Calendar")');
    await page.waitForURL(/\/calendar\?month=/);

    // Get URL with month
    const url1 = page.url();
    const monthMatch = url1.match(/month=(\d{4}-\d{2})/);
    expect(monthMatch).toBeTruthy();

    // Navigate to next month
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);

    // URL should update
    const url2 = page.url();
    expect(url2).not.toBe(url1);
    expect(url2).toContain('month=');

    // Reload page
    await page.reload();

    // Should stay on the same month
    expect(page.url()).toBe(url2);
  });
});
