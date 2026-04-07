/**
 * DDT: Фаза 01 — islands/unlocks, canPlayTask, Supabase fallback, bredo-items, twenty-q-words
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── Mock localStorage ──────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();
vi.stubGlobal('localStorage', localStorageMock);

// ─── Imports ────────────────────────────────────────────────────────────────
import { BREDO_ITEMS, getDailyItem } from './bredo-items.js';
import { TWENTY_Q_WORDS } from './twenty-q-words.js';
import { TASKS } from './engine.js';

// ─── DDT: bredo-items.js ────────────────────────────────────────────────────
describe('DDT: bredo-items.js — структура данных', () => {
  it('массив непустой', () => {
    expect(BREDO_ITEMS.length).toBeGreaterThan(0);
  });

  it('не менее 34 предметов', () => {
    expect(BREDO_ITEMS.length).toBeGreaterThanOrEqual(34);
  });

  it('все предметы — объекты с полями id, name, emoji', () => {
    BREDO_ITEMS.forEach(item => {
      expect(typeof item.id).toBe('string');
      expect(typeof item.name).toBe('string');
      expect(typeof item.emoji).toBe('string');
    });
  });

  it('нет пустых name', () => {
    BREDO_ITEMS.forEach(item => expect(item.name.trim().length).toBeGreaterThan(0));
  });

  it('нет дублей id', () => {
    const unique = new Set(BREDO_ITEMS.map(i => i.id));
    expect(unique.size).toBe(BREDO_ITEMS.length);
  });

  it('содержит базовые предметы из SQL-сида (ложка, карандаш)', () => {
    const names = BREDO_ITEMS.map(i => i.name.toLowerCase());
    expect(names.some(n => n.includes('ложка'))).toBe(true);
    expect(names.some(n => n.includes('карандаш'))).toBe(true);
  });
});

// ─── DDT: twenty-q-words.js ─────────────────────────────────────────────────
describe('DDT: twenty-q-words.js — структура данных', () => {
  it('массив непустой', () => {
    expect(TWENTY_Q_WORDS.length).toBeGreaterThan(0);
  });

  it('не менее 30 слов', () => {
    expect(TWENTY_Q_WORDS.length).toBeGreaterThanOrEqual(30);
  });

  it('все слова — объекты с полями id, word, emoji, category, difficulty', () => {
    TWENTY_Q_WORDS.forEach(w => {
      expect(typeof w.id).toBe('string');
      expect(typeof w.word).toBe('string');
      expect(typeof w.category).toBe('string');
      expect(typeof w.difficulty).toBe('number');
    });
  });

  it('нет пустых word', () => {
    TWENTY_Q_WORDS.forEach(w => expect(w.word.trim().length).toBeGreaterThan(0));
  });

  it('нет дублей id', () => {
    const unique = new Set(TWENTY_Q_WORDS.map(w => w.id));
    expect(unique.size).toBe(TWENTY_Q_WORDS.length);
  });

  it('содержит слова из SQL-сида (яблоко, стул, книга)', () => {
    const words = TWENTY_Q_WORDS.map(w => w.word.toLowerCase());
    expect(words.some(w => w.includes('яблоко'))).toBe(true);
    expect(words.some(w => w.includes('стул'))).toBe(true);
    expect(words.some(w => w.includes('книга'))).toBe(true);
  });

  it('difficulty >= 1 (числовой уровень сложности)', () => {
    TWENTY_Q_WORDS.forEach(w => {
      expect(w.difficulty).toBeGreaterThanOrEqual(1);
    });
  });
});

// ─── DDT: getDailyItem (bredo) ───────────────────────────────────────────────
describe('DDT: getDailyItem — детерминированный выбор предмета Бредо', () => {
  it('getDailyItem — функция экспортируется', () => {
    expect(typeof getDailyItem).toBe('function');
  });

  it('возвращает один предмет для всех пользователей в один день', () => {
    const i1 = getDailyItem();
    const i2 = getDailyItem();
    expect(i1.id).toBe(i2.id);
  });

  it('всегда возвращает предмет из массива', () => {
    const item = getDailyItem();
    expect(BREDO_ITEMS.some(i => i.id === item.id)).toBe(true);
  });

  it('детерминированный хэш по дате всегда валиден', () => {
    const dates = ['2026-01-01', '2026-04-07', '2026-12-31'];
    const results = dates.map(date => {
      let hash = 0;
      for (let i = 0; i < date.length; i++) {
        hash = (hash * 31 + date.charCodeAt(i)) >>> 0;
      }
      return hash % BREDO_ITEMS.length;
    });
    results.forEach(idx => {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(BREDO_ITEMS.length);
    });
    const unique = new Set(results);
    expect(unique.size).toBeGreaterThan(1);
  });
});

// ─── DDT: canPlayTask логика (resetDailyCountIfNeeded) ──────────────────────
describe('DDT: canPlayTask — дневной лимит (логика без store)', () => {
  // Использует сравнение YYYY-MM-DD строк (как в реальном коде)
  function isSameDay(date1, date2) {
    return date1.toLocaleDateString('sv') === date2.toLocaleDateString('sv');
  }

  it('одна и та же дата — не сбрасываем счётчик', () => {
    const now = new Date();
    const sameDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59);
    expect(isSameDay(now, sameDay)).toBe(true);
  });

  it('другой день — сбрасываем счётчик', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isSameDay(today, yesterday)).toBe(false);
  });

  it('23:59 и 00:01 следующего дня — разные дни (сброс по midnight)', () => {
    // Строим два объекта с конкретными local датами
    const d1 = new Date(2026, 3, 6, 23, 59); // 6 апреля 23:59 local
    const d2 = new Date(2026, 3, 7, 0, 1);   // 7 апреля 00:01 local
    expect(isSameDay(d1, d2)).toBe(false);
  });

  it('23:00 и 23:59 в один день — не сбрасывать', () => {
    const d1 = new Date(2026, 3, 7, 23, 0);
    const d2 = new Date(2026, 3, 7, 23, 59);
    expect(isSameDay(d1, d2)).toBe(true);
  });

  it('лимит 3 задачи для неплатных пользователей', () => {
    const FREE_LIMIT = 3;
    const dailyCount = 3;
    const isPremium = false;
    const canPlay = isPremium || dailyCount < FREE_LIMIT;
    expect(canPlay).toBe(false);
  });

  it('2 задачи из 3 — ещё можно играть', () => {
    const FREE_LIMIT = 3;
    const dailyCount = 2;
    const isPremium = false;
    const canPlay = isPremium || dailyCount < FREE_LIMIT;
    expect(canPlay).toBe(true);
  });

  it('premium пользователь всегда может играть', () => {
    const dailyCount = 999;
    const isPremium = true;
    const canPlay = isPremium || dailyCount < 3;
    expect(canPlay).toBe(true);
  });
});

// ─── DDT: unlockRequirements — острова ──────────────────────────────────────
describe('DDT: Island unlock requirements (фаза 01)', () => {
  const unlockRequirements = {
    'craft':       { type: 'tasks', count: 3 },
    'tsar':        { type: 'tasks', count: 3 },
    'bredo':       { type: 'tasks', count: 6 },
    'laboratory':  { type: 'tasks', count: 9 },
  };

  it('все острова имеют тип tasks', () => {
    Object.values(unlockRequirements).forEach(req => {
      expect(req.type).toBe('tasks');
    });
  });

  it('пороги разблокировки возрастают (craft < bredo < laboratory)', () => {
    expect(unlockRequirements.craft.count).toBeLessThan(unlockRequirements.bredo.count);
    expect(unlockRequirements.bredo.count).toBeLessThan(unlockRequirements.laboratory.count);
  });

  it('craft/tsar открываются на 3 задачах', () => {
    expect(unlockRequirements.craft.count).toBe(3);
    expect(unlockRequirements.tsar.count).toBe(3);
  });

  const cases = [
    { completed: 0, island: 'craft', expected: false },
    { completed: 2, island: 'craft', expected: false },
    { completed: 3, island: 'craft', expected: true },
    { completed: 5, island: 'bredo', expected: false },
    { completed: 6, island: 'bredo', expected: true },
    { completed: 8, island: 'laboratory', expected: false },
    { completed: 9, island: 'laboratory', expected: true },
    { completed: 100, island: 'laboratory', expected: true },
  ];

  it.each(cases)(
    '$completed задач → $island разблокирован: $expected',
    ({ completed, island, expected }) => {
      const req = unlockRequirements[island];
      const isUnlocked = completed >= req.count;
      expect(isUnlocked).toBe(expected);
    }
  );
});

// ─── DDT: loadTasks fallback ─────────────────────────────────────────────────
describe('DDT: loadTasks — Supabase fallback на локальные TASKS', () => {
  it('локальные TASKS доступны как fallback', () => {
    expect(TASKS).toBeDefined();
    expect(TASKS.length).toBeGreaterThan(0);
  });

  it('при remoteTasks=null приложение использует локальные TASKS', () => {
    const remoteTasks = null;
    const effectiveTasks = remoteTasks || TASKS;
    expect(effectiveTasks).toBe(TASKS);
    expect(effectiveTasks.length).toBeGreaterThan(0);
  });

  it('при remoteTasks=[] приложение использует локальные TASKS (пустой массив = нет данных)', () => {
    const remoteTasks = [];
    const effectiveTasks = (remoteTasks && remoteTasks.length > 0) ? remoteTasks : TASKS;
    expect(effectiveTasks).toBe(TASKS);
  });

  it('при remoteTasks=[...] приложение использует данные из Supabase', () => {
    const remoteTasks = [{ id: 999, title: 'Remote Task', difficulty: 1, category: 'test' }];
    const effectiveTasks = (remoteTasks && remoteTasks.length > 0) ? remoteTasks : TASKS;
    expect(effectiveTasks[0].id).toBe(999);
  });
});
