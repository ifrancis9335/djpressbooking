# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: playwright_admin_test.spec.ts >> admin layout validation
- Location: playwright_admin_test.spec.ts:3:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.admin-shell-sidebar')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('.admin-shell-sidebar')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e4]:
      - paragraph [ref=e5]: Admin Module
      - heading "Admin Sign In" [level=1] [ref=e6]
      - paragraph [ref=e7]: Use your admin password to access the route-based control center.
      - generic [ref=e8]:
        - generic [ref=e9]:
          - generic [ref=e10]: Admin Password
          - textbox "Admin Password" [ref=e11]
        - button "Sign In" [ref=e12] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=e18] [cursor=pointer]:
    - img [ref=e19]
  - alert [ref=e22]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('admin layout validation', async ({ page }) => {
  4  |   // Use admin password from environment
  5  |   const adminPassword = process.env.ADMIN_PASSWORD;
  6  | 
  7  |   // Navigate to admin
  8  |   await page.goto('http://localhost:3000/admin');
  9  | 
  10 |   // Sign in if needed
  11 |   const isSignInVisible = await page.isVisible('input[type="password"]');
  12 |   if (isSignInVisible) {
  13 |     await page.fill('input[type="password"]', adminPassword);
  14 |     await page.click('button[type="submit"]');
  15 |   }
  16 | 
  17 |   // Wait for admin shell
> 18 |   await expect(page.locator('.admin-shell-sidebar')).toBeVisible({ timeout: 10000 });
     |                                                      ^ Error: expect(locator).toBeVisible() failed
  19 | 
  20 |   // 1) .admin-shell-sidebar exists and does not cause main-content layout shift
  21 |   // We check if the viewport exists and is visible
  22 |   const viewport = page.locator('.admin-shell-viewport');
  23 |   await expect(viewport).toBeVisible();
  24 |   
  25 |   // 2) .sidebar-menu is the vertical scroll owner for sidebar navigation
  26 |   const sidebarMenu = page.locator('.sidebar-menu');
  27 |   const overflowY = await sidebarMenu.evaluate(el => window.getComputedStyle(el).overflowY);
  28 |   console.log('Sidebar Menu Overflow-Y:', overflowY);
  29 |   // Note: Implementation might vary, but we'll check the property
  30 | 
  31 |   // 3) .sidebar-bottom / Public Utilities is reachable
  32 |   const sidebarBottom = page.locator('.sidebar-bottom');
  33 |   await expect(sidebarBottom).toBeVisible();
  34 |   const publicUtilitiesText = await sidebarBottom.innerText();
  35 |   console.log('Sidebar Bottom Text:', publicUtilitiesText.includes('Public Utilities') ? 'Pass' : 'Fail');
  36 | 
  37 |   // 4) long text inside the sidebar wraps instead of overflowing horizontally
  38 |   const sidebarContainer = page.locator('.sidebar-container');
  39 |   const scrollWidth = await sidebarContainer.evaluate(el => el.scrollWidth);
  40 |   const clientWidth = await sidebarContainer.evaluate(el => el.clientWidth);
  41 |   console.log('Sidebar ScrollWidth:', scrollWidth, 'ClientWidth:', clientWidth);
  42 |   const horizontalOverflow = scrollWidth > clientWidth;
  43 |   console.log('Sidebar Horizontal Overflow:', horizontalOverflow);
  44 | 
  45 |   // 5) main content remains visible alongside the sidebar on desktop width
  46 |   const viewportSize = page.viewportSize();
  47 |   if (viewportSize.width >= 1280) { // xl breakpoint usually
  48 |      const sidebarBox = await page.locator('.admin-shell-sidebar').boundingBox();
  49 |      const viewportBox = await viewport.boundingBox();
  50 |      console.log('Sidebar X:', sidebarBox.x, 'Viewport X:', viewportBox.x);
  51 |      const sideBySide = viewportBox.x >= (sidebarBox.x + sidebarBox.width);
  52 |      console.log('Desktop Layout Side-by-Side:', sideBySide);
  53 |   }
  54 | });
  55 | 
```