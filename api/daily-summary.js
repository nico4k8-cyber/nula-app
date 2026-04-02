/**
 * GET /api/daily-summary
 * Reads today's aggregate stats from Vercel KV (Upstash Redis) and
 * sends a formatted summary to the admin Telegram chat.
 *
 * Called automatically by Vercel Cron (see vercel.json) at 20:00 UTC,
 * or manually via x-log-secret header (e.g. from admin 10-click button).
 *
 * ?days=7  — send historical report for last 7 days (one-time use)
 *
 * Required env vars:
 *   KV_REST_API_URL       — Upstash Redis REST endpoint (auto-set by Vercel KV)
 *   KV_REST_API_TOKEN     — Upstash Redis REST token   (auto-set by Vercel KV)
 *   LOG_SECRET            — shared secret for manual calls
 *   TELEGRAM_BOT_TOKEN    — Telegram bot token
 *   TELEGRAM_LOG_CHAT     — admin Telegram chat ID to receive the summary
 */

// Read multiple KV keys in one pipeline request
async function kvMget(keys) {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) {
        console.warn("daily-summary: KV not configured");
        return keys.map(() => null);
    }
    const commands = keys.map(k => ["GET", k]);
    const resp = await fetch(`${url}/pipeline`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(commands),
    });
    if (!resp.ok) {
        const txt = await resp.text();
        console.error("daily-summary KV error:", resp.status, txt);
        return keys.map(() => null);
    }
    const results = await resp.json();
    // Upstash pipeline returns [{ result: value }, ...] per command
    return results.map(r => r?.result ?? null);
}

// Send a Telegram message to the admin log chat
async function sendTelegram(text) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN || "8316651117:AAGd7FAWu4Q1vsDd0riKF-UcKYT4S7v3uF0";
    const chatId = process.env.TELEGRAM_LOG_CHAT || "122107817";
    const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    if (!resp.ok) {
        const txt = await resp.text();
        console.error("daily-summary Telegram error:", resp.status, txt);
    }
    return resp;
}

function fmt(n) {
    const v = parseFloat(n) || 0;
    return v;
}

// Format large numbers nicely: 180000 → "180 000"
function fmtInt(n) {
    return Math.round(fmt(n)).toLocaleString("ru-RU");
}

const MONTHS = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
const RUB_RATE = 90;

function dateRu(isoDate) {
    const d = new Date(isoDate + "T12:00:00Z");
    return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

// Returns YYYY-MM-DD for offset days ago (0 = today)
function dateOffset(offset) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - offset);
    return d.toISOString().slice(0, 10);
}

const FIELDS = ["cost_usd","chat_cost","hook_cost","report_cost","tasks_started","tasks_completed","turns","input_tokens","output_tokens"];

async function fetchDayStats(date) {
    const prefix = `fi:daily:${date}`;
    const keys = FIELDS.map(f => `${prefix}:${f}`);
    const values = await kvMget(keys);
    return Object.fromEntries(FIELDS.map((f, i) => [f, fmt(values[i])]));
}

