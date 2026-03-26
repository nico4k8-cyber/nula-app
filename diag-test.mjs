#!/usr/bin/env node
/**
 * Диагностический тест: показывает полный HTML и что на странице
 */
import puppeteer from 'puppeteer';

async function diagTest() {
  console.log('\n🔍 ДИАГНОСТИЧЕСКИЙ ТЕСТ\n');

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900 });

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  try {
    console.log('🌐 Открываю приложение...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 15000 });

    console.log('⏳ Жду 5 секунд для полной загрузки...');
    await sleep(5000);

    // Получаем полный HTML
    const html = await page.content();
    console.log('\n📄 === HTML СТРАНИЦЫ ===\n');
    console.log(html.substring(0, 2000)); // Первые 2000 символов
    console.log('\n... (более 2000 символов HTML) ...\n');

    // Получаем информацию о странице
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        body_html: document.body.innerHTML.substring(0, 500),
        all_text: document.body.innerText.substring(0, 500),
        inputs_count: document.querySelectorAll('input').length,
        buttons_count: document.querySelectorAll('button').length,
        divs_count: document.querySelectorAll('div').length,
        script_tags: document.querySelectorAll('script').length,
        react_root: document.getElementById('root') ? 'есть' : 'нет',
        body_class: document.body.className,
        body_id: document.body.id,
      };
    });

    console.log('📊 === ИНФОРМАЦИЯ О СТРАНИЦЕ ===');
    console.log(`Title: ${pageInfo.title}`);
    console.log(`React Root: ${pageInfo.react_root}`);
    console.log(`Body Class: ${pageInfo.body_class}`);
    console.log(`Body ID: ${pageInfo.body_id}`);
    console.log(`Inputs: ${pageInfo.inputs_count}`);
    console.log(`Buttons: ${pageInfo.buttons_count}`);
    console.log(`Divs: ${pageInfo.divs_count}`);
    console.log(`Scripts: ${pageInfo.script_tags}`);
    console.log(`\nBody HTML (first 500 chars):\n${pageInfo.body_html}`);
    console.log(`\nBody Text (first 500 chars):\n${pageInfo.all_text}`);

    // Нажимаем Start
    console.log('\n🎯 Нажимаю кнопку Start...');
    const clicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b =>
        b.textContent.includes('Начать') || b.textContent.includes('Start')
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    console.log(clicked ? '✅ Кнопка найдена и нажата' : '❌ Кнопка не найдена');

    await sleep(3000);

    // Снова проверяем страницу
    const pageInfo2 = await page.evaluate(() => {
      return {
        all_text: document.body.innerText.substring(0, 800),
        inputs_count: document.querySelectorAll('input').length,
        buttons_count: document.querySelectorAll('button').length,
      };
    });

    console.log('\n📊 === ПОСЛЕ НАЖАТИЯ КНОПКИ ===');
    console.log(`Inputs: ${pageInfo2.inputs_count}`);
    console.log(`Buttons: ${pageInfo2.buttons_count}`);
    console.log(`\nText on page:\n${pageInfo2.all_text}`);

    // Консоль браузера
    page.on('console', msg => console.log('🖥️ BROWSER:', msg.text()));
    page.on('error', err => console.log('🔴 PAGE ERROR:', err));

    console.log('\n👀 Браузер открыт для инспекции...');
    console.log('Закрой окно браузера когда закончишь');

  } catch (err) {
    console.error('\n❌ ОШИБКА:', err.message);
    console.error(err.stack);
    await browser.close();
    process.exit(1);
  }
}

diagTest();
