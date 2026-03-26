#!/usr/bin/env node
/**
 * Test TRIZ game as a child
 * Автоматически проходит всю задачу через браузер
 */

import puppeteer from 'puppeteer';

async function testAsChild() {
  console.log('🎮 Запускаю браузер для тестирования TRIZ задачи\n');

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Размер окна как у настоящего ребёнка
  await page.setViewport({ width: 800, height: 600 });

  try {
    // Открыть приложение
    console.log('📱 Открываю http://localhost:5173');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 10000 });

    await new Promise(r => setTimeout(r,2000);

    // Проверить, загрузилась ли главная страница
    const title = await page.title();
    console.log(`✅ Страница загружена: "${title}"\n`);

    // Найти задачу "Зал Соломона"
    console.log('🔍 Ищу задачу "Зал Соломона"');

    // Попытка найти по тексту или ID
    const solomonTask = await page.evaluate(() => {
      // Ищем по ID задачи
      const task = document.querySelector('[data-task-id="solomon-hall"]') ||
                   Array.from(document.querySelectorAll('div, button')).find(el =>
                     el.textContent.includes('Соломона')
                   );
      return task ? task.outerHTML.substring(0, 100) : null;
    });

    if (solomonTask) {
      console.log('✅ Найдена задача\n');
    } else {
      console.log('⚠️  Задача не найдена в DOM, ищу по другому...\n');
    }

    // Кликнуть на задачу (попытка 1 - по селектору)
    try {
      await page.click('[data-task-id="solomon-hall"]');
      console.log('✅ Кликнул на задачу (по ID)');
    } catch {
      try {
        // Попытка 2 - найти по тексту
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button, div'));
          const btn = btns.find(b => b.textContent.includes('Соломона'));
          if (btn) btn.click();
        });
        console.log('✅ Кликнул на задачу (по тексту)');
      } catch (e) {
        console.log('❌ Не смог кликнуть на задачу:', e.message);
        await browser.close();
        return;
      }
    }

    await new Promise(r => setTimeout(r,2000);

    // Фаза 0: Предложить идею
    console.log('\n📍 Фаза 0: Предложить идею');
    console.log('👦 Ребёнок говорит: "Попробуем идти осторожно"');

    const input = await page.$('input[type="text"], textarea');
    if (!input) {
      console.log('❌ Поле ввода не найдено');
      await browser.close();
      return;
    }

    await input.type('попробуем идти осторожно', { delay: 50 });

    // Отправить сообщение (Enter или кнопка)
    await page.keyboard.press('Enter');

    console.log('⏳ Ожидаю ответ бота...');
    await new Promise(r => setTimeout(r,3000);

    let botReply = await page.evaluate(() => {
      const messages = document.querySelectorAll('[data-type="bot"], .bot-message, div');
      const lastMsg = Array.from(messages).reverse().find(m => m.textContent.length > 10);
      return lastMsg ? lastMsg.textContent.substring(0, 100) : 'нет ответа';
    });

    console.log(`🐉 Бот: "${botReply}..."\n`);

    // Фаза 1a: Что хорошего?
    console.log('📍 Фаза 1a: Что хорошего в идее?');
    console.log('👦 Ребёнок: "Если быть внимательным, то не упадёшь"');

    const input2 = await page.$('input[type="text"], textarea');
    await input2.click();
    await input2.type('если быть внимательным, то не упадешь', { delay: 50 });
    await page.keyboard.press('Enter');

    console.log('⏳ Ожидаю ответ...');
    await new Promise(r => setTimeout(r,3000);

    botReply = await page.evaluate(() => {
      const messages = document.querySelectorAll('[data-type="bot"], .bot-message');
      const lastMsg = Array.from(messages).reverse()[0];
      return lastMsg ? lastMsg.textContent.substring(0, 100) : 'нет ответа';
    });

    console.log(`🐉 Бот: "${botReply}..."\n`);

    // Фаза 1b: Что плохого?
    console.log('📍 Фаза 1b: Что плохого?');
    console.log('👦 Ребёнок: "Масло очень скользкое, можно упасть"');

    const input3 = await page.$('input[type="text"], textarea');
    await input3.click();
    await input3.type('масло очень скользкое, можно упасть', { delay: 50 });
    await page.keyboard.press('Enter');

    console.log('⏳ Ожидаю ответ...');
    await new Promise(r => setTimeout(r,3000);

    botReply = await page.evaluate(() => {
      const messages = document.querySelectorAll('[data-type="bot"], .bot-message');
      const lastMsg = Array.from(messages).reverse()[0];
      return lastMsg ? lastMsg.textContent.substring(0, 100) : 'нет ответа';
    });

    console.log(`🐉 Бот: "${botReply}..."\n`);

    // Проверить текущее состояние
    const state = await page.evaluate(() => {
      return window.__trizState || { phase: '?' };
    });

    console.log(`📊 Состояние: фаза ${state.phase}\n`);

    console.log('✅ Тестирование завершено!');
    console.log('   Браузер остаётся открытым для дальнейшего тестирования');
    console.log('   Закрой окно браузера когда закончишь\n');

    // Оставить браузер открытым для дальнейшего изучения
    // await browser.close();

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    await browser.close();
  }
}

testAsChild().catch(console.error);
