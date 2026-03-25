import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Inject code to monitor Audio constructor
  await page.addInitScript(() => {
    const originalAudio = window.Audio;
    let audioInstances = [];
    
    window.Audio = function(...args) {
      const instance = new originalAudio(...args);
      audioInstances.push({
        src: instance.src,
        created: true,
        id: audioInstances.length
      });
      console.log(`[AUDIO CREATED] #${audioInstances.length} - src: ${instance.src || 'NONE'}`);
      return instance;
    };
    
    window.__audioInstances = audioInstances;
  });

  page.on('console', msg => {
    if (msg.text().includes('AUDIO')) console.log('→', msg.text());
  });

  await page.goto('http://localhost:5174', { waitUntil: 'domcontentloaded' });
  
  await page.waitForTimeout(5000);

  const instances = await page.evaluate(() => window.__audioInstances);
  console.log('\n🎵 Audio instances created:', instances.length);
  instances.forEach(a => console.log(`  - ${a.src || '(no src)'}`));

  await browser.close();
})();
