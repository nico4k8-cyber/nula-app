import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('https://triznula.vercel.app/', { waitUntil: 'domcontentloaded' });
  
  console.log('🔍 Following full app flow...\n');

  // Wait until we reach age-select (after button click)
  await page.waitForTimeout(20000); // 20 seconds to get through splash + bubble
  
  // Click button if it exists
  try {
    await page.click('text=✨ Начать ✨', { timeout: 5000 });
    console.log('✅ Clicked button');
  } catch {
    console.log('❌ Button not found');
  }

  await page.waitForTimeout(2000);

  // Check audio elements
  const audios = await page.evaluate(() => {
    const elements = document.querySelectorAll('audio');
    return Array.from(elements).map((el, i) => ({
      index: i,
      src: el.src.split('/').pop(),
      playing: !el.paused,
      volume: el.volume,
      muted: el.muted
    }));
  });

  console.log('\n🎵 Audio elements on age-select screen:');
  console.log(`Total: ${audios.length}`);
  audios.forEach(a => {
    console.log(`  [${a.index}] ${a.src} - ${a.playing ? '▶️ PLAYING' : '⏸️ PAUSED'} (vol: ${a.volume}, muted: ${a.muted})`);
  });

  // Now select age and click НАЧАТЬ to go to picker
  try {
    await page.click('button:has-text("НАЧАТЬ")');
    console.log('\n✅ Clicked НАЧАТЬ button');
  } catch {
    console.log('\n❌ НАЧАТЬ button not found');
  }

  await page.waitForTimeout(2000);

  // Check audio again
  const audios2 = await page.evaluate(() => {
    const elements = document.querySelectorAll('audio');
    return Array.from(elements).map((el, i) => ({
      index: i,
      src: el.src.split('/').pop(),
      playing: !el.paused,
      volume: el.volume
    }));
  });

  console.log('\n🎵 Audio elements on picker screen:');
  console.log(`Total: ${audios2.length}`);
  audios2.forEach(a => {
    console.log(`  [${a.index}] ${a.src} - ${a.playing ? '▶️ PLAYING' : '⏸️ PAUSED'} (vol: ${a.volume})`);
  });

  await browser.close();
})();
