/**
 * Broadcast notification to all bot subscribers.
 *
 * POST /api/notify
 * Body: { secret: "...", message: "Текст уведомления", taskUrl: "https://..." }
 *
 * Env vars required:
 *   TELEGRAM_BOT_TOKEN
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *   NOTIFY_SECRET             — произвольный секрет для защиты эндпоинта
 */

const SUBSCRIBERS_KEY = "triz_subscribers";

async function redisCmd(url, token, command, ...args) {
    const resp = await fetch(`${url}/${command}/${args.map(a => encodeURIComponent(a)).join("/")}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) throw new Error(`Upstash error: ${resp.status} ${await resp.text()}`);
    return resp.json();
}

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { secret, message, taskUrl } = req.body;
    const notifySecret = process.env.NOTIFY_SECRET;

    if (!notifySecret || secret !== notifySecret) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!botToken || !redisUrl || !redisToken) {
        return res.status(500).json({ error: "Missing env vars" });
    }

    try {
        // Получаем всех подписчиков
        const result = await redisCmd(redisUrl, redisToken, "smembers", SUBSCRIBERS_KEY);
        const subscribers = result.result || [];

        if (subscribers.length === 0) {
            return res.status(200).json({ sent: 0, message: "No subscribers" });
        }

        const text = message + (taskUrl ? `\n\n👉 ${taskUrl}` : "");

        // Отправляем всем (с задержкой 50мс чтоб не превышать лимиты Telegram)
        let sent = 0;
        let failed = 0;
        for (const chatId of subscribers) {
            try {
                const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
                });
                if (resp.ok) {
                    sent++;
                } else {
                    const err = await resp.json();
                    // Если бот заблокирован пользователем — удаляем из базы
                    if (err.error_code === 403) {
                        await redisCmd(redisUrl, redisToken, "srem", SUBSCRIBERS_KEY, chatId);
                        console.log(`Removed blocked subscriber: ${chatId}`);
                    }
                    failed++;
                }
                await new Promise(r => setTimeout(r, 50));
            } catch (e) {
                failed++;
            }
        }

        console.log(`Broadcast done: ${sent} sent, ${failed} failed`);
        return res.status(200).json({ sent, failed, total: subscribers.length });

    } catch (err) {
        console.error("Notify error:", err.message);
        return res.status(500).json({ error: err.message });
    }
}
