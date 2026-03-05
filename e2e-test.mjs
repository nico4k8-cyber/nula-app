#!/usr/bin/env node
/**
 * E2E тест ТРИЗ-тренажёра с поддержкой кириллицы.
 * Использует locator.fill() для ввода Unicode-текста.
 * 
 * Запуск: node e2e-test.mjs [url]
 */
import { chromium } from 'playwright';

const URL = process.argv[2] || 'https://formula-intellect.vercel.app';
const TIMEOUT = 5000;

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function run() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });

    console.log(`🌐 Открываю ${URL}...`);
    await page.goto(URL, { waitUntil: 'networkidle' });

    // 1. Выбираем задачу "Побег из дворца"
    console.log('📌 Выбираю задачу "Побег из дворца"...');
    await page.getByText('Побег из дворца').click();
    await sleep(1000);

    // 2. Проверяем что бот написал первое сообщение (Phase 2)
    const botMsg1 = await page.locator('[class*="bg-[#C9943A]"]').first().textContent();
    console.log(`🤖 Бот (Phase 2): ${botMsg1.substring(0, 100)}...`);

    // 3. Вводим кириллический текст через fill()
    const input = page.locator('input');

    const testCases = [
        { text: 'стол и ковёр', phase: 'Phase 2 - ресурсы' },
        { text: 'масло скользкое нельзя идти', phase: 'Phase 1 - проблема' },
        { text: 'расстелить ковёр на масло и пройти по нему', phase: 'Phase 3/0 - решение' },
    ];

    for (const tc of testCases) {
        console.log(`\n✏️ [${tc.phase}] Ввожу: "${tc.text}"`);

        // Используем fill() — работает с кириллицей!
        await input.fill(tc.text);

        // Проверяем что текст появился
        const value = await input.inputValue();
        if (value !== tc.text) {
            console.error(`❌ ОШИБКА: ожидалось "${tc.text}", получили "${value}"`);
        } else {
            console.log(`✅ Текст введён корректно: "${value}"`);
        }

        // Отправляем
        await input.press('Enter');
        await sleep(2000);

        // Читаем ответ бота
        const messages = await page.locator('[class*="bg-[#C9943A]"]').all();
        const lastBot = messages[messages.length - 1];
        if (lastBot) {
            const botReply = await lastBot.textContent();
            console.log(`🤖 Бот ответил: ${botReply.substring(0, 150)}...`);

            // Проверка: бот не должен говорить "Напиши на русском" или "Напиши словами"
            if (botReply.includes('Напиши на русском') || botReply.includes('иероглиф')) {
                console.error('❌ БАГ: бот не распознал кириллицу!');
            }
        }
    }

    console.log('\n✅ Тест завершён!');
    await browser.close();
}

run().catch(e => {
    console.error('💥 Тест упал:', e.message);
    process.exit(1);
});
