# Город ТРИЗ — Roadmap

**Обновлён:** 2026-04-08 (планы фазы 4 созданы)
**Гранулярность:** Standard (5–7 фаз)
**Цель:** Полностью рабочая игра с 4 островами → рост пользователей → монетизация

---

## Текущее состояние (baseline)

| Что готово | Статус |
|-----------|--------|
| Острова Main + Craft | ✅ Активны (34 задачи) |
| Острова Science + Summit | ⚠️ Структура есть, задач нет (туман) |
| Paywall (ЮКасса) | ✅ Работает, но не протестирован в проде |
| Auth (Supabase) | ✅ Работает |
| DailyChallenge | ⚠️ Логика есть, UX не доделан |
| Onboarding | ⚠️ 3 шага, слабый (нет туториала задачи) |
| Лаборатория/Бредогенератор/Царь-гора | ⚠️ UI есть, задач нет |
| Аналитика (PostHog) | ✅ Работает |

---

## Phase 1: Контент — Острова Science + Summit
**Цель:** Разблокировать острова Science и Summit — написать задачи, подключить к зданиям
**Продолжительность:** 1–2 недели
**Приоритет:** Критично — пользователи упираются в туман после 9 задач
**Plans:** 3 plans

### Что строим:
- Исправить пороги разблокировки: tsar после 3, bredo после 6, laboratory после 9 (новая логика)
- Supabase-таблицы tsar_words, bredo_items, tasks, ugc_tasks + seed-данные
- Лаборатория: UGC-экран ремикса задач (новый LaboratoryView)
- Ежедневный лимит 3 задачи для бесплатных пользователей

### Plans:
- [ ] 01-01-PLAN.md — Прогрессия островов: новые пороги unlockRequirements + canPlayTask()
- [ ] 01-02-PLAN.md — Supabase-миграция: 4 таблицы + seed-данные (tsar_words, bredo_items)
- [ ] 01-03-PLAN.md — LaboratoryView (UGC-ремикс) + интеграция лимита в App.jsx

### Phases directory: `.planning/phases/01-science-summit-content/`

---

## Phase 2: Онбординг и первый опыт
**Цель:** 80% новых пользователей проходят первую задачу без текстовых инструкций
**Продолжительность:** 1 неделя

### Что строим:
- Расширить `OnboardingTooltip` до 5–6 шагов (сейчас 3 шага, нет обучения на задаче)
- Добавить туториал первой задачи: объяснить ресурс → попробуй нажать → поздравление
- Экран "Добро пожаловать" перед картой мира (имя персонажа / возраст → настройка сложности)
- Улучшить empty state когда задачи кончились в здании

### Phases directory: `.planning/phases/02-onboarding/`

---

## Phase 3: DailyChallenge + Retention
**Цель:** Ежедневные задачи работают, пользователи возвращаются каждый день
**Продолжительность:** 1 неделя
**Plans:** 4 plans

### Что строим:
- DailyChallenge: баннер не исчезает при dismiss — сворачивается до строки, встраивается в city
- Streak-экран: StreakScreen modal с прогрессом недели + milestone-анимации
- Telegram push: bot-webhook + cron ежедневный + кнопка подписки в UI
- Streak freeze: логика в updateStreak + UI покупки через Paywall

### Plans:
- [ ] 03-PLAN-01-dailychallenge-fix.md — DailyChallenge minimize вместо dismiss + встройка в city + bypass лимита
- [ ] 03-PLAN-02-streak-screen.md — StreakScreen компонент + HUD badge кликабельный + freeze поля в store
- [ ] 03-PLAN-03-telegram-bot.md — bot-webhook.js + notify-daily.js + cron + кнопка в SettingsMenu
- [ ] 03-PLAN-04-streak-freeze.md — updateStreak с freeze логикой + UI в StreakScreen + Paywall интеграция

### Wave структура:
- Wave 1: Plan 01 + Plan 02 (параллельно, независимы)
- Wave 2: Plan 03 (независим от Wave 1, но отдельно — затрагивает backend)
- Wave 3: Plan 04 (зависит от Plan 02 — streakFreezeCount из store)

### Phases directory: `.planning/phases/03-dailychallenge-retention/`

---

## Phase 4: Монетизация — Paywall polish (ParentView)
**Цель:** ParentView показывает реальный прогресс ребёнка — родитель видит конкретные задачи и ТРИЗ-принципы
**Продолжительность:** 2–3 дня
**Plans:** 2 plans

### Что строим:
- gameStore: расширить completedTasks (объекты с stars/foundPrinciple/solvedAt вместо ID)
- ParentView: реальные данные (название задачи, здание, ТРИЗ-принцип, звёзды)
- Интеграция ParentView в App.jsx + точка входа из SettingsMenu

### Plans:
- [ ] 04-01-PLAN.md — Store schema: completedTasks object[] + миграция v4→v5
- [ ] 04-02-PLAN.md — App.jsx интеграция + ParentView переработка с реальными данными

### Wave структура:
- Wave 1: Plan 01 (gameStore расширение)
- Wave 2: Plan 02 (App.jsx + ParentView — зависит от Plan 01)

### Phases directory: `.planning/phases/04-paywall-polish/`

---

## Phase 5: Контент — Расширение задач
**Цель:** 60+ задач, покрытие всех зданий, разнообразие тематик
**Продолжительность:** 2 недели

### Что строим:
- Ферма (farm): 6 задач есть, проверить качество → добавить ещё 4–6 если нужно
- Увеличить Лабораторию/Бредогенератор/Царь-гору до 8–10 задач каждая
- Тематические пакеты: еврейская культура, природа России, физика повседневного
- Автоматическая ротация задач через AdminView без деплоя

### Phases directory: `.planning/phases/05-content-expansion/`

---

## Phase 6: Mobile + PWA + App Store
**Цель:** Игра работает как нативное приложение на iOS/Android
**Продолжительность:** 2–3 недели

### Что строим:
- PWA: манифест, иконки, `offline` экран, установка на рабочий стол
- Capacitor (iOS + Android) — обёртка для App Store / Google Play
- App Store IAP рядом с ЮКассой (для iOS-пользователей)
- Performance: проверить 60 FPS на бюджетном телефоне, оптимизировать анимации

### Phases directory: `.planning/phases/06-mobile-pwa/`

---

## Backlog (не в фазах)

- B2B: dashboard для учителей, лицензия на класс
- UGC: дети создают задачи для других (архивариус)
- Соревновательный режим: кто быстрее решит задачу
- Babel Fish: перевод задач на иврит/английский (i18n уже есть)
- Бредогенератор: полноценный режим генерации абсурдных решений
- ЮКасса prod-тестирование, промо-коды, A/B тест paywall-триггера

---
*Обновлён: 2026-04-08 — планы фазы 4 созданы (2 плана, 2 волны)*
