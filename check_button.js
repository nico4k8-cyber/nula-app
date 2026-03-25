import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('🔍 Waiting for "Начать" button to appear...\n');
  
  await page.goto('https://triznula.vercel.app/', { waitUntil: 'domcontentloaded' });

  // Wait for button to appear (should be after text finishes typing)
  // Text has ~150 chars * 20ms per char = 3 seconds + animation delay
  for (let i = 0; i < 30; i++) {
    const hasButton = await page.evaluate(() => {
      return document.body.innerText.includes('✨ Начать ✨');
    });
    
    if (hasButton) {
      console.log(`✅ Button appeared after ${i * 2} seconds`);
      break;
    }
    
    const text = await page.evaluate(() => document.body.innerText.substring(0, 200));
    if (i % 5 === 0) {
      console.log(`⏱️  ${i * 2}s - Text: ${text.substring(0, 80)}...`);
    }
    
    await page.waitForTimeout(2000);
  }

  await browser.close();
})();
