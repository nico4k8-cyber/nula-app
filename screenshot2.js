import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });

// Click "10-12" to go to picker
await page.locator('button:has-text("10–12")').click();
await page.waitForLoadState('networkidle');

// Click first task
await page.locator('button').first().click();
await page.waitForLoadState('networkidle');

// Take screenshot
await page.screenshot({ path: './c7-improved-dialog.png' });
console.log('Dialog screenshot saved');

await browser.close();
