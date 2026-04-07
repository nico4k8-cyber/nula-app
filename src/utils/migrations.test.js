import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { runMigrations, getSchemaVersion } from './migrations.js';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; },
    _store: () => store,
  };
})();

const sessionStorageMock = (() => {
  let store = {};
  return {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();

vi.stubGlobal('localStorage', localStorageMock);
vi.stubGlobal('sessionStorage', sessionStorageMock);

describe('DDT: Migrations System', () => {
  beforeEach(() => {
    localStorageMock.clear();
    sessionStorageMock.clear();
  });

  describe('Baseline: первый запуск', () => {
    it('нет версии → после runMigrations версия = CURRENT_VERSION', () => {
      expect(localStorageMock.getItem('nula_schema_version')).toBeNull();
      runMigrations();
      expect(Number(localStorageMock.getItem('nula_schema_version'))).toBeGreaterThanOrEqual(1);
    });

    it('getSchemaVersion() возвращает 0 до миграций', () => {
      expect(getSchemaVersion()).toBe(0);
    });

    it('getSchemaVersion() возвращает правильную версию после миграций', () => {
      runMigrations();
      expect(getSchemaVersion()).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Migration v2: сброс онбординга', () => {
    it('сбрасывает hasSeenOnboarding из razgadai_v1', () => {
      localStorageMock.setItem('razgadai_v1', JSON.stringify({
        hasSeenOnboarding: true,
        hasSeenDragonSplash: true,
        theme: 'hayday',
      }));
      localStorageMock.setItem('nula_schema_version', '1'); // старая версия

      runMigrations();

      const data = JSON.parse(localStorageMock.getItem('razgadai_v1') || '{}');
      expect(data.hasSeenOnboarding).toBeUndefined();
      expect(data.hasSeenDragonSplash).toBeUndefined();
      expect(data.theme).toBe('hayday'); // остальное сохранено
    });

    it('сбрасывает shariel_daily_dismissed', () => {
      localStorageMock.setItem('shariel_daily_dismissed', '2026-04-07');
      localStorageMock.setItem('nula_schema_version', '1');

      runMigrations();

      expect(localStorageMock.getItem('shariel_daily_dismissed')).toBeNull();
    });

    it('сбрасывает nula-task-tutorial-done', () => {
      localStorageMock.setItem('nula-task-tutorial-done', 'true');
      localStorageMock.setItem('nula_schema_version', '1');

      runMigrations();

      expect(localStorageMock.getItem('nula-task-tutorial-done')).toBeNull();
    });

    it('НЕ сбрасывает nula-game-storage (прогресс сохраняется)', () => {
      const progress = JSON.stringify({ state: { completedTasks: [1, 2, 3], totalStars: 9 }, version: 4 });
      localStorageMock.setItem('nula-game-storage', progress);
      localStorageMock.setItem('nula_schema_version', '1');

      runMigrations();

      expect(localStorageMock.getItem('nula-game-storage')).toBe(progress);
    });
  });

  describe('Идемпотентность: повторный запуск', () => {
    it('runMigrations дважды — версия не меняется', () => {
      runMigrations();
      const v1 = localStorageMock.getItem('nula_schema_version');
      runMigrations();
      const v2 = localStorageMock.getItem('nula_schema_version');
      expect(v1).toBe(v2);
    });

    it('runMigrations дважды — данные не затираются повторно', () => {
      localStorageMock.setItem('nula_schema_version', '1');
      localStorageMock.setItem('razgadai_v1', JSON.stringify({ hasSeenOnboarding: true, theme: 'scifi' }));

      runMigrations(); // первый раз — сбросит hasSeenOnboarding
      localStorageMock.setItem('razgadai_v1', JSON.stringify({ theme: 'scifi', newKey: 'saved' }));

      runMigrations(); // второй раз — ничего не трогает (уже актуальная версия)

      const data = JSON.parse(localStorageMock.getItem('razgadai_v1'));
      expect(data.newKey).toBe('saved'); // данные не сброшены повторно
    });
  });

  describe('Безопасность: битые данные', () => {
    it('bitый JSON в razgadai_v1 не роняет runMigrations', () => {
      localStorageMock.setItem('razgadai_v1', 'INVALID_JSON{{{{');
      localStorageMock.setItem('nula_schema_version', '1');

      expect(() => runMigrations()).not.toThrow();
      expect(getSchemaVersion()).toBeGreaterThanOrEqual(2);
    });

    it('отсутствие localStorage не роняет getSchemaVersion', () => {
      // localStorage возвращает null для несуществующего ключа
      localStorageMock.clear();
      expect(() => getSchemaVersion()).not.toThrow();
      expect(getSchemaVersion()).toBe(0);
    });
  });
});
