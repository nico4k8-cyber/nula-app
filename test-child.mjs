#!/usr/bin/env node
import puppeteer from 'puppeteer';

async function test() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 600 });

  try {
    console.log('🎮 Открываю приложение...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    await sleep(2000);
    console.log('✅ Приложение загружено\n');

    // Фаза 0: Выбрать задачу и предложить идею
    console.log('📍 Фаза 0: Предложить идею');
    const inp = await page.$('input[type="text"]');
    if (!inp) {
      console.log('❌ Input не найден');
      return;
    }

    await inp.type('попробуем идти осторожно');
    await page.keyboard.press('Enter');
    console.log('👦: попробуем идти осторожно');

    await sleep(3000);
    console.log('✅ Сообщение отправлено\n');

    // Фаза 1a
    console.log('📍 Фаза 1a: Что хорошего?');
    const inp2 = await page.$('input[type="text"]');
    await inp2.focus();
    await inp2.type('не упадешь если быть внимательным');
    await page.keyboard.press('Enter');
    console.log('👦: не упадешь если быть внимательным');

    await sleep(3000);
    console.log('✅ Ответ записан\n');

    console.log('✅ Тестирование в процессе!');
    console.log('   Браузер открыт, продолжай взаимодействовать с приложением\n');

  } catch (err) {
    console.error('❌', err.message);
  }
}

test();
