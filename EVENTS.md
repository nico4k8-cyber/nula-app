# Analytics Events Documentation

This document lists all events tracked in the "Разгадай" game application.

## Event Categories

### 1. Onboarding Events

| Event | Trigger | Properties | Purpose |
|-------|---------|-----------|---------|
| `onboarding_splash_viewed` | When splash screen appears | None | Track when users see the initial dragon animation |
| `onboarding_bubble_viewed` | When greeting bubble screen appears | None | Track when users see the dragon greeting |
| `onboarding_completed` | User clicks "Начать" on greeting screen | None | Track onboarding completion |
| `age_group_selected` | User selects age group and clicks "НАЧАТЬ" | `ageGroup: string` | Track which age group user selected |

### 2. Game Flow Events

| Event | Trigger | Properties | Purpose |
|-------|---------|-----------|---------|
| `task_started` | User clicks on a puzzle task | `taskIndex: number` | Track which tasks users attempt |
| `task_completed` | User completes a puzzle (solves it) | `taskId: number`, `taskName: string`, `earnedXP: number`, `isNewUnlock: boolean`, `solveCount: number` | Track task solutions and learning progress |
| `puzzle_submitted` | User submits their answer to puzzle | (reserved for future use) | Track puzzle attempt frequency |
| `building_unlocked` | User unlocks a new building/method | `buildingId: number`, `buildingName: string`, `totalUnlocked: number` | Track progression through TRIZ methods |

### 3. Navigation Events

| Event | Trigger | Properties | Purpose |
|-------|---------|-----------|---------|
| `city_opened` | User clicks "Город" button | `collectedCount: number` | Track how often users check their progress |
| `city_closed` | User clicks "Назад" in City screen | None | Track engagement with city feature |
| `menu_opened` | User clicks menu (☰) button | None | Track menu usage |
| `menu_closed` | User closes menu | None | Track menu interaction duration |

### 4. Menu Action Events

| Event | Trigger | Properties | Purpose |
|-------|---------|-----------|---------|
| `progress_reset` | User clicks "Сбросить прогресс" | `previousProgress: number` | Track if users restart games |
| `age_changed` | User clicks "Выбрать возраст" to change | `previousAgeGroup: string` | Track age group changes |

### 5. Dragon Interaction Events

| Event | Trigger | Properties | Purpose |
|-------|---------|-----------|---------|
| `dragon_info_opened` | User clicks dragon to learn more | None | Track interest in dragon/game narrative |
| `dragon_greeting_closed` | User closes dragon greeting dialog | None | Track onboarding engagement |

### 6. Debug Events

| Event | Trigger | Properties | Purpose |
|-------|---------|-----------|---------|
| `debug_reset_triggered` | User clicks logo 10 times | None | Track when dev reset is used |

---

## How Events Are Stored

Events are currently tracked in two ways:

1. **Session Storage**: All events are stored in `sessionStorage` under key `analytics_events` for debugging
2. **Console Logging**: In development mode, all events are logged to console

Future implementation will send events to backend API at `/api/events`

## Event Structure

Every event contains:
```javascript
{
  event: "event_name",           // Event key from EVENTS enum
  timestamp: "2026-03-25T...",   // ISO 8601 timestamp
  url: "http://localhost:5174",  // Current page URL
  ...properties                   // Additional event-specific properties
}
```

## Accessing Events in Development

In browser console, run:
```javascript
JSON.parse(sessionStorage.getItem('analytics_events'))
```

Or use the analytics utility:
```javascript
import { getSessionEvents, clearSessionEvents } from './analytics';
getSessionEvents();      // Get all events
clearSessionEvents();    // Clear session events
```

## Future: Backend Integration

To enable backend event tracking:

1. Create API endpoint `/api/events` that accepts POST requests
2. Update `trackEvent()` in `analytics.js` to send events:
```javascript
fetch('/api/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(event)
});
```
3. Store events in analytics database
4. Create dashboard to visualize user behavior

---

## Quick Reference

**Total Events**: 18
- Onboarding: 4
- Game Flow: 4
- Navigation: 4
- Menu Actions: 2
- Dragon: 2
- Debug: 1 + 1 reserved

