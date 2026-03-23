import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 800 } });
await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });

// Age select
await page.screenshot({ path: '/tmp/c4-1-age.png' });

// Picker
await page.click('button:has-text("10–12")');
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/c4-2-picker.png' });

// Dialog - click first task
const firstTaskBtn = await page.$('button:nth-of-type(1)');
if (firstTaskBtn) {
  await firstTaskBtn.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/c4-3-dialog.png' });
}

await browser.close();
console.log('Screenshots done');
