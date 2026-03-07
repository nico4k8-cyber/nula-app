/**
 * Telegram Bot Webhook
 * Handles incoming messages from subscribers.
 *
 * Env vars required:
 *   TELEGRAM_BOT_TOKEN      — токен бота от @BotFather
 *   UPSTASH_REDIS_REST_URL  — из Upstash Dashboard
 *   UPSTASH_REDIS_REST_TOKEN — из Upstash Dashboard
 */

const SUBSCRIBERS_KEY = "triz_subscribers"; // Redis SET key

async function redisCmd(url, token, command, ...args) {
    const resp = await fetch(`${url}/${command}/${args.map(a => encodeURIComponent(a)).join("/")}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) throw new Error(`Upstash error: ${resp.status} ${await resp.text()}`);
    return resp.json();
}

async function sendTgMessage(token, chatId, text) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
}

export default async function handler(req, res) {
    // Telegram sends POST updates
    if (req.method !== "POST") return res.status(200).json({ ok: true });

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!botToken || !redisUrl || !redisToken) {
        console.error("Missing env vars: TELEGRAM_BOT_TOKEN / UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN");
        return res.status(200).json({ ok: true }); // всегда 200 для Telegram
    }

    try {
        const update = req.body;
        const message = update?.message;
        if (!message) return res.status(200).json({ ok: true });

        const chatId = message.chat?.id;
        const text = (message.text || "").trim();
        const firstName = message.from?.first_name || "друг";

        if (!chatId) return res.status(200).json({ ok: true });

        if (text === "/start" || text.startsWith("/start ")) {
            // Добавляем в SET подписчиков
            await redisCmd(redisUrl, redisToken, "sadd", SUBSCRIBERS_KEY, chatId);
            await sendTgMessage(botToken, chatId,
                `Привет, ${firstName}! 🐉\n\n` +
                `Ты подписан на новые задачи тренажёра изобретательского мышления.\n\n` +
                `Как только появится новая задача — пришлю сюда. Пока тренируйся на тех что есть 👇\n` +
                `https://formula-intellect.vercel.app`
            );
            console.log(`New subscriber: ${chatId} (${firstName})`);
        } else if (text === "/stop" || text === "/unsubscribe") {
            await redisCmd(redisUrl, redisToken, "srem", SUBSCRIBERS_KEY, chatId);
            await sendTgMessage(botToken, chatId, "Ты отписан. Если передумаешь — просто напиши /start 👋");
            console.log(`Unsubscribed: ${chatId}`);
        } else if (text === "/count") {
            // Скрытая команда для администратора
            const result = await redisCmd(redisUrl, redisToken, "scard", SUBSCRIBERS_KEY);
            await sendTgMessage(botToken, chatId, `Подписчиков сейчас: <b>${result.result}</b>`);
        } else {
            await sendTgMessage(botToken, chatId,
                `Я умею только одно — присылать уведомления о новых задачах 🐉\n\nЧтобы подписаться: /start\nЧтобы отписаться: /stop`
            );
        }
    } catch (err) {
        console.error("Webhook error:", err.message);
    }

    return res.status(200).json({ ok: true });
}
