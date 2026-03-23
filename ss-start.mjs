import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 800 } });
await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
await page.screenshot({ path: '/tmp/ss1.png' });

await page.click('button:has-text("13–16")');
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/ss2.png' });

await page.click('button', { has: page.locator('text=Почему кетчуп') });
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/ss3.png' });

await browser.close();
