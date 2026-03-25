import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Monitor all <audio> tags created
  await page.addInitScript(() => {
    window.__audioLogs = [];
    const originalAudio = window.Audio;
    let count = 0;
    
    window.Audio = function(...args) {
      const inst = new originalAudio(...args);
      count++;
      window.__audioLogs.push(`[${count}] Audio created`);
      return inst;
    };
  });

  page.on('console', msg => {
    if (msg.type() === 'log') console.log('[PAGE]', msg.text());
  });

  console.log('🔍 Loading production...');
  await page.goto('https://triznula.vercel.app/', { waitUntil: 'domcontentloaded' });
  
  await page.waitForTimeout(2000);

  // Check what audio elements exist
  const state = await page.evaluate(() => {
    const htmlAudios = Array.from(document.querySelectorAll('audio')).map((a, i) => ({
      id: `html_${i}`,
      src: a.src.split('/').pop() || '(no src)',
      playing: !a.paused,
      muted: a.muted
    }));
    
    return {
      htmlAudios,
      audioCreated: window.__audioLogs
    };
  });

  console.log('\n📊 HTML <audio> elements:');
  state.htmlAudios.forEach(a => {
    console.log(`  ${a.id}: ${a.src} | Playing: ${a.playing} | Muted: ${a.muted}`);
  });

  console.log('\n📊 Audio() constructor calls:');
  state.audioCreated.forEach(log => console.log(`  ${log}`));

  await browser.close();
})();
