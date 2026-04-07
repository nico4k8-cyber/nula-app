/**
 * Система миграций localStorage
 *
 * Как добавить миграцию при обновлении:
 * 1. Добавь объект в массив MIGRATIONS с новым version
 * 2. Увеличь CURRENT_VERSION на 1
 * 3. В run() сделай всё необходимое с localStorage
 *
 * Миграции запускаются один раз при следующем открытии приложения.
 * Каждая миграция идемпотентна — безопасно запустить повторно.
 */

const SCHEMA_KEY = 'nula_schema_version';

// Увеличивай это число когда добавляешь новую миграцию
const CURRENT_VERSION = 2;

const MIGRATIONS = [
  {
    version: 2,
    description: 'Полный сброс кэша приложения — новая версия для всех',
    run: () => {
      // Сбрасываем флаги онбординга и сплеша — покажем заново
      try {
        const raw = localStorage.getItem('razgadai_v1');
        if (raw) {
          const data = JSON.parse(raw);
          delete data.hasSeenOnboarding;
          delete data.hasSeenDragonSplash;
          delete data.phase; // не восстанавливать старую фазу
          localStorage.setItem('razgadai_v1', JSON.stringify(data));
        }
      } catch {}

      // Сбрасываем кэш задачи дня
      try {
        localStorage.removeItem('shariel_daily_dismissed');
        sessionStorage.removeItem('shariel_daily_expanded');
      } catch {}

      // Сбрасываем туториал задачи (покажется заново)
      try {
        localStorage.removeItem('nula-task-tutorial-done');
      } catch {}

      // Zustand store версия: сбрасываем до версии 0 чтобы migrate() пересобрал
      // (НЕ удаляем — прогресс задач, звёзды сохраняем!)
      // Только если нужно полностью очистить — раскомментировать:
      // localStorage.removeItem('nula-game-storage');
    }
  },

  // Пример как добавлять миграции в будущем:
  //
  // {
  //   version: 2,
  //   description: 'Сбросить онбординг для всех — новый экран дракона',
  //   run: () => {
  //     try {
  //       const raw = localStorage.getItem('razgadai_v1');
  //       if (raw) {
  //         const data = JSON.parse(raw);
  //         delete data.hasSeenOnboarding;
  //         delete data.hasSeenDragonSplash;
  //         localStorage.setItem('razgadai_v1', JSON.stringify(data));
  //       }
  //     } catch {}
  //   }
  // },
  //
  // {
  //   version: 3,
  //   description: 'Сбросить кэш задач дня — новый алгоритм выбора',
  //   run: () => {
  //     localStorage.removeItem('shariel_daily_dismissed');
  //     sessionStorage.removeItem('shariel_daily_expanded');
  //   }
  // },
];

/**
 * Запускает все pending миграции в порядке версий.
 * Вызывай один раз при старте приложения, до рендера.
 */
export function runMigrations() {
  let storedVersion;
  try {
    storedVersion = parseInt(localStorage.getItem(SCHEMA_KEY) || '0', 10);
  } catch {
    storedVersion = 0;
  }

  // Уже актуальная версия — ничего не делаем
  if (storedVersion >= CURRENT_VERSION) return;

  // Запускаем все миграции выше текущей версии пользователя
  for (const migration of MIGRATIONS) {
    if (migration.version > storedVersion) {
      try {
        migration.run();
        storedVersion = migration.version;
        localStorage.setItem(SCHEMA_KEY, String(storedVersion));
      } catch (e) {
        console.error(`[Migration] v${migration.version} failed:`, e);
        // Останавливаемся — не пропускаем сломанную миграцию
        return;
      }
    }
  }

  // Записываем финальную версию (даже если миграций не было — фиксируем baseline)
  try {
    localStorage.setItem(SCHEMA_KEY, String(CURRENT_VERSION));
  } catch {}
}

/**
 * Получить текущую версию схемы пользователя (для дебага)
 */
export function getSchemaVersion() {
  try {
    return parseInt(localStorage.getItem(SCHEMA_KEY) || '0', 10);
  } catch {
    return 0;
  }
}
