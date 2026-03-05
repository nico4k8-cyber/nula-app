import { describe, it, expect } from 'vitest';
import { processUserMessage, TASKS } from './engine.js';

describe('DDT: Методика "Самокритика" (100+ кейсов)', () => {
  const allTasks = TASKS;

  // ==========================================
  // 🙈 ПЕРСОНА: Невнимательный/Ленивый ребенок
  // ==========================================
  describe('ПЕРСОНА: Невнимательный/Ленивый ребенок', () => {
    TASKS.forEach(task => {
      describe(`Задача: ${task.id}`, () => {
        // Спам и пустые сообщения
        const spamCases = [
          { msg: "", desc: "Пустая строка" },
          { msg: "   ", desc: "Только пробелы" },
          { msg: "))))", desc: "Спам скобками" },
          { msg: "🤯🤔", desc: "Только эмодзи" },
          { msg: "!", desc: "Один спецсимвол" },
          { msg: "?", desc: "Вопросительный знак" }
        ];

        spamCases.forEach(async ({ msg, desc }) => {
          it(`Фаза 0: ${desc} -> просит написать словами`, async () => {
            const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
            const { reply } = await processUserMessage(msg, task, state);
            expect(reply).toContain("Напиши словами! ⌨️");
          });
        });

        // Сдача пользователя (give up)
        const giveUpCases = ["не знаю", "сложно", "я сдаюсь", "без понятия", "хз", "не понимаю"];
        giveUpCases.forEach(async msg => {
          it(`Фаза 0: Сдача (${msg}) -> выдает fallback-подсказку`, async () => {
            const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
            const { resultType, reply } = await processUserMessage(msg, task, state);
            // Бот переходит в состояние give_up, результат выдается через fallback
            expect(['give_up', 'fallback']).toContain(resultType);
            expect(reply.length).toBeGreaterThan(0);
          });
        });

        // Бессмысленный ввод букв
        const nonsenseCases = ["qwerty", "абырвалг", "йцукен", "ыва", "простотак"];
        nonsenseCases.forEach(async msg => {
          it(`Фаза 0: Бессмыслица (${msg}) -> копит ошибки (streak)`, async () => {
            const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
            const { resultType, newState } = await processUserMessage(msg, task, state);
            // Английские буквы распознаются как not_russian, русская бессмыслица - как fallback
            if (/^[a-z]+$/i.test(msg)) {
              expect(resultType).toBe('not_russian');
            } else {
              expect(resultType).toBe('fallback');
              expect(newState.streak).toBe(1);
            }
          });
        });

        // Сдача на фазе 2 (Инвентаризация)
        it('Фаза 2 (Инвентаризация): Сдача до начала перечисления предметов', async () => {
          const state = { ikrPhase: 2, ikrResources: [], fbIdx: 0, streak: 0 };
          const { reply, newState } = await processUserMessage('не знаю', task, state);
          expect(reply).toContain('Давай начнём с малого!\n\nПосмотри на картинку');
          expect(newState.ikrPhase).toBe(2);
        });

        it('Фаза 2 (Инвентаризация): Сдача после 1 предмета -> переводит в фазу 1', async () => {
          const state = { ikrPhase: 2, ikrResources: ['предмет'], fbIdx: 0, streak: 0 };
          const { reply, newState } = await processUserMessage('сложно', task, state);
          expect(newState.ikrPhase).toBe(1);
          expect(reply.length).toBeGreaterThan(0); // хвалит за найденное
        });
      });
    });
  });

  // ==========================================
  // 🦊 ПЕРСОНА: Хитрый/Агрессивный ребенок
  // ==========================================
  describe('ПЕРСОНА: Хитрый/Агрессивный ребенок', () => {
    const harmfulWords = [
      "я всех убью", "расстреляю из пистолета", "смерть врагам", "отравлю их ядом",
      "задушить", "труп", "сломать забор полность", "взорву бомбой", "резать ножом",
      "уничтожить все", "кровь"
    ];

    TASKS.forEach(task => {
      describe(`Задача: ${task.id} (Safety)`, () => {
        harmfulWords.forEach(async msg => {
          it(`Опасные слова фильтруются: "${msg}"`, async () => {
            const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
            const { resultType, reply } = await processUserMessage(msg, task, state);
            expect(resultType).toBe('harmful');
            expect(reply).not.toContain('БИНГО');
            expect(reply.length).toBeGreaterThan(10);
          });
        });
      });
    });

    const profanityWords = ["блять", "сука не работает", "пиздец", "ебать"];
    TASKS.forEach(task => {
      describe(`Задача: ${task.id} (Profanity)`, () => {
        profanityWords.forEach(async msg => {
          it(`Мат фильтруется и блокируется: "${msg}"`, async () => {
            const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
            const { resultType, reply } = await processUserMessage(msg, task, state);
            expect(resultType).toBe('harmful');
          });
        });
      });
    });

    it('Ловушки (Monkeys): Использование забора/клетки', async () => {
      const task = TASKS.find(t => t.id === 'monkeys');
      const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
      const traps = ['построю высокий забор', 'посажу их в клетку', 'оградить сеткой'];
      traps.forEach(async msg => {
        const { resultType, reply } = await processUserMessage(msg, task, state);
        expect(resultType).toBe('trap');
        expect(reply).toContain('Стоп!');
      });
    });

  });

});

