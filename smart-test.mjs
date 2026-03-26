#!/usr/bin/env node
/**
 * Умный тест: находит input элементом, проходит все фазы
 */
import puppeteer from 'puppeteer';

async function smartTest() {
  console.log('\n🎮 УМНЫЙ ТЕСТ TRIZ ИГРЫ\n');

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900 });

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const log = (msg, icon) => console.log(`${icon} ${msg}`);

  try {
    // ЗАГРУЗКА
    log('Открываю приложение на localhost:5173...', '🌐');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 15000 });

    // Ждём, пока элементы появятся
    log('Жду загрузки React компонентов...', '⏳');
    let ready = false;
    for (let i = 0; i < 10; i++) {
      await sleep(1000);
      const hasElements = await page.evaluate(() => {
        return document.querySelectorAll('button, input, [role="button"]').length > 0 ||
               document.querySelectorAll('*').length > 50;
      });
      if (hasElements) {
        ready = true;
        log('Компоненты загружены!', '✅');
        break;
      }
    }

    if (!ready) {
      log('Компоненты не загружаются после 10 секунд', '⚠️');
    }

    await sleep(1000);

    // Инспектируем страницу
    log('Инспектирую DOM структуру...', '🔍');

    const pageInfo = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const allText = Array.from(allElements)
        .filter(el => el.childNodes.length > 0 && el.children.length === 0)
        .map(el => el.textContent.trim())
        .filter(t => t.length > 0 && t.length < 100)
        .slice(0, 10);

      return {
        title: document.title,
        inputCount: document.querySelectorAll('input').length,
        textareaCount: document.querySelectorAll('textarea').length,
        buttons: document.querySelectorAll('button').length,
        divs: document.querySelectorAll('div').length,
        allInputs: Array.from(document.querySelectorAll('input, textarea')).map((el, i) => ({
          index: i,
          type: el.tagName,
          inputType: el.type,
          placeholder: el.placeholder,
          className: el.className,
          id: el.id,
          visible: el.offsetParent !== null
        })),
        textOnPage: allText
      };
    });

    log(`Найдено: ${pageInfo.inputCount} inputs, ${pageInfo.textareaCount} textarea, ${pageInfo.buttons} buttons`, '📊');
    log(`На странице видно: ${pageInfo.textOnPage.join(' | ')}`, '📄');

    if (pageInfo.allInputs.length === 0) {
      log('⚠️  Нет input элементов на странице!', '⚠️');
      log('Проверяю, может ли быть это на другой странице...', '🤔');

      // Попробуем скролить вниз
      await page.evaluate(() => window.scrollBy(0, 500));
      await sleep(1000);

      // Проверим, может быть нужно что-то кликнуть
      const clickables = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button, [role="button"], div[onclick], [class*="task"], [class*="button"]'))
          .slice(0, 5)
          .map((el, i) => ({index: i, text: el.textContent.substring(0, 50), tag: el.tagName}));
      });

      log(`Кликабельные элементы найдено: ${clickables.length}`, '🔘');
      clickables.forEach((c, i) => {
        log(`  ${i}: "${c.text}" (${c.tag})`, '→');
      });
    }

    // НАЖИМАЕМ КНОПКУ "НАЧАТЬ" ЕСЛИ ОНА ЕСТЬ
    const startBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const startBtn = btns.find(b => b.textContent.includes('Начать'));
      if (startBtn) {
        startBtn.click();
        return true;
      }
      return false;
    });

    if (startBtn) {
      log('Нажимаю кнопку "Начать"...', '🎯');
      await sleep(2000);
      log('Задачи должны загружаться...', '⏳');
      await sleep(2000);
    }

    // ВЫБОР ЗАДАЧИ
    log('\nЧас 1: Выбираю задачу "Зал Соломона"...', '👦');

    const taskClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, div[role="button"], [class*="task"]'));
      const solomon = btns.find(b => b.textContent.includes('Соломона'));
      if (solomon) {
        solomon.click();
        return true;
      }
      return false;
    });

    if (taskClicked) {
      log('Задача выбрана!', '✅');
      await sleep(2000);
    } else {
      log('Не смог найти кнопку задачи', '❌');
      await sleep(1000);
    }

    // ПОИСК INPUT ПОСЛЕ ВЫБОРА ЗАДАЧИ
    log('\nШаг 2: Ищу input после выбора задачи...', '🔍');

    const inputsAfter = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input, textarea')).map((el, i) => ({
        index: i,
        type: el.tagName,
        visible: el.offsetParent !== null,
        id: el.id,
        placeholder: el.placeholder
      }));
    });

    log(`Найдено ${inputsAfter.length} inputs`, '📋');

    const visibleInput = inputsAfter.find(i => i.visible);
    if (!visibleInput) {
      log('❌ Видимого input не найдено!', '❌');
      log('Скриншот сохранён для отладки', '📸');
      await page.screenshot({ path: '/tmp/triz-screenshot.png' });
    } else {
      log(`Видимый input найден! index=${visibleInput.index}`, '✅');

      // ТЕСТИРУЕМ ВВОД
      log('\nШаг 3: Тестирую ввод текста (фаза 0)...', '📝');

      const inputSelector = visibleInput.index === 0 ? 'input, textarea' : `input:nth-of-type(${visibleInput.index + 1}), textarea`;

      const inputEl = await page.$(inputSelector);
      if (inputEl) {
        await inputEl.focus();
        await page.keyboard.type('попробуем идти осторожно', { delay: 30 });
        log('Введено: "попробуем идти осторожно"', '✍️');

        await page.keyboard.press('Enter');
        log('Сообщение отправлено!', '📤');

        await sleep(4000);

        log('⏳ Ожидаю ответ бота...', '🐉');

        // Проверяем, появился ли ответ
        const botMsg = await page.evaluate(() => {
          const msgs = Array.from(document.querySelectorAll('div, span, p'));
          const msg = msgs.reverse().find(m =>
            m.textContent.length > 20 &&
            (m.textContent.includes('дра') || m.textContent.includes('Ой') || m.textContent.includes('Что'))
          );
          return msg ? msg.textContent.substring(0, 150) : null;
        });

        if (botMsg) {
          log(`Бот ответил: "${botMsg}..."`, '🐉');
          log('\n✅ ТЕСТ УСПЕШЕН! Приложение работает!', '🎉');
        } else {
          log('Ответ бота не найден на странице', '⚠️');
        }
      } else {
        log('Не смог получить доступ к input элементу', '❌');
      }
    }

    log('\n👀 Браузер остаётся открытым для инспекции', '👀');
    log('Закрой окно браузера когда закончишь', '❌');

  } catch (err) {
    console.error('\n❌ ОШИБКА:', err.message);
    console.error(err.stack);
    await browser.close();
    process.exit(1);
  }
}

smartTest();
