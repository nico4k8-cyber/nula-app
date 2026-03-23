import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 800 } });
await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });

// Click age button to go to picker
await page.click('button:has-text("13–16")');
await page.waitForTimeout(300);

await page.screenshot({ path: '/tmp/razgadai-picker.png' });
await browser.close();
console.log('Picker screenshot saved');