// ==========================================
// 🏃 ПЕРСОНА: Умный торопыга
// ==========================================
describe('ПЕРСОНА: Умный торопыга (Near Miss, Short Match, Already)', () => {
  // Короткие ответы, которые требуют развития
  const shortMatchData = [
    { taskId: 'solomon-hall', msg: 'ковер', branchExpected: 'carpet' },
    { taskId: 'solomon-hall', msg: 'стол', branchExpected: 'table' },
    { taskId: 'monkeys', msg: 'лимон', branchExpected: 'nature' },
    { taskId: 'flowers', msg: 'пчела', branchExpected: 'nature' },
    { taskId: 'flowers', msg: 'дуть', branchExpected: 'wind' },
    { taskId: 'flowers', msg: 'насекомые', branchExpected: 'nature' },
    { taskId: 'monkeys', msg: 'кислый', branchExpected: 'nature' }
  ];

  shortMatchData.forEach(async ({ taskId, msg, branchExpected }) => {
    it(`Короткий ответ переводит в уточнение (Задача: ${taskId}, ввод: "${msg}")`, async () => {
      const task = TASKS.find(t => t.id === taskId);
      const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
      const { reply, newState, resultType } = await processUserMessage(msg, task, state);
      expect(resultType).toBe('found');
      expect(newState.pendingBranch).toBe(branchExpected);
      expect(reply).not.toContain('БИНГО');
    });
  });

  // Около-решения (Near Miss)
  const nearMissData = [
    { taskId: 'bags', msg: 'найти вора', branchId: 'catch' },
    { taskId: 'monkeys', msg: 'напугать', branchId: 'scare' }
  ];

  // Правильные полные ответы (BINGO)
  const bingoData = [
    { taskId: 'solomon-hall', msg: 'постелить ковер на масло', branchId: 'carpet' },
    { taskId: 'solomon-hall', msg: 'перевернуть стол и плыть', branchId: 'table' },
    { taskId: 'monkeys', msg: 'посадить лимоны по краям', branchId: 'nature' },
    { taskId: 'monkeys', msg: 'повесить пугало', branchId: 'scare' },
    { taskId: 'flowers', msg: 'открыть окно для пчел', branchId: 'nature' },
    { taskId: 'flowers', msg: 'подует ветер из окна', branchId: 'wind' },
    { taskId: 'bags', msg: 'поставить камеры', branchId: 'catch' },
    { taskId: 'bags', msg: 'запретить мотоциклы в городе', branchId: 'moto' }
  ];

  bingoData.forEach(async ({ taskId, msg, branchId }) => {
    it(`БИНГО: "${msg}" (Задача: ${taskId})`, async () => {
      const task = TASKS.find(t => t.id === taskId);
      const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
      const { resultType, newState, reply } = await processUserMessage(msg, task, state);
      expect(resultType).toBe('found');
      expect(newState.found).toContain(branchId);
      expect(reply).toContain('БИНГО');
    });
  });

  // Реакция на уже найденный ответ
  TASKS.forEach(task => {
    it(`Реакция на уже найденный ответ (Задача: ${task.id})`, async () => {
      const branchIds = Object.keys(task.branches);
      if (branchIds.length === 0) return;
      const branchId = branchIds[0];
      const state = { ikrPhase: 0, found: [branchId], fbIdx: 0, streak: 0 };
      const branchIdea = task.branches[branchId].markers[0];

      const { reply, resultType } = await processUserMessage(branchIdea, task, state);
      expect(resultType).toBe('already');
      // Response uses PICK from 3 templates: "уже найден", "уже нашли", "уже было"
      expect(reply).toMatch(/уже найден|уже нашли|уже было/);
    });
  });

  // Фаза 1: Подтверждение проблемы при вводе проблемы без самого решения
  TASKS.forEach(task => {
    it(`Фаза 1: Подтверждение проблемы без засчитывания решения (Задача: ${task.id})`, async () => {
      if (!task.problem_markers || task.problem_markers.length === 0) return;
      const state = { ikrPhase: 1, found: [], fbIdx: 0, streak: 0 };
      const problemInput = task.problem_markers.find(m => !task.trap || !task.trap.markers.includes(m));
      if (!problemInput) return;

      const { reply, newState } = await processUserMessage(problemInput, task, state);

      expect(reply.toLowerCase()).toContain('загвоздк');
      expect(newState.ikrPhase).toBe(1.5);
    });
  });
});

