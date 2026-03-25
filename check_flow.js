import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('https://triznula.vercel.app/', { waitUntil: 'domcontentloaded' });

  console.log('🎮 Following the flow...');
  
  // Wait for button
  console.log('⏳ Waiting for "Начать" button (might take 16+ seconds)...');
  await page.waitForSelector('text=✨ Начать ✨', { timeout: 30000 }).catch(() => console.log('Button not found!'));

  // Click button
  console.log('✅ Found button, clicking...');
  await page.click('text=✨ Начать ✨');
  
  await page.waitForTimeout(2000);

  // Check what's on screen now
  const content = await page.evaluate(() => ({
    text: document.body.innerText.substring(0, 300),
    hasAgeButtons: !!document.body.innerText.match(/8–11|12–15/),
    hasPicker: !!document.body.innerText.match(/Решай|загадка/i)
  }));

  console.log('\nAfter clicking button:');
  console.log('Has age buttons:', content.hasAgeButtons);
  console.log('Has puzzle picker:', content.hasPicker);
  console.log('Text:', content.text);

  await browser.close();
})();
