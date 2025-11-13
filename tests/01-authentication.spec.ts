import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should show login page for unauthenticated user', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    // Should redirect to login page
    await expect(page).toHaveURL('http://localhost:3000/login');
    await expect(page.locator('h1:has-text("Welcome to Todo App")')).toBeVisible();
  });

  test('should register new user with username', async ({ page }) => {
    const username = `testuser-${Date.now()}`;
    
    await page.goto('http://localhost:3000/login');
    
    // Enter username and click Sign in (acts as register for new users)
    await page.fill('input[type="text"]', username);
    await page.click('button:has-text("Sign in")');
    
    // Should redirect to main page
    await page.waitForURL('http://localhost:3000/');
    
    // Should see welcome message with username
    await expect(page.locator(`text=Welcome, ${username}`)).toBeVisible();
  });

  test('should login existing user', async ({ page }) => {
    // First, create a user
    const username = `testuser-login-${Date.now()}`;
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="text"]', username);
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('http://localhost:3000/');
    
    // Logout
    await page.click('button:has-text("Logout")');
    await page.waitForURL('http://localhost:3000/login');
    
    // Login again with same username
    await page.fill('input[type="text"]', username);
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('http://localhost:3000/');
    
    // Should see welcome message
    await expect(page.locator(`text=Welcome, ${username}`)).toBeVisible();
  });

  test('should logout and redirect to login page', async ({ page }) => {
    const username = `testuser-logout-${Date.now()}`;
    
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="text"]', username);
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('http://localhost:3000/');
    
    // Verify logged in
    await expect(page.locator(`text=Welcome, ${username}`)).toBeVisible();
    
    // Logout
    await page.click('button:has-text("Logout")');
    
    // Should redirect to login page
    await expect(page).toHaveURL('http://localhost:3000/login');
    
    // Should not have session cookie
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === 'session');
    expect(sessionCookie).toBeUndefined();
  });

  test('should protect main page route', async ({ page }) => {
    // Clear all cookies to ensure no session
    await page.context().clearCookies();
    
    // Try to access main page
    await page.goto('http://localhost:3000/');
    
    // Should redirect to login
    await expect(page).toHaveURL('http://localhost:3000/login');
  });

  test('should protect calendar route', async ({ page }) => {
    // Clear all cookies
    await page.context().clearCookies();
    
    // Try to access calendar page
    await page.goto('http://localhost:3000/calendar');
    
    // Should redirect to login
    await expect(page).toHaveURL('http://localhost:3000/login');
  });

  test('should redirect to main page if already logged in and visiting login', async ({ page }) => {
    const username = `testuser-redirect-${Date.now()}`;
    
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="text"]', username);
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('http://localhost:3000/');
    
    // Try to visit login page again
    await page.goto('http://localhost:3000/login');
    
    // Should redirect back to main page
    await expect(page).toHaveURL('http://localhost:3000/');
  });

  test('should persist session across page reloads', async ({ page }) => {
    const username = `testuser-persist-${Date.now()}`;
    
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="text"]', username);
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('http://localhost:3000/');
    
    // Reload page
    await page.reload();
    
    // Should still be logged in
    await expect(page).toHaveURL('http://localhost:3000/');
    await expect(page.locator(`text=Welcome, ${username}`)).toBeVisible();
  });

  test('should require non-empty username', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Try to submit with empty username
    await page.click('button:has-text("Sign in")');
    
    // Should stay on login page (HTML5 validation)
    await expect(page).toHaveURL('http://localhost:3000/login');
  });

  test('should show username in header after login', async ({ page }) => {
    const username = `testuser-header-${Date.now()}`;
    
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="text"]', username);
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('http://localhost:3000/');
    
    // Check username appears in header
    await expect(page.locator(`text=Welcome, ${username}`)).toBeVisible();
  });
});