// ==========================================
// 🧨 КРАШ-ТЕСТЫ & EDGE CASES
// ==========================================
describe('🧨 Краш-тесты (Edge Cases)', () => {
  it('Огромный текст отсекается лимитом', async () => {
    const task = TASKS.find(t => t.id === 'solomon-hall');
    const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
    const longText = "а ".repeat(500) + "ковер";
    const { reply } = await processUserMessage(longText, task, state);
    expect(reply).toBeDefined();
  });

  it('Смешивание опасного слова и правильного решения', async () => {
    const task = TASKS.find(t => t.id === 'solomon-hall');
    const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
    const { resultType, reply } = await processUserMessage('убью всех и постелю ковер', task, state);
    expect(resultType).toBe('harmful');
    expect(reply).not.toContain('БИНГО');
  });

  it('Игнорирование пунктуации при вводе правильного ответа', async () => {
    const task = TASKS.find(t => t.id === 'solomon-hall');
    const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
    const { resultType, newState } = await processUserMessage('!!!!???Ковер постелить.,,,', task, state);
    expect(['found']).toContain(resultType);
    expect(newState.pendingBranch || newState.found[0]).toBe('carpet');
  });

  it('Одновременный ввод двух решений (выбор первого подходящего)', async () => {
    const task = TASKS.find(t => t.id === 'solomon-hall');
    const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
    const { resultType, newState } = await processUserMessage('постелить ковер и перевернуть стол', task, state);
    expect(resultType).toBe('found');
    expect(['carpet', 'table'].includes(newState.newBranch || newState.found[0])).toBe(true);
  });

  it('Фаза 0: Попытка решить задачу - система дает обратную связь', async () => {
    const task = TASKS.find(t => t.id === 'solomon-hall');
    const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0 };
    const { reply, newState } = await processUserMessage('использовать ковер', task, state);

    // Система должна дать положительный ответ на попытку решения
    expect(reply).toMatch(/интересно|может сработать|помощь|отличная идея|как именно|звучит|хорошее начало|ого/i);
  });

  // ==========================================
  // 🔴 НОВЫЕ ТЕСТЫ: Сценарии из диалога с царицей
  // ==========================================
  describe('СЦЕНАРИЙ: Диалог Загадка царицы (flowers)', () => {
    const task = TASKS.find(t => t.id === 'flowers');

    it('Неполное решение (только маркер) - "открыть окно" просит подробнее', async () => {
      const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0, pendingBranch: null };
      const { reply, newState, resultType } = await processUserMessage('открыть окно', task, state);

      // "Открыть окно" - есть маркер, но нет маркеров wind-ветки (ветер, дуть, колышется)
      expect(resultType).toBe('found');
      expect(newState.pendingBranch).toBeTruthy(); // будет ждать деталей
      expect(reply).not.toContain('БИНГО'); // просит подробнее, не БИНГО
    });

    it('Полное решение wind-ветки - "открыть окно, ветер колышет" БИНГО', async () => {
      const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0, pendingBranch: null };
      const { reply, newState, resultType } = await processUserMessage('открыть окно, ветер колышет цветы по-разному', task, state);

      // Есть маркер wind-ветки (ветер, колышет) + действие (открыть)
      expect(resultType).toBe('found');
      expect(reply).toContain('БИНГО');
      expect(newState.found).toContain('wind');
    });

    it('Полное решение nature-ветки - "открыть окно, бабочки прилетят" БИНГО', async () => {
      const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0, pendingBranch: null };
      const { reply, newState, resultType } = await processUserMessage('открыть окно, бабочки прилетят на запах', task, state);

      // Есть маркер nature-ветки (бабочки, запах) + действие (прилетят)
      expect(resultType).toBe('found');
      expect(reply).toContain('БИНГО');
      expect(newState.found).toContain('nature');
    });

    it('Неполное/вагуе решение (пустить живых существ) - не БИНГО', async () => {
      const state = { ikrPhase: 0, found: [], fbIdx: 0, streak: 0, pendingBranch: null };
      const vague = 'пустить живых существ которые питаются от цветков';
      const { reply, newState, resultType } = await processUserMessage(vague, task, state);

      // Это не полное решение, не должно быть БИНГО
      // Либо near_miss, либо fallback
      expect(['near_miss', 'fallback']).toContain(resultType);
      expect(reply).not.toContain('БИНГО');
    });
  });
});
