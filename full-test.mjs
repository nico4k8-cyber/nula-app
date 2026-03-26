#!/usr/bin/env node
import puppeteer from 'puppeteer';

async function testFullFlow() {
  console.log('\n🎮 ПОЛНОЕ ТЕСТИРОВАНИЕ TRIZ ИГРЫ\n');
  const browser = await puppeteer.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 800 });

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const log = (msg, icon = '→') => console.log(`${icon} ${msg}`);

  try {
    // === ФАЗА 0: Загрузка и выбор задачи ===
    log('Открываю приложение...', '🌐');
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await sleep(3000);

    log('Ищу задачу "Зал Соломона"...', '🔍');

    // Попробовать кликнуть на любую видимую задачу с "Соломона"
    await page.evaluate(() => {
      const allText = Array.from(document.querySelectorAll('*')).find(el =>
        el.textContent.includes('Соломона') && (el.tagName === 'BUTTON' || el.onclick)
      );
      if (allText) allText.click();
    });

    await sleep(2000);
    log('✅ Задача выбрана', '👦');

    // === ФАЗА 1: Введение идеи (фаза 0) ===
    console.log('\n📍 ФАЗА 0: Предложить идею\n');

    const inp1 = await page.$('input[type="text"], textarea');
    if (!inp1) {
      log('Input не найден!', '❌');
      await browser.close();
      return;
    }

    await inp1.focus();
    const idea1 = 'попробуем идти осторожно';
    await page.keyboard.type(idea1, { delay: 30 });
    log(`Ребёнок: "${idea1}"`, '👦');

    await page.keyboard.press('Enter');
    log('Отправил сообщение', '📤');
    await sleep(4000);

    let botMsg = await page.evaluate(() => {
      const msgs = Array.from(document.querySelectorAll('div')).filter(el =>
        el.textContent.length > 20 && el.textContent.includes('дра') || el.textContent.includes('Ой')
      );
      return msgs[msgs.length - 1]?.textContent?.substring(0, 100) || 'нет ответа';
    });
    log(`Бот: "${botMsg}..."`, '🐉');

    // === ФАЗА 1a: Что хорошего? ===
    console.log('\n📍 ФАЗА 1a: Что хорошего?\n');

    const inp2 = await page.$('input[type="text"], textarea');
    await inp2.focus();
    await inp2.click({ clickCount: 3 }); // Select all
    await page.keyboard.press('Backspace');

    const good = 'если быть внимательным, не упадешь';
    await page.keyboard.type(good, { delay: 30 });
    log(`Ребёнок: "${good}"`, '👦');

    await page.keyboard.press('Enter');
    await sleep(4000);

    botMsg = await page.evaluate(() => {
      const msgs = Array.from(document.querySelectorAll('div'));
      const lastMsg = msgs.reverse().find(m => m.textContent.length > 10);
      return lastMsg?.textContent?.substring(0, 80) || 'нет';
    });
    log(`Бот: "${botMsg}..."`, '🐉');

    // === ФАЗА 1b: Что плохого? ===
    console.log('\n📍 ФАЗА 1b: Что плохого?\n');

    const inp3 = await page.$('input[type="text"], textarea');
    await inp3.focus();
    await inp3.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');

    const bad = 'масло очень скользкое, упадешь';
    await page.keyboard.type(bad, { delay: 30 });
    log(`Ребёнок: "${bad}"`, '👦');

    await page.keyboard.press('Enter');
    await sleep(4000);

    // === ФАЗА 2-3: Противоречие и ресурсы ===
    console.log('\n📍 ФАЗА 2-3: Противоречие и ресурсы\n');

    botMsg = await page.evaluate(() => {
      const msgs = Array.from(document.querySelectorAll('div'));
      const lastMsg = msgs.reverse().find(m => m.textContent.length > 20);
      return lastMsg?.textContent?.substring(0, 80) || 'нет';
    });
    log(`Бот: "${botMsg}..."`, '🐉');

    // Проверить, появились ли кнопки ресурсов
    const resourceBtns = await page.$$('button:not(.hidden)');
    log(`Найдено кнопок на странице: ${resourceBtns.length}`, '🔘');

    // === ФАЗА 4: Использовать ресурс ===
    console.log('\n📍 ФАЗА 4: Проверить ресурсы\n');

    const inp4 = await page.$('input[type="text"], textarea');
    await inp4.focus();
    await inp4.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');

    const resource = 'можно положить ковры и идти по ним';
    await page.keyboard.type(resource, { delay: 30 });
    log(`Ребёнок: "${resource}"`, '👦');

    await page.keyboard.press('Enter');
    await sleep(4000);

    // === ФАЗА 5-7: ИКР и завершение ===
    console.log('\n📍 ФАЗА 5-7: ИКР, улучшение, завершение\n');

    botMsg = await page.evaluate(() => {
      const msgs = Array.from(document.querySelectorAll('div'));
      const lastMsg = msgs.reverse().find(m => m.textContent.length > 20);
      return lastMsg?.textContent?.substring(0, 100) || 'нет';
    });
    log(`Бот финальный: "${botMsg}..."`, '🐉');

    // === РЕЗУЛЬТАТ ===
    console.log('\n✅ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО\n');
    log('Браузер остаётся открытым - посмотри результат', '👀');
    log('Закрой окно браузера когда закончишь', '❌');

  } catch (err) {
    console.error('\n❌ Ошибка:', err.message);
    await browser.close();
  }
}

testFullFlow();
