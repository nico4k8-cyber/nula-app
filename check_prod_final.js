import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('🔍 Checking if app transitions after dragon...\n');
  
  await page.goto('https://triznula.vercel.app/', { waitUntil: 'domcontentloaded' });

  // Wait until animation should finish (12 seconds for 240 frames)
  await page.waitForTimeout(14000);

  // Check what phase we're in now
  const state = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      textPreview: text.substring(0, 300),
      hasDragonAnimation: !!document.querySelector('img[alt="Dragon animation"]'),
      hasBubble: text.includes('Привет'),
      hasAgeSelect: text.includes('НАЧАТЬ'),
      bodyText: text
    };
  });

  console.log('After 14 seconds:');
  console.log('Has dragon animation img:', state.hasDragonAnimation);
  console.log('Has bubble text:', state.hasBubble);
  console.log('Has age-select:', state.hasAgeSelect);
  console.log('\nFull text:');
  console.log(state.bodyText.substring(0, 500));

  await browser.close();
})();
