import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Catch audio elements
  const audioElements = [];
  page.on('console', msg => {
    if (msg.text().includes('audio') || msg.text().includes('Audio')) {
      console.log('[CONSOLE]', msg.text());
    }
  });

  await page.goto('https://triznula.vercel.app/', { waitUntil: 'domcontentloaded' });
  
  // Check for audio elements
  const audios = await page.evaluate(() => {
    const elements = document.querySelectorAll('audio');
    return Array.from(elements).map((el, i) => ({
      index: i,
      src: el.src,
      autoplay: el.autoplay,
      loop: el.loop,
      muted: el.muted
    }));
  });

  console.log('🔊 Audio elements found:', audios.length);
  audios.forEach(a => console.log(a));

  await page.waitForTimeout(3000);

  // Check what's playing
  const playing = await page.evaluate(() => {
    const elements = document.querySelectorAll('audio');
    return Array.from(elements).map((el, i) => ({
      index: i,
      playing: !el.paused,
      currentTime: el.currentTime.toFixed(2)
    }));
  });

  console.log('\n📊 After 3 seconds:');
  playing.forEach(p => console.log(`Audio ${p.index}: ${p.playing ? '▶️ PLAYING' : '⏸️ PAUSED'} (${p.currentTime}s)`));

  await browser.close();
})();
