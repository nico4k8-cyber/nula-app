---
phase: 03-dailychallenge-retention
plan: "01"
subsystem: DailyChallenge UX
tags: [daily-challenge, retention, ux, minimize]
dependency_graph:
  requires: []
  provides: [DailyChallenge visible in city, minimize/expand behavior, daily bypass of canPlayTask]
  affects: [src/App.jsx, src/components/DailyChallenge.jsx]
tech_stack:
  added: []
  patterns: [minimize-not-dismiss, direct-task-injection, localStorage date keying]
key_files:
  created: []
  modified:
    - src/components/DailyChallenge.jsx
    - src/App.jsx
decisions:
  - Reuse shariel_daily_dismissed localStorage key for minimize state (backward compatible)
  - onStart prop added alongside onStartTask for direct task object injection
  - DAILY_CHALLENGE_STARTED as literal string (not from EVENTS enum, which has no daily entry)
metrics:
  duration: ~10min
  completed: 2026-04-07
  tasks_completed: 2
  files_modified: 2
---

# Phase 03 Plan 01: DailyChallenge UX Fix Summary

DailyChallenge minimize-instead-of-dismiss + city integration + canPlayTask bypass.

## What Changed

### DailyChallenge.jsx — Minimize Logic

- `dismissed` state renamed to `minimized`; same localStorage key `shariel_daily_dismissed` reused for compatibility
- When `minimized === true`: renders compact amber strip "Задача дня — нажми, чтобы открыть" with expand-on-click
- `handleDismiss` → `handleMinimize`: sets `minimized(true)`, writes date to localStorage
- X button hidden when task is already completed (`isDone`)
- Added `onStart` prop that receives the task object directly (used by App.jsx); existing `onStartTask` index-based prop preserved for backward compat
- Timezone fix: `new Date().toLocaleDateString('sv')` instead of `toISOString().slice(0,10)` in both state init and handleMinimize

### App.jsx — DailyChallenge Integration

- `<DailyChallenge>` inserted inside `{phase === "city"}` block, above `<City>`
- Props: `TASKS={remoteTasks || TASKS}`, `completedTasks`, `onStart`
- `onStart` callback: sets task, resets messages/sessionStars/sessionHints/sessionAttempts, calls `setPhase("dialog")` — no `canPlayTask()` check, bypassing the 3/day free limit intentionally
- Analytics: `trackEvent("DAILY_CHALLENGE_STARTED", { taskId: dailyTask.id })` fired on start

## Bypass Confirmation

The path `DailyChallenge.onStart → setTask → setPhase("dialog")` does NOT call `canPlayTask()`. The daily challenge is exempt from the free-user 3/day limit by design (DC-02 requirement).

## Commits

- `0a69465` feat(03-01): DailyChallenge minimize mode instead of dismiss
- `f4f5839` feat(03-01): wire DailyChallenge into phase=city + bypass canPlayTask

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] src/components/DailyChallenge.jsx exists and modified
- [x] src/App.jsx exists and modified
- [x] Commits 0a69465 and f4f5839 exist
- [x] `npm run build` passes (✓ built in 2.25s, no errors)
