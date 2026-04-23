import { test, expect } from '@playwright/test';

test('admin layout validation', async ({ page }) => {
  const adminPassword = process.env.ADMIN_PASSWORD ?? '';
  await page.goto('http://localhost:3000/admin');
  
  await page.waitForLoadState('networkidle');
  console.log('Page Title:', await page.title());
  
  const isSignInVisible = await page.isVisible('input[type="password"]');
  console.log('Sign-in Form Visible:', isSignInVisible);
  
  if (isSignInVisible) {
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
  } else {
    console.log('Sign-in form not found. Check if already signed in or path is correct.');
  }

  // Wait specifically for the sidebar appearing
  console.log('Waiting for .admin-shell-sidebar...');
  try {
    await expect(page.locator('.admin-shell-sidebar')).toBeVisible({ timeout: 15000 });
    console.log('.admin-shell-sidebar is visible');
  } catch (e) {
    console.log('Failed to find .admin-shell-sidebar');
    await page.screenshot({ path: 'failure.png' });
    throw e;
  }

  const viewport = page.locator('.admin-shell-viewport');
  await expect(viewport).toBeVisible();
  
  const sidebarMenu = page.locator('.sidebar-menu');
  const overflowY = await sidebarMenu.evaluate(el => window.getComputedStyle(el).overflowY);
  console.log('Sidebar Menu Overflow-Y:', overflowY);

  const sidebarBottom = page.locator('.sidebar-bottom');
  await expect(sidebarBottom).toBeVisible();
  const publicUtilitiesText = await sidebarBottom.innerText();
  console.log('Sidebar Bottom Public Utilities Heading:', publicUtilitiesText.includes('Public Utilities') ? 'Pass' : 'Fail');

  const sidebarContainer = page.locator('.sidebar-container');
  const scrollWidth = await sidebarContainer.evaluate(el => el.scrollWidth);
  const clientWidth = await sidebarContainer.evaluate(el => el.clientWidth);
  console.log('Sidebar Dimensions:', { scrollWidth, clientWidth });
  console.log('Sidebar Horizontal Overflow:', scrollWidth > clientWidth ? 'Fail' : 'Pass');

  const viewportSize = page.viewportSize();
  if (viewportSize && viewportSize.width >= 1280) {
     const sidebarBox = await page.locator('.admin-shell-sidebar').boundingBox();
     const viewportBox = await viewport.boundingBox();
     if (sidebarBox && viewportBox) {
       console.log('Layout - Sidebar X:', sidebarBox.x, 'Viewport X:', viewportBox.x);
       console.log('Desktop Layout Side-by-Side:', viewportBox.x >= (sidebarBox.x + sidebarBox.width) ? 'Pass' : 'Fail');
     }
  }
});
