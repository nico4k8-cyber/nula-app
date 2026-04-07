---
phase: 03-dailychallenge-retention
plan: "03"
subsystem: telegram-notifications
tags: [telegram, bot, webhook, cron, redis, push-notifications]
dependency_graph:
  requires: [api/notify.js, Upstash Redis]
  provides: [api/bot-webhook.js, api/notify-daily.js, Telegram subscribe UI]
  affects: [SettingsMenu.jsx, vercel.json]
tech_stack:
  added: [Telegram Bot API, Vercel Cron]
  patterns: [Upstash Redis REST API (fetch + Bearer token), Vercel serverless functions]
key_files:
  created:
    - api/bot-webhook.js
    - api/notify-daily.js
  modified:
    - vercel.json
    - src/components/SettingsMenu.jsx
decisions:
  - Removed onClick analytics from Telegram button (no window.ym/_metrika_id pattern found in SettingsMenu)
  - WEBHOOK_SECRET check is conditional (graceful degradation if env var absent)
metrics:
  duration: ~15min
  completed_date: "2026-04-07"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 4
---

# Phase 03 Plan 03: Telegram Bot Webhook + Daily Push Summary

**One-liner:** Telegram bot webhook with Redis subscriber collection and Vercel cron daily push at 08:00 UTC via existing notify.js broadcast infrastructure.

## What Was Built

### api/bot-webhook.js
POST endpoint that receives Telegram updates. On `/start` command:
1. Validates `X-Telegram-Bot-Api-Secret-Token` header (if `WEBHOOK_SECRET` env var set)
2. `SADD chatId` to Redis key `triz_subscribers` via Upstash REST API
3. Sends confirmation message to user via Telegram Bot API
4. Returns `200 { ok: true }` on all other updates (Telegram requirement)

### api/notify-daily.js
GET endpoint called by Vercel Cron at `0 8 * * *` (08:00 UTC = 11:00 МСК).
Builds a daily reminder message and calls `/api/notify` (existing broadcast endpoint) with `NOTIFY_SECRET`.

### vercel.json
Added second cron entry:
```json
{ "path": "/api/notify-daily", "schedule": "0 8 * * *" }
```

### src/components/SettingsMenu.jsx
Added "Напоминания в Telegram" anchor link:
- URL: `https://t.me/triz_train_bot?start=reminders`
- Opens in new tab, styled with blue pill button
- No onClick analytics (no existing `window.ym` pattern found in SettingsMenu)

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 2b7e078 | feat(03-03): add Telegram bot webhook endpoint |
| Task 2 | 2a7a38d | feat(03-03): add daily push cron + Telegram subscribe button in SettingsMenu |

## Deviations from Plan

**1. [Rule 1 - Minor] Removed onClick analytics from Telegram button**
- Found during: Task 2
- Issue: Plan specified `window.ym(window._metrika_id ...)` but no such pattern exists in SettingsMenu.jsx — no other button uses Yandex Metrika
- Fix: Omitted onClick entirely as per plan's own fallback instruction ("If no analytics — remove onClick")
- Files modified: src/components/SettingsMenu.jsx

No other deviations — plan executed as specified.

## User Action Checklist (External Setup Required)

These steps CANNOT be automated — must be done manually after deploying:

### Step 1: Deploy to Vercel
```bash
git push origin main
# or: vercel --prod
```

### Step 2: Verify Environment Variables in Vercel Dashboard
Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

Check these exist (add if missing):

| Variable | Where to get it |
|----------|----------------|
| `TELEGRAM_BOT_TOKEN` | Already used in api/daily-summary.js — should exist |
| `UPSTASH_REDIS_REST_URL` | Upstash Console → Database → REST API → REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Console → Database → REST API → Read/Write Token |
| `NOTIFY_SECRET` | Make up any string, e.g. `"secret-abc123"` — used to protect /api/notify |
| `WEBHOOK_SECRET` | Same or different string — used to validate Telegram webhook calls |
| `APP_URL` | Your production URL, e.g. `https://nula-triz.vercel.app` |

### Step 3: Register Telegram Webhook
After deploy, run this curl (replace TOKEN and YOUR_DOMAIN):
```bash
curl "https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/setWebhook?url=https://YOUR_DOMAIN/api/bot-webhook&secret_token={WEBHOOK_SECRET}"
```
Expected response:
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

### Step 4: Test the Full Flow
1. Open game → tap Settings icon → see "Напоминания в Telegram" button
2. Tap it → t.me/triz_train_bot opens in browser/app
3. In bot: send `/start` → receive "✅ Подписан!" message
4. Verify Redis: Upstash Console → CLI → run `SMEMBERS triz_subscribers`
   - Should show your Telegram chatId

### Step 5: Test notify-daily manually
```bash
curl https://YOUR_DOMAIN/api/notify-daily
```
Response should show `{ sent: N, failed: 0, total: N }` where N = subscriber count.

### Step 6: Verify cron schedule
In Vercel Dashboard → Project → Cron Jobs — should see two crons:
- `/api/daily-summary` at `0 20 * * *`
- `/api/notify-daily` at `0 8 * * *`

## Architecture Notes

The pipeline is:

```
User taps button in SettingsMenu
  → Opens t.me/triz_train_bot?start=reminders
  → User sends /start to bot
  → Telegram POST /api/bot-webhook
  → Redis SADD triz_subscribers {chatId}
  → User receives confirmation message

Daily at 08:00 UTC:
  Vercel Cron GET /api/notify-daily
  → POST /api/notify with NOTIFY_SECRET + message
  → SMEMBERS triz_subscribers from Redis
  → sendMessage to each chatId
  → Auto-remove blocked subscribers (403 from Telegram)
```

## Known Stubs

None — all data flows are wired to real APIs (Telegram Bot API + Upstash Redis).
`APP_URL` defaults to `https://nula-triz.vercel.app` if env var not set.

## Threat Surface

Security implemented per threat model:
- T-03-03-01: WEBHOOK_SECRET header validation in bot-webhook.js
- T-03-03-02: NOTIFY_SECRET body validation in notify.js (existing)
- T-03-03-03: Redis SADD is idempotent (Set deduplicates)
- T-03-03-05: notify-daily callable without auth (accepts GET/POST) — relies on Vercel Cron being internal; acceptable given low-risk payload

## Self-Check: PASSED

- api/bot-webhook.js: EXISTS
- api/notify-daily.js: EXISTS
- vercel.json cron added: EXISTS (0 8 * * *)
- SettingsMenu.jsx Telegram button: EXISTS
- Commits 2b7e078 and 2a7a38d: EXIST
- Build: PASSED (vite build, no errors)
