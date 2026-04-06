---
phase: "02-onboarding"
plan: "01"
subsystem: "onboarding"
tags: [tutorial, onboarding, spotlight, task-preview]
dependency_graph:
  requires: []
  provides: [task-spotlight-tutorial]
  affects: [App.jsx, OnboardingTooltip, TaskPreview]
tech_stack:
  added: []
  patterns: [prop-parameterization, storageKey-isolation]
key_files:
  created: []
  modified:
    - src/components/OnboardingTooltip.jsx
    - src/App.jsx
    - src/components/TaskPreview.jsx
decisions:
  - "2-step spotlight (task-title + start-btn) satisfies D-12/D-13; resource step deferred to DialogView"
  - "storageKey isolation prevents task tutorial from blocking world-map onboarding"
metrics:
  duration: "~10 min"
  completed: "2026-04-07"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 3
requirements: [D-12, D-13, D-14, D-15]
---

# Phase 02 Plan 01: Tutorial Extension for First Task Summary

**One-liner:** 2-step spotlight tutorial (task title + start button) triggered on first task via parameterized OnboardingTooltip with isolated storageKey.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 02-01-01 | Parameterize OnboardingTooltip | 8482336 | src/components/OnboardingTooltip.jsx |
| 02-01-02 | Add task tutorial steps + trigger | bb8592a | src/App.jsx, src/components/TaskPreview.jsx |

## What Was Built

OnboardingTooltip теперь принимает пропсы `steps` и `storageKey`, что позволяет переиспользовать компонент для разных туториалов без конфликтов в localStorage.

При первом запуске задачи (после DragonBubbleScreen с `opts.tutorial`):
1. Устанавливается `isTutorial=true` + `setPhase("task-preview")`
2. Через 400ms вызывается `onboarding.startOnboarding()`
3. Рендерится второй `<OnboardingTooltip>` с `TASK_TUTORIAL_STEPS` и `storageKey="nula-task-tutorial-done"`
4. Шаг 1 подсвечивает `[data-onboard="task-title"]` (h1 с названием задачи)
5. Шаг 2 подсвечивает `[data-onboard="start-btn"]` (кнопка "К РЕШЕНИЮ")
6. После первого сообщения пользователя `isTutorial` сбрасывается (уже было в handleUserMessage)

## Deviations from Plan

None — план выполнен точно как написано.

## Known Stubs

None.

## Threat Flags

None — угрозы T-02-01 и T-02-02 из плана закрыты реализацией (разные `storageKey`, разные фазы рендера, 400ms задержка + retry-логика в компоненте).

## Self-Check: PASSED

- src/components/OnboardingTooltip.jsx — FOUND, WORLD_MAP_STEPS exported, steps/storageKey props accepted
- src/App.jsx — FOUND, TASK_TUTORIAL_STEPS defined, second OnboardingTooltip rendered, setTimeout trigger added
- src/components/TaskPreview.jsx — FOUND, data-onboard="task-title" on h1, data-onboard="start-btn" on button
- Commit 8482336 — FOUND
- Commit bb8592a — FOUND
- Build: passed (118 modules, no errors)
