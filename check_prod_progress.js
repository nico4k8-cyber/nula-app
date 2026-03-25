import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('🚀 Checking production app progression...\n');
  
  await page.goto('https://triznula.vercel.app/', { waitUntil: 'domcontentloaded' });

  // Check content at different times
  for (let i = 0; i < 6; i++) {
    const text = await page.evaluate(() => document.body.innerText.substring(0, 150));
    const hasImage = await page.evaluate(() => {
      const img = document.querySelector('img[alt="Dragon animation"]');
      return img ? `image frame: ${img.src.match(/frame-(\d+)/) ? img.src.match(/frame-(\d+)/)[1] : 'unknown'}` : 'no animation img';
    });
    
    console.log(`⏱️  ${i * 2}s: ${hasImage}`);
    console.log(`   Text: ${text.substring(0, 100)}\n`);
    
    await page.waitForTimeout(2000);
  }

  await browser.close();
})();
