import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Capture all messages
  const messages = [];
  page.on('console', msg => {
    messages.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  page.on('pageerror', err => {
    messages.push(`[ERROR] ${err.toString()}`);
  });

  console.log('🔍 Loading production: https://triznula.vercel.app/');
  
  try {
    await page.goto('https://triznula.vercel.app/', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
  } catch (err) {
    console.log('Navigation error:', err.message);
  }

  await page.waitForTimeout(3000);

  // Check page state
  const state = await page.evaluate(() => {
    const root = document.getElementById('root');
    return {
      htmlContent: document.documentElement.innerHTML.substring(0, 300),
      rootExists: !!root,
      rootChildren: root ? root.children.length : 0,
      errors: window.__errors || [],
      visibleText: document.body.innerText.substring(0, 300)
    };
  });

  console.log('\n📊 Console messages:');
  messages.forEach(m => console.log(m));
  
  console.log('\n📄 Page state:');
  console.log('Root exists:', state.rootExists);
  console.log('Root children:', state.rootChildren);
  console.log('Visible text preview:', state.visibleText);

  await browser.close();
})();
