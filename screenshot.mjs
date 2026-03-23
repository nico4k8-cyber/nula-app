import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 800 } });
await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
await page.screenshot({ path: '/tmp/razgadai.png' });
await browser.close();
console.log('Screenshot saved');
