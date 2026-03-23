import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });

// Picker
await page.locator('button:has-text("10–12")').click();
await page.waitForLoadState('networkidle');
await page.screenshot({ path: './c11-1-picker.png' });

// Dialog
await page.locator('button').first().click();
await page.waitForLoadState('networkidle');
await page.screenshot({ path: './c11-2-dialog.png' });

// Type a test message to see dialog with interaction
await page.locator('input[placeholder*="Напиши"]').fill('кетчуп вытекает потому что...');
await page.screenshot({ path: './c11-3-input-filled.png' });

await browser.close();
