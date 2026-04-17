/**
 * Broadcast notification to all bot subscribers.
 *
 * POST /api/notify
 * Body: { secret: "...", message: "Текст уведомления", taskUrl: "https://..." }
 *
 * Env vars required:
 *   TELEGRAM_SUBSCRIBER_BOT_TOKEN — токен бота для подписчиков
 *   SUPABASE_URL                  — URL Supabase проекта
 *   SUPABASE_ANON_KEY             — anon key Supabase
 *   NOTIFY_SECRET                 — произвольный секрет для защиты эндпоинта
 */

async function getSubscribers(supabaseUrl, supabaseKey, hour = null) {
    let url = `${supabaseUrl}/rest/v1/telegram_subscribers?select=chat_id`;
    if (hour !== null) {
        url = `${supabaseUrl}/rest/v1/telegram_subscribers?notify_hour_utc=eq.${hour}&select=chat_id`;
    }
    const resp = await fetch(url, {
        headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
        },
    });
    if (!resp.ok) throw new Error(`Supabase select error: ${resp.status} ${await resp.text()}`);
    const rows = await resp.json();
    return rows.map(r => r.chat_id);
}

async function deleteSubscriber(supabaseUrl, supabaseKey, chatId) {
    await fetch(`${supabaseUrl}/rest/v1/telegram_subscribers?chat_id=eq.${encodeURIComponent(chatId)}`, {
        method: "DELETE",
        headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
        },
    });
}

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { secret, message, taskUrl, hour } = req.body;
    const notifySecret = process.env.NOTIFY_SECRET;

    if (!notifySecret || secret !== notifySecret) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const botToken = process.env.TELEGRAM_SUBSCRIBER_BOT_TOKEN;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!botToken || !supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: "Missing env vars" });
    }

    try {
        const subscribers = await getSubscribers(supabaseUrl, supabaseKey, hour);

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
                        await deleteSubscriber(supabaseUrl, supabaseKey, chatId);
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
