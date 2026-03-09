/**
 * GET /api/daily-summary
 * Reads today's aggregate stats from Vercel KV (Upstash Redis) and
 * sends a formatted summary to the admin Telegram chat.
 *
 * Called automatically by Vercel Cron (see vercel.json) at 20:00 UTC,
 * or manually via x-log-secret header (e.g. from admin 10-click button).
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
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_LOG_CHAT;
    if (!botToken || !chatId) {
        console.warn("daily-summary: Telegram not configured");
        return null;
    }
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
    // Null / undefined → 0
    const v = parseFloat(n) || 0;
    return v;
}

// Format large numbers nicely: 180000 → "180 000"
function fmtInt(n) {
    return Math.round(fmt(n)).toLocaleString("ru-RU");
}

export default async function handler(req, res) {
    // Allow both GET (cron / browser) and POST (manual fetch)
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "GET" && req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Auth: Vercel cron header OR shared secret
    const isCron = req.headers["x-vercel-cron"] === "1";
    const secret = process.env.LOG_SECRET;
    const hasSecret = secret && req.headers["x-log-secret"] === secret;
    if (!isCron && !hasSecret) {
        return res.status(403).json({ error: "Forbidden" });
    }

    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const prefix = `fi:daily:${date}`;

    const keys = [
        `${prefix}:cost_usd`,
        `${prefix}:chat_cost`,
        `${prefix}:hook_cost`,
        `${prefix}:report_cost`,
        `${prefix}:tasks_started`,
        `${prefix}:tasks_completed`,
        `${prefix}:turns`,
        `${prefix}:input_tokens`,
        `${prefix}:output_tokens`,
    ];

    const [
        costUsd,
        chatCost,
        hookCost,
        reportCost,
        tasksStarted,
        tasksCompleted,
        turns,
        inputTokens,
        outputTokens,
    ] = await kvMget(keys);

    const totalCost  = fmt(costUsd);
    const chat       = fmt(chatCost);
    const hook       = fmt(hookCost);
    const report     = fmt(reportCost);
    const started    = Math.round(fmt(tasksStarted));
    const completed  = Math.round(fmt(tasksCompleted));
    const pct        = started > 0 ? Math.round((completed / started) * 100) : 0;
    const turnCount  = Math.round(fmt(turns));
    const inTok      = fmtInt(inputTokens);
    const outTok     = fmtInt(outputTokens);

    // Format date as Russian "8 марта 2026"
    const MONTHS = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
    const d = new Date(date + "T12:00:00Z");
    const dateRu = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;

    const message = [
        `📊 <b>ИТОГИ ДНЯ (${dateRu})</b>`,
        ``,
        `💰 Потрачено: <b>$${totalCost.toFixed(3)}</b> всего`,
        `   chat: $${chat.toFixed(3)} | hook: $${hook.toFixed(3)} | report: $${report.toFixed(3)}`,
        ``,
        `🎯 Задач начато: <b>${started}</b>`,
        `✅ Задач решено: <b>${completed}</b>${started > 0 ? ` (${pct}%)` : ""}`,
        `💬 Ходов в диалоге: <b>${turnCount}</b>`,
        `🔤 Токенов: <b>${inTok}</b> вх + <b>${outTok}</b> исх`,
    ].join("\n");

    console.log("daily-summary:", { date, totalCost, started, completed, turnCount });

    await sendTelegram(message);

    return res.status(200).json({
        ok: true,
        date,
        totalCost,
        tasksStarted: started,
        tasksCompleted: completed,
        turns: turnCount,
    });
}
