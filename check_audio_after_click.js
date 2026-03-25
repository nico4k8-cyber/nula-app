import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('https://triznula.vercel.app/', { waitUntil: 'domcontentloaded' });
  
  console.log('🎮 Simulating user interaction on splash screen...\n');

  // Click/touch to unmute
  await page.click('body');
  await page.waitForTimeout(1000);

  // Check audio after click
  const audioAfterClick = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('audio')).map((el, i) => ({
      id: i,
      src: el.src.split('/').pop(),
      playing: !el.paused,
      muted: el.muted,
      volume: el.volume,
      currentTime: el.currentTime.toFixed(2)
    }));
  });

  console.log('After user click:');
  audioAfterClick.forEach(a => {
    console.log(`  [${a.id}] ${a.src}`);
    console.log(`      → Playing: ${a.playing ? '▶️ YES' : '⏸️ NO'} | Muted: ${a.muted ? '🔇' : '🔊'} | Time: ${a.currentTime}s`);
  });

  // Get global globalAudioRef from useAudio
  const globalAudio = await page.evaluate(() => {
    // Try to access the global audio from useAudio hook
    const audios = document.querySelectorAll('audio');
    return {
      totalAudioTags: audios.length,
      allPlaying: Array.from(audios).filter(a => !a.paused).length,
      allMuted: Array.from(audios).filter(a => a.muted).length
    };
  });

  console.log('\nGlobal audio state:');
  console.log(`  Total <audio> tags: ${globalAudio.totalAudioTags}`);
  console.log(`  Playing: ${globalAudio.allPlaying}`);
  console.log(`  Muted: ${globalAudio.allMuted}`);

  await browser.close();
})();
