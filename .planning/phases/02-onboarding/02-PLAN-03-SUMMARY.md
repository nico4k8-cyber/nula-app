---
phase: 02-onboarding
plan: "03"
subsystem: ui-components
tags: [empty-state, ugolok, task-picker, onboarding]
dependency_graph:
  requires: []
  provides: [contextual-empty-states-D16, locked-tasks-hint-D17]
  affects: [TaskPicker]
tech_stack:
  added: []
  patterns: [conditional-rendering, fragment-wrapper]
key_files:
  modified:
    - src/components/TaskPicker.jsx
decisions:
  - Used React Fragment wrapper to switch from ternary to multi-banner layout
  - Russian declension for "задачу/задач" simplified as suggested in plan
metrics:
  duration: "~10 min"
  completed: "2026-04-07"
  tasks_completed: 1
  tasks_total: 1
  files_modified: 1
---

# Phase 02 Plan 03: Empty State Improvement in TaskPicker Summary

**One-liner:** Three contextual empty states in TaskPicker using existing Ugolok character — no tasks / all done / locked hint with remaining count.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 02-03-01 | Contextual empty states in TaskPicker | b374bf0 | src/components/TaskPicker.jsx |

## What Was Built

Replaced the generic "Задач пока нет" placeholder (lines 148-151) with three distinct contextual states:

1. **Case A — No tasks in category** (`filtered.length === 0`): Shows Ugolok image with "Здесь пока нет задач" + "Заходи позже -- Орин готовит новые!"

2. **Case B — All tasks completed** (`doneCount === filtered.length && filtered.length > 0`): Adds an emerald congratulation banner with Ugolok above the task grid (grid remains visible with checkmarks).

3. **D-17 — Locked tasks hint** (`!allEasyDone && filtered.some(t => isDifficultyLocked(t))`): Shows a slate banner with remaining easy task count: "Реши ещё N задач(у) чтобы открыть сложные".

All banners use existing variables (`doneCount`, `filtered`, `easyTasks`, `completedTasks`, `allEasyDone`) — no new props or state needed.

## Deviations from Plan

None — plan executed exactly as written.

## Threat Surface Scan

No new network endpoints, auth paths, or schema changes introduced. The `ugolok.webp` path `/img/webp/ugolok.webp` is identical to the existing usage on line 103 of the same file (threat T-02-06 mitigated by reuse).

## Self-Check: PASSED

- `src/components/TaskPicker.jsx` — modified and committed
- Commit b374bf0 — confirmed in git log
- Build: `vite build` completed successfully (118 modules, no errors)