export default async function handler(req, res) {
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "GET" && req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Auth: Vercel cron header OR shared secret (soft — warn but allow if secret not set)
    const isCron = req.headers["x-vercel-cron"] === "1";
    const secret = process.env.LOG_SECRET;
    const headerSecret = req.headers["x-log-secret"];
    const hasSecret = !secret || headerSecret === secret;
    if (!isCron && !hasSecret) {
        console.warn("daily-summary: secret mismatch, blocking");
        return res.status(403).json({ error: "Forbidden" });
    }

    const wantDays = parseInt(req.query?.days || "1", 10);

    // ── 7-day historical report ──────────────────────────────────────────────
    if (wantDays > 1) {
        const days = Math.min(wantDays, 7);
        const dates = Array.from({ length: days }, (_, i) => dateOffset(days - 1 - i));
        const stats = await Promise.all(dates.map(fetchDayStats));

        const totals = FIELDS.reduce((acc, f) => {
            acc[f] = stats.reduce((s, d) => s + d[f], 0);
            return acc;
        }, {});

        const totalRub = (totals.cost_usd * RUB_RATE).toFixed(0);
        const pct = totals.tasks_started > 0
            ? Math.round((totals.tasks_completed / totals.tasks_started) * 100) : 0;

        const lines = [
            `📊 <b>ИТОГИ ЗА ${days} ДНЕЙ</b>`,
            ``,
            `💰 Всего: <b>$${totals.cost_usd.toFixed(3)}</b> (≈ ${totalRub} ₽)`,
            `   chat: $${totals.chat_cost.toFixed(3)} | hook: $${totals.hook_cost.toFixed(3)} | report: $${totals.report_cost.toFixed(3)}`,
            ``,
            `🎯 Задач начато: <b>${Math.round(totals.tasks_started)}</b>`,
            `✅ Задач решено: <b>${Math.round(totals.tasks_completed)}</b>${totals.tasks_started > 0 ? ` (${pct}%)` : ""}`,
            `💬 Ходов: <b>${Math.round(totals.turns)}</b>`,
            `🔤 Токенов: <b>${fmtInt(totals.input_tokens)}</b> вх + <b>${fmtInt(totals.output_tokens)}</b> исх`,
            ``,
            `<b>По дням:</b>`,
        ];

        for (let i = 0; i < days; i++) {
            const s = stats[i];
            const hasCost = s.cost_usd > 0;
            const marker = hasCost ? "▪️" : "▫️";
            lines.push(`${marker} <b>${dateRu(dates[i])}</b>  $${s.cost_usd.toFixed(3)} (≈ ${(s.cost_usd * RUB_RATE).toFixed(0)} ₽)  задач: ${Math.round(s.tasks_started)}/${Math.round(s.tasks_completed)}`);
        }

        console.log("daily-summary weekly:", { days, totalCost: totals.cost_usd });
        await sendTelegram(lines.join("\n"));

        return res.status(200).json({ ok: true, days, totalCost: totals.cost_usd });
    }

    // ── Single day (default / cron) ──────────────────────────────────────────
    const date = dateOffset(0);
    const s = await fetchDayStats(date);

    const pct = s.tasks_started > 0 ? Math.round((s.tasks_completed / s.tasks_started) * 100) : 0;
    const totalRub = (s.cost_usd * RUB_RATE).toFixed(0);

    const message = [
        `📊 <b>ИТОГИ ДНЯ (${dateRu(date)})</b>`,
        ``,
        `💰 Потрачено: <b>$${s.cost_usd.toFixed(3)}</b> (≈ ${totalRub} ₽) всего`,
        `   chat: $${s.chat_cost.toFixed(3)} | hook: $${s.hook_cost.toFixed(3)} | report: $${s.report_cost.toFixed(3)}`,
        ``,
        `🎯 Задач начато: <b>${Math.round(s.tasks_started)}</b>`,
        `✅ Задач решено: <b>${Math.round(s.tasks_completed)}</b>${s.tasks_started > 0 ? ` (${pct}%)` : ""}`,
        `💬 Ходов в диалоге: <b>${Math.round(s.turns)}</b>`,
        `🔤 Токенов: <b>${fmtInt(s.input_tokens)}</b> вх + <b>${fmtInt(s.output_tokens)}</b> исх`,
    ].join("\n");

    console.log("daily-summary:", { date, totalCost: s.cost_usd, started: s.tasks_started, completed: s.tasks_completed });

    await sendTelegram(message);

    return res.status(200).json({
        ok: true,
        date,
        totalCost: s.cost_usd,
        tasksStarted: Math.round(s.tasks_started),
        tasksCompleted: Math.round(s.tasks_completed),
        turns: Math.round(s.turns),
    });
}
