import { processUserMessage, TASKS } from './src/bot/engine.js';

function simulate(taskId, inputs) {
    const task = TASKS.find(t => t.id === taskId);
    let state = {
        ikrPhase: 2,
        ikrResources: [],
        found: [],
        streak: 0,
        startTime: Date.now()
    };

    console.log(`\n======================================================`);
    console.log(`=== СИМУЛЯЦИЯ: ${task.title} ===`);
    console.log(`======================================================`);
    console.log(`🤖 Бот: ${task.ikr_steps[0]}`);

    for (const txt of inputs) {
        console.log(`\n👤 Ребенок: ${txt}`);
        const res = processUserMessage(txt, task, state);
        state = res.newState;

        const cleanReply = res.reply.replace(/\n\n/g, '\n');
        console.log(`[DEBUG] Result: ${JSON.stringify(res.resultType || 'none')}, Branch: ${res.newBranch || 'none'}`);
        console.log(`🤖 Бот: ${cleanReply}`);
    }
}

// 1. Цветы (Загадка царицы) - сессия 1
simulate('flowers', [
    "Пустить живых существ которые питаются от цветков и они сядут на настоящие",
    "Закрытое окно",
    "Открытое окно",
    "Полить водой"
]);

// 2. Цветы - сессия 2
simulate('flowers', [
    "они хрупкие",
    "они яркие",
    "не можем нюхать",
    "пчелы",
    "вода, налил воду"
]);

// 3. Воришки на мотоциклах - сессия 3
simulate('bags', [
    "камера, охранник, китайские фонарики, девочка в шоке",
    "камера",
    "охранник",
    "мне кажется, что девочка должна надеть рюкзак на оба плеча",
    "отделить тротуар от проезжей части, добавить нормальный забор",
    "добавить лежачие полицейские"
]);

// 4. Зал Соломона - проблема с опечатками (пло, масол)
simulate('solomon-hall', [
    "масол на полу",
    "пло скользкий",
    "хочу испоьзовать ковер"
]);

