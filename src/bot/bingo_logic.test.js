import { describe, it, expect } from 'vitest';
import { processUserMessage, TASKS } from './engine.js';

describe('BINGO Logic: Noun + Verb Requirement (Kaizen)', () => {

    it('Задача solomon-hall: Только существительное ("ковер") НЕ дает БИНГО', async () => {
        const task = TASKS.find(t => t.id === 'solomon-hall');
        const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
        const { reply, newState, resultType } = await processUserMessage('ковер', task, state);

        expect(resultType).toBe('found');
        expect(newState.pendingBranch).toBe('carpet');
        expect(newState.found.length).toBe(0);
        expect(reply).not.toContain('БИНГО');
    });

    it('Задача solomon-hall: "поднять ковер" (неполное действие) просит подробнее', async () => {
        const task = TASKS.find(t => t.id === 'solomon-hall');
        const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
        const { reply, newState, resultType } = await processUserMessage('поднять ковер', task, state);

        expect(resultType).toBe('found');
        expect(newState.pendingBranch).toBe('carpet');
        expect(newState.found.length).toBe(0);
        expect(reply).not.toContain('БИНГО');
    });

    it('Задача monkeys (India): Только "лимон" НЕ дает БИНГО', async () => {
        const task = TASKS.find(t => t.id === 'monkeys');
        const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
        const { reply, newState, resultType } = await processUserMessage('лимон', task, state);

        expect(resultType).toBe('found');
        expect(newState.pendingBranch).toBeTruthy();
        expect(newState.found.length).toBe(0);
    });

    it('Задача monkeys (India): "повесить лимоны" ДАЕТ БИНГО', async () => {
        const task = TASKS.find(t => t.id === 'monkeys');
        const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
        const { reply, newState, resultType } = await processUserMessage('повесить лимоны', task, state);

        expect(resultType).toBe('found');
        expect(reply).toContain('БИНГО!');
        expect(newState.found).toContain('nature');
    });

    it('Задача monkeys (India): Фраза из списка ("чучело леопарда") ДАЕТ БИНГО даже без глагола', async () => {
        const task = TASKS.find(t => t.id === 'monkeys');
        const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
        const { reply, newState, resultType } = await processUserMessage('чучело леопарда', task, state);

        expect(resultType).toBe('found');
        expect(reply).toContain('БИНГО!');
        expect(newState.found).toContain('scare');
    });

    it('Задача flowers: "пчела" НЕ дает БИНГО', async () => {
        const task = TASKS.find(t => t.id === 'flowers');
        const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
        const { reply, resultType, newState } = await processUserMessage('пчела', task, state);
        expect(resultType).toBe('found');
        expect(newState.pendingBranch).toBeTruthy();
        expect(reply).not.toContain('БИНГО');
    });

    it('Задача flowers: "прилетит пчела" ДАЕТ БИНГО', async () => {
        const task = TASKS.find(t => t.id === 'flowers');
        const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
        const { reply, resultType, newState } = await processUserMessage('прилетит пчела', task, state);
        expect(resultType).toBe('found');
        expect(reply).toContain('БИНГО!');
        expect(newState.found).toContain('nature');
    });

    it('Задача bags: "поставить столбики" ДАЕТ БИНГО', async () => {
        const task = TASKS.find(t => t.id === 'bags');
        const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
        const { reply, resultType, newState } = await processUserMessage('поставить столбики', task, state);
        expect(resultType).toBe('found');
        expect(reply).toContain('БИНГО!');
        expect(newState.found).toContain('road');
    });

    it('Описание проблемы в фазе 1 (India monkeys) НЕ дает БИНГО и переводит в 1.5', async () => {
        const task = TASKS.find(t => t.id === 'monkeys');
        const state = { ikrPhase: 1, found: [], fbIdx: 0, streak: 0 };
        const { reply, newState, resultType } = await processUserMessage('обезьяны воруют апельсины', task, state);

        expect(newState.ikrPhase).toBe(1.5);
        expect(reply).toContain('Главная загвоздка');
        expect(newState.found.length).toBe(0);
    });

    it('Фаза 0: Развёрнутый ответ с объяснением ("расстелить ковер потому что...") ДАЕТ БИНГО сразу', async () => {
        const task = TASKS.find(t => t.id === 'solomon-hall');
        const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0, pendingBranch: null };
        const longAnswer = 'Я думаю, что нужно расстелить ковер на скользком полу, потому что ковер имеет шероховатую поверхность и не скользит. Человек сможет безопасно ходить по ковру, не боясь упасть.';
        const { reply, newState, resultType } = await processUserMessage(longAnswer, task, state);

        expect(resultType).toBe('found');
        expect(reply).toContain('БИНГО!');
        expect(newState.found).toContain('carpet');
        expect(newState.pendingBranch).toEqual(null);
    });

    // Real session tests: "Воришки на мотоциклах" (из реального лога)
    it('Задача bags: "надеть рюкзак на оба плеча" ДАЕТ БИНГО (real log)', async () => {
        const task = TASKS.find(t => t.id === 'bags');
        const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
        const { reply, newState, resultType } = await processUserMessage('надеть рюкзак на оба плеча', task, state);

        expect(resultType).toBe('found');
        expect(reply).toContain('БИНГО!');
        expect(newState.found).toContain('bag');
    });

    it('Задача bags: "отделить тротуар от проезжей части, добавить нормальный забор" ДАЕТ БИНГО (real log)', async () => {
        const task = TASKS.find(t => t.id === 'bags');
        const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
        const { reply, newState, resultType } = await processUserMessage('отделить тротуар от проезжей части, добавить нормальный забор', task, state);

        expect(resultType).toBe('found');
        expect(reply).toContain('БИНГО!');
        expect(newState.found).toContain('road');
    });

    it('Задача bags: "запретить ездить на мотоциклах, или замедлить скорость" ДАЕТ БИНГО (real log)', async () => {
        const task = TASKS.find(t => t.id === 'bags');
        const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
        const { reply, newState, resultType } = await processUserMessage('запретить ездить на мотоциклах, или замедлить скорость движения', task, state);

        expect(resultType).toBe('found');
        expect(reply).toContain('БИНГО!');
        expect(newState.found).toContain('moto');
    });

    // Real session test: "Обезьяны и апельсины" (из реального лога)
    it('Задача monkeys: "Пугало или собак выпустить" ДАЕТ БИНГО (real log)', async () => {
        const task = TASKS.find(t => t.id === 'monkeys');
        const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
        const { reply, newState, resultType } = await processUserMessage('Пугало или собак выпустить', task, state);

        expect(resultType).toBe('found');
        expect(reply).toContain('БИНГО!');
        expect(newState.found).toContain('scare');
    });

    // Тесты для новых маркеров
    it('Задача monkeys (nature): "лимон попробуют и уйдут" с новым маркером ДАЕТ БИНГО', async () => {
        const task = TASKS.find(t => t.id === 'monkeys');
        const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
        const { reply, newState, resultType } = await processUserMessage('лимон попробуют и уйдут', task, state);

        expect(resultType).toBe('found');
        expect(reply).toContain('БИНГО!');
        expect(newState.found).toContain('nature');
    });

    it('Задача monkeys (scare): "рычание льва напугает" с новым маркером ДАЕТ БИНГО', async () => {
        const task = TASKS.find(t => t.id === 'monkeys');
        const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
        const { reply, newState, resultType } = await processUserMessage('рычание льва напугает обезьян', task, state);

        expect(resultType).toBe('found');
        expect(reply).toContain('БИНГО!');
        expect(newState.found).toContain('scare');
    });

    it('Задача flowers (nature): "пчелы почувствуют аромат живых цветов" с новым маркером ДАЕТ БИНГО', async () => {
        const task = TASKS.find(t => t.id === 'flowers');
        const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
        const { reply, newState, resultType } = await processUserMessage('пчелы почувствуют аромат живых цветов', task, state);

        expect(resultType).toBe('found');
        expect(reply).toContain('БИНГО!');
        expect(newState.found).toContain('nature');
    });

    it('Задача flowers (wind): "ветер колышет живой цветок" с новым маркером ДАЕТ БИНГО', async () => {
        const task = TASKS.find(t => t.id === 'flowers');
        const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
        const { reply, newState, resultType } = await processUserMessage('ветер колышет живой цветок', task, state);

        expect(resultType).toBe('found');
        expect(reply).toContain('БИНГО!');
        expect(newState.found).toContain('wind');
    });

    it('Задача bags (catch): "камеры записывают номер мотоцикла" с новым маркером ДАЕТ БИНГО', async () => {
        const task = TASKS.find(t => t.id === 'bags');
        const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
        const { reply, newState, resultType } = await processUserMessage('камеры записывают номер мотоцикла', task, state);

        expect(resultType).toBe('found');
        expect(reply).toContain('БИНГО!');
        expect(newState.found).toContain('catch');
    });

    it('Задача bags (bag): "жилет с карманами, надеть на оба плеча" с новым маркером ДАЕТ БИНГО', async () => {
        const task = TASKS.find(t => t.id === 'bags');
        const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
        const { reply, newState, resultType } = await processUserMessage('жилет с карманами, надеть на оба плеча', task, state);

        expect(resultType).toBe('found');
        expect(reply).toContain('БИНГО!');
        expect(newState.found).toContain('bag');
    });

    it('Задача bags (road): "запретить приближаться к дороге с сумкой" просит подробнее (фикс запретит)', async () => {
        const task = TASKS.find(t => t.id === 'bags');
        const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
        const { reply, newState, resultType } = await processUserMessage('запретить приближаться к дороге с сумкой', task, state);

        // Должно просить подробнее, а не БИНГО (ключевое исправление)
        expect(resultType).toBe('found');
        expect(newState.pendingBranch).toBeTruthy();
        expect(newState.found.length).toBe(0); // Нет БИНГО
        expect(reply).not.toContain('БИНГО');
    });

    it('Задача bags (road): "поставить столбики на тротуаре" ДАЕТ БИНГО', async () => {
        const task = TASKS.find(t => t.id === 'bags');
        const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
        const { reply, newState, resultType } = await processUserMessage('поставить столбики на тротуаре', task, state);

        expect(resultType).toBe('found');
        expect(reply).toContain('БИНГО!');
        expect(newState.found).toContain('road');
    });

    it('Задача bags (moto): "запретить мотоциклы в городе" ДАЕТ БИНГО', async () => {
        const task = TASKS.find(t => t.id === 'bags');
        const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
        const { reply, newState, resultType } = await processUserMessage('запретить мотоциклы в городе', task, state);

        expect(resultType).toBe('found');
        expect(reply).toContain('БИНГО!');
        expect(newState.found).toContain('moto');
    });

    // Real session test: solomon-hall (Escape from Palace) carpet solution
    it('Задача solomon-hall: "накрыть пол ковром" ДАЕТ БИНГО (real log)', async () => {
        const task = TASKS.find(t => t.id === 'solomon-hall');
        const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
        const { reply, newState, resultType } = await processUserMessage('накрыть пол ковром', task, state);

        expect(resultType).toBe('found');
        expect(reply).toContain('БИНГО!');
        expect(newState.found).toContain('carpet');
    });

    it('Задача solomon-hall: Просто определить проблему ("масло на полу очень скользко") НЕ дает БИНГО', async () => {
        const task = TASKS.find(t => t.id === 'solomon-hall');
        const state = { ikrPhase: 1.5, found: [], fbIdx: 0, streak: 0 };
        const { reply, resultType } = await processUserMessage('Нет, конечно, не в порядке масло на полу очень скользко', task, state);

        // Просто определение проблемы - НЕ решение
        expect(resultType).toBe('fallback');
        expect(reply).not.toContain('БИНГО!');
    });
});
