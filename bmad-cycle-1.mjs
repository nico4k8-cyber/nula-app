#!/usr/bin/env node
import puppeteer from 'puppeteer';

async function bmadCycle1() {
  console.log('\n🎯 BMAD ЦИКЛ #1: ПРОТЕСТИРОВАТЬ\n');

  const browser = await puppeteer.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900 });

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  try {
    console.log('🌐 Загружаю приложение...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 15000 });
    await sleep(4000);

    // Скриншот стартовой страницы
    await page.screenshot({ path: '/tmp/bmad-1-start.png' });
    console.log('📸 Start screen сохранён');

    // Нажми Start кнопку используя evaluate
    console.log('🎯 Нажимаю Start кнопку...');

    // Сначала скролим вниз чтобы найти кнопку
    await page.evaluate(() => window.scrollBy(0, 300));
    await sleep(1000);

    const startClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent?.includes('Начать') || b.textContent?.includes('✨'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (!startClicked) {
      console.log('❌ Start кнопка не найдена');
      const text = await page.evaluate(() => document.body.innerText.substring(0, 200));
      console.log('Текст на странице:', text);
      return;
    }

    await sleep(4000);

    // Скриншот списка задач
    await page.screenshot({ path: '/tmp/bmad-2-tasklist.png' });
    console.log('📸 Task list сохранён');

    // Выбери Solomon Hall
    console.log('👦 Выбираю Зал Соломона...');

    // Скролим через страницу чтобы найти все задачи
    await page.evaluate(() => {
      for (let i = 0; i < 5; i++) {
        window.scrollBy(0, 200);
      }
    });
    await sleep(2000);

    const taskFound = await page.evaluate(() => {
      const allText = document.body.innerText;
      if (allText.includes('Соломон')) {
        // Найди элемент который содержит Соломона
        const items = Array.from(document.querySelectorAll('button, div, [role="button"]'));
        const solomon = items.find(el => el.textContent?.includes('Соломон'));
        if (solomon) {
          solomon.scrollIntoView();
          solomon.click();
          return true;
        }
      }
      return false;
    });

    if (!taskFound) {
      console.log('❌ Задача не найдена');
      const allText = await page.evaluate(() => document.body.innerText.substring(0, 500));
      console.log('Текст на странице:', allText);
      return;
    }

    await sleep(3000);

    // Скриншот после выбора задачи
    await page.screenshot({ path: '/tmp/bmad-3-task-selected.png' });
    console.log('📸 Task selected сохранён');

    // Проверь наличие input
    const hasInput = await page.$('input, textarea');
    if (!hasInput) {
      console.log('❌ Input для ввода идеи не найден');
      return;
    }

    console.log('✅ Input найден - готово для ввода');

    // Введи идею (Фаза 0)
    console.log('\n📝 ФАЗА 0: Предложить идею');
    await hasInput.type('попробуем идти осторожно', { delay: 15 });
    console.log('✍️  Введено: "попробуем идти осторожно"');

    await page.keyboard.press('Enter');
    console.log('📤 Отправлено');
    await sleep(5000);

    // Скриншот после первого ответа
    await page.screenshot({ path: '/tmp/bmad-4-phase0-done.png' });
    console.log('📸 После Фазы 0 сохранён');

    // Проверь текст который появился
    const botReply = await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('div, span, p'));
      const msgs = divs.filter(el => el.textContent?.length > 30).slice(-3);
      return msgs.map(el => el.textContent.substring(0, 150)).join('\n---\n');
    });

    console.log('\n💬 Ответ бота:\n', botReply.substring(0, 300));

    console.log('\n✅ ФАЗА 0 УСПЕШНА');
    console.log('👀 Браузер открыт для инспекции');

  } catch (err) {
    console.error('\n❌ Ошибка:', err.message);
  }
}

bmadCycle1();
