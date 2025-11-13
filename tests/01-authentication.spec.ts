import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should register a new user', async ({ page, context }) => {
    // Use API to register (since WebAuthn requires user interaction)
    const username = `newuser-auth-test-${Date.now()}-${Math.random()}`;
    const response = await context.request.post('http://localhost:3000/api/auth/register', {
      data: { username }
    });

    expect(response.ok()).toBeTruthy();

    // Navigate to home page - should be logged in
    await page.goto('http://localhost:3000/');

    // Should be on home page (not redirected to login)
    expect(page.url()).toBe('http://localhost:3000/');

    // Should see the todo interface
    await expect(page.locator('input[placeholder*="Add a new todo"]')).toBeVisible();
  });

  test('should login an existing user', async ({ page, context }) => {
    // First register a user via API
    const username = `existinguser-auth-test-${Date.now()}-${Math.random()}`;
    await context.request.post('http://localhost:3000/api/auth/register', {
      data: { username }
    });

    // Clear cookies to simulate logout
    await context.clearCookies();

    // Now login via API
    const loginResponse = await context.request.post('http://localhost:3000/api/auth/login', {
      data: { username }
    });

    expect(loginResponse.ok()).toBeTruthy();

    // Navigate to home page - should be logged in
    await page.goto('http://localhost:3000/');
    expect(page.url()).toBe('http://localhost:3000/');
  });

  test('should show error for duplicate username registration', async ({ context }) => {
    const username = `duplicate-user-test-${Date.now()}-${Math.random()}`;

    // Register first time via API
    const firstResponse = await context.request.post('http://localhost:3000/api/auth/register', {
      data: { username }
    });
    expect(firstResponse.ok()).toBeTruthy();

    // Clear cookies
    await context.clearCookies();

    // Try to register again with same username
    const secondResponse = await context.request.post('http://localhost:3000/api/auth/register', {
      data: { username }
    });

    expect(secondResponse.status()).toBe(400);
    const errorData = await secondResponse.json();
    expect(errorData.error).toContain('already exists');
  });

  test('should show error for non-existent user login', async ({ context }) => {
    // Try to login with non-existent user via API
    const response = await context.request.post('http://localhost:3000/api/auth/login', {
      data: { username: 'nonexistent-user-12345' }
    });

    expect(response.status()).toBe(404);
    const errorData = await response.json();
    expect(errorData.error).toContain('not found');
  });

  test('should logout and clear session', async ({ page, context }) => {
    // Register and login via API
    const username = `logout-test-user-${Date.now()}-${Math.random()}`;
    await context.request.post('http://localhost:3000/api/auth/register', {
      data: { username }
    });

    // Go to home page - should be logged in
    await page.goto('http://localhost:3000/');
    expect(page.url()).toBe('http://localhost:3000/');

    // Click logout button
    await page.click('button:has-text("Logout")');

    // Should redirect to login page
    await page.waitForURL('http://localhost:3000/login');
    expect(page.url()).toBe('http://localhost:3000/login');

    // Verify session is cleared by trying to access protected route
    await page.goto('http://localhost:3000/');
    
    // Should redirect back to login
    await page.waitForURL('http://localhost:3000/login');
    expect(page.url()).toBe('http://localhost:3000/login');
  });

  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    // Try to access home page without authentication
    await page.goto('http://localhost:3000/');

    // Should redirect to login
    await page.waitForURL('http://localhost:3000/login');
    expect(page.url()).toBe('http://localhost:3000/login');
  });

  test('should redirect unauthenticated users from calendar page', async ({ page }) => {
    // Try to access calendar page without authentication
    await page.goto('http://localhost:3000/calendar');

    // Should redirect to login
    await page.waitForURL('http://localhost:3000/login');
    expect(page.url()).toBe('http://localhost:3000/login');
  });

  test('should maintain session after page refresh', async ({ page, context }) => {
    // Register via API
    const username = `refresh-test-user-${Date.now()}-${Math.random()}`;
    await context.request.post('http://localhost:3000/api/auth/register', {
      data: { username }
    });

    // Go to home page
    await page.goto('http://localhost:3000/');
    expect(page.url()).toBe('http://localhost:3000/');

    // Reload the page
    await page.reload();

    // Should still be on home page (not redirected to login)
    await page.waitForLoadState('networkidle');
    expect(page.url()).toBe('http://localhost:3000/');

    // Should not see login page elements
    await expect(page.locator('text=Sign in with your passkey')).not.toBeVisible();
  });

  test('should show validation error for empty username', async ({ context }) => {
    // Try to register without username
    const registerResponse = await context.request.post('http://localhost:3000/api/auth/register', {
      data: { username: '' }
    });

    expect(registerResponse.status()).toBe(400);
    const registerError = await registerResponse.json();
    expect(registerError.error).toContain('required');

    // Try to login without username
    const loginResponse = await context.request.post('http://localhost:3000/api/auth/login', {
      data: { username: '' }
    });

    expect(loginResponse.status()).toBe(400);
    const loginError = await loginResponse.json();
    expect(loginError.error).toContain('required');
  });
});
