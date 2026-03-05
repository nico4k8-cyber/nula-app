import { describe, it, expect } from 'vitest';
import { processUserMessage, TASKS, normalize } from './engine.js';

describe('Phase 1: Негация — не давать БИНГО на описание проблемы', () => {
    const problemDescriptions = {
        'solomon-hall': [
            'нельзя выйти отсюда',
            'как выбраться если нет дверей',
            'не может выйти пленник',
            'запер во дворце нет окон',
            'нет дверей и окон как уйти',
        ],
        'monkeys': [
            'нет, обезьяны воруют апельсины не получается их остановить',
            'проблема в том что обезьяны ловкие и перелезают через забор',
            'крадут урожай апельсинов',
        ],
        'flowers': [
            'нельзя трогать цветы не получится отличить настоящие',
            'как отличить если не подходить',
        ],
        'bags': [
            'нет, вор на мотоцикле сорвёт сумку не получается защитить',
            'плохо что сумку легко сорвать на ходу',
            'вор на мотоцикле быстрый',
        ],
    };

    TASKS.forEach(task => {
        const cases = problemDescriptions[task.id] || [];
        cases.forEach(text => {
            it(`[${task.id}] "${text.substring(0, 50)}..." → НЕ БИНГО`, async () => {
                const state = { ikrPhase: 1, found: [], streak: 0, ikrResources: [] };
                const { reply, newState, resultType } = await processUserMessage(text, task, state);

                expect(reply).not.toContain('БИНГО');
                expect(newState.ikrPhase).toBe(1.5);
                expect(resultType).not.toBe('found');
            });
        });
    });
});
