import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:5174', { waitUntil: 'domcontentloaded' });
  
  console.log('🎶 Testing music behavior...\n');

  // Wait for splash to finish
  await page.waitForTimeout(16000);

  // Click button
  await page.click('text=✨ Начать ✨', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // Select age
  await page.click('button:has-text("НАЧАТЬ")', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // Now we should be on picker - check if music is playing
  const beforeClick = await page.evaluate(() => {
    const audios = document.querySelectorAll('audio');
    return Array.from(audios).filter(a => !a.paused).length;
  });

  console.log(`Before click: ${beforeClick} audio(s) playing`);

  // Click a random button
  await page.click('button', { timeout: 2000 }).catch(() => {});
  await page.waitForTimeout(500);

  const afterClick = await page.evaluate(() => {
    const audios = document.querySelectorAll('audio');
    return Array.from(audios).filter(a => !a.paused).length;
  });

  console.log(`After click: ${afterClick} audio(s) playing`);
  console.log(`Music ${beforeClick === afterClick ? '✅ CONTINUES' : '❌ INTERRUPTED'}`);

  await browser.close();
})();
