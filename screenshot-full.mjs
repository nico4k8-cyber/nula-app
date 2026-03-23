import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 800 } });
await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });

// Age select
await page.click('button:has-text("13–16")');
await page.waitForTimeout(300);

// Click task
await page.click('button:has-text("Почему кетчуп")');
await page.waitForTimeout(500);

// Type an answer
await page.fill('input[placeholder="Напиши свою версию..."]', 'Кетчуп это вязкая жидкость');
await page.click('button[class*="bg-orange"]');
await page.waitForTimeout(2000);

// Should auto-transition to debrief after a moment
await page.screenshot({ path: '/tmp/razgadai-debrief.png' });
await browser.close();
console.log('Debrief screenshot saved');
