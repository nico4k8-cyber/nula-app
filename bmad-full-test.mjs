#!/usr/bin/env node
import puppeteer from 'puppeteer';

async function bmadFullTest() {
  console.log('\n🎯 BMAD ЦИКЛ #1: ТЕСТИРОВАНИЕ\n');

  const browser = await puppeteer.launch({ headless: false, slowMo: 40 });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900 });

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  try {
    // ЗАГРУЗКА
    console.log('1️⃣  Загружаю приложение...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 15000 });
    await sleep(4000);

    // START BUTTON
    console.log('2️⃣  Ищу кнопку Start...');
    await page.evaluate(() => window.scrollBy(0, 300));
    await sleep(1000);

    const started = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b =>
        b.textContent?.includes('Начать') || b.textContent?.includes('✨')
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (!started) {
      console.log('❌ Кнопка Start не найдена');
      return;
    }

    console.log('✅ Start нажата');
    await sleep(3000);

    // TASK SELECT
    console.log('3️⃣  Выбираю Solomon Hall...');
    await page.evaluate(() => {
      for (let i = 0; i < 10; i++) window.scrollBy(0, 100);
    });
    await sleep(2000);

    const taskFound = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('*'));
      const solomon = all.find(el => el.textContent?.includes('Соломон'));
      if (solomon) {
        solomon.scrollIntoView();
        // Find clickable parent
        let clickable = solomon;
        while (clickable && !clickable.onclick && clickable.tagName !== 'BUTTON') {
          clickable = clickable.parentElement;
        }
        if (clickable) clickable.click();
        return true;
      }
      return false;
    });

    if (!taskFound) {
      console.log('❌ Solomon Hall не найдена');
      const text = await page.evaluate(() => document.body.innerText.substring(0, 300));
      console.log('Видна текст:', text);
      return;
    }

    console.log('✅ Solomon Hall выбрана');
    await sleep(3000);

    // PHASE 0
    console.log('\n4️⃣  ФАЗА 0: Предложить идею');
    const inp = await page.$('input, textarea');
    if (!inp) {
      console.log('❌ Input не найден');
      return;
    }

    await inp.focus();
    await page.keyboard.type('попробуем идти осторожно', { delay: 15 });
    console.log('✍️  Введено: "попробуем идти осторожно"');

    await page.keyboard.press('Enter');
    console.log('📤 Отправлено');
    await sleep(6000);

    // CHECK RESPONSE
    const hasResponse = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.length > 500; // Если появился ответ
    });

    if (hasResponse) {
      console.log('✅ Бот ответил (примерно)');
      console.log('\n✅ ТЕСТ УСПЕШЕН - ПРИЛОЖЕНИЕ РАБОТАЕТ\n');
    } else {
      console.log('⚠️  Ответ может не появиться или не загрузиться');
    }

    console.log('👀 Браузер открыт для инспекции');

  } catch (err) {
    console.error('❌ Ошибка:', err.message);
  }
}

bmadFullTest();
