import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Enable audio context logging
  page.on('console', msg => {
    console.log(`[${msg.type()}]`, msg.text());
  });

  await page.goto('https://triznula.vercel.app/', { waitUntil: 'domcontentloaded' });
  
  await page.waitForTimeout(2000);

  // Get ALL audio sources
  const allAudio = await page.evaluate(() => {
    const elements = document.querySelectorAll('audio');
    const audioContexts = window.audioContext ? ['AudioContext exists'] : [];
    const mediaElements = Array.from(elements).map((el, i) => ({
      tag: `<audio ${i}>`,
      src: el.src,
      playing: !el.paused,
      volume: el.volume,
      muted: el.muted,
      autoplay: el.autoplay
    }));
    return { elements: mediaElements, contexts: audioContexts };
  });

  console.log('\n🔊 AUDIO ANALYSIS - DRAGON SPLASH SCREEN:\n');
  console.log('HTML <audio> tags:', allAudio.elements.length);
  allAudio.elements.forEach(a => {
    console.log(`  ✓ ${a.src.split('/').pop() || 'NO SRC'}`);
    console.log(`    → Playing: ${a.playing ? '▶️ YES' : '⏸️ NO'} | Muted: ${a.muted ? '🔇' : '🔊'} | Volume: ${a.volume}`);
  });

  // Try to find Web Audio API usage
  const webAudioUsage = await page.evaluate(() => {
    return {
      hasAudioContext: !!window.AudioContext || !!window.webkitAudioContext,
      hasMediaElement: document.querySelectorAll('audio, video').length > 0,
      scriptCount: document.querySelectorAll('script').length
    };
  });

  console.log('\nWeb Audio API:', webAudioUsage.hasAudioContext ? '✓ Available' : '✗ Not used');

  await browser.close();
})();
