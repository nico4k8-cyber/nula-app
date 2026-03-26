#!/usr/bin/env node
/**
 * Quick TRIZ flow test for BMAD critique
 */
import puppeteer from 'puppeteer';

async function testBMAD() {
  console.log('\n🎯 BMAD TEST: Проверяю качество приложения\n');

  const browser = await puppeteer.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900 });

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const log = (msg, icon = '→') => console.log(`${icon} ${msg}`);

  try {
    // === ЗАГРУЗКА И START ===
    log('1️⃣  Загружаю приложение...', '🌐');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 15000 });
    await sleep(3000);

    log('Нажимаю Start...', '🎯');
    await page.click('button');  // Start button
    await sleep(3000);

    // ===  ВЫБИРАЮ SOLOMON-HALL ===
    log('2️⃣  Выбираю "Зал Соломона"...', '👦');
    const found = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
      const btn = btns.find(b => b.textContent?.includes('Соломон'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (!found) {
      log('❌ Task button не найдена', '❌');
      return;
    }

    log('Task выбрана', '✅');
    await sleep(3000);

    // === ФАЗА 0: Предложить идею ===
    log('3️⃣  ФАЗА 0: Предложить идею', '📝');

    const inp = await page.$('input, textarea');
    if (!inp) {
      log('❌ Input не найден!', '❌');
      const html = await page.evaluate(() => document.body.innerText.substring(0, 300));
      log(`Page text: ${html}`, '📄');
      return;
    }

    await inp.focus();
    await page.keyboard.type('попробуем идти осторожно', { delay: 20 });
    log('Введено: "попробуем идти осторожно"', '✍️');

    await page.keyboard.press('Enter');
    log('Отправлено', '📤');
    await sleep(5000);

    // === ФАЗА 1a: Что хорошего? ===
    log('4️⃣  ФАЗА 1a: Что хорошего?', '💭');

    const inp2 = await page.$('input, textarea');
    if (inp2) {
      await inp2.focus();
      await inp2.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.keyboard.type('если быть внимательным, не упадешь', { delay: 20 });
      log('Ребёнок: "если быть внимательным, не упадешь"', '👦');
      await page.keyboard.press('Enter');
      await sleep(4000);
      log('✅ Ответ отправлен', '📤');
    }

    // === ФАЗА 1b: Что плохого? ===
    log('5️⃣  ФАЗА 1b: Что плохого?', '💭');

    const inp3 = await page.$('input, textarea');
    if (inp3) {
      await inp3.focus();
      await inp3.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.keyboard.type('масло очень скользкое, упадешь', { delay: 20 });
      log('Ребёнок: "масло очень скользкое, упадешь"', '👦');
      await page.keyboard.press('Enter');
      await sleep(4000);
      log('✅ Ответ отправлен', '📤');
    }

    // === CHECK STATE ===
    log('6️⃣  Проверяю состояние после фаз...', '🔍');
    const state = await page.evaluate(() => {
      const msgs = Array.from(document.querySelectorAll('div, span, p'))
        .map(el => el.textContent)
        .filter(t => t?.length > 20)
        .slice(-3);
      return {
        visibleElements: document.querySelectorAll('button, input, textarea, [role="button"]').length,
        lastMessages: msgs
      };
    });

    log(`Видимых элементов: ${state.visibleElements}`, '📊');
    log(`Последние сообщения: ${state.lastMessages.join(' | ')}`, '💬');

    log('\n✅ ТЕСТ ЗАВЕРШЁН', '🎉');
    log('Браузер открыт для инспекции', '👀');

  } catch (err) {
    console.error('\n❌ Ошибка:', err.message);
    await browser.close();
    process.exit(1);
  }
}

testBMAD();
