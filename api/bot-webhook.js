/**
 * Telegram Bot Webhook
 * Handles incoming messages from subscribers + support chat relay.
 *
 * Env vars required:
 *   TELEGRAM_BOT_TOKEN      — токен бота от @BotFather
 *   UPSTASH_REDIS_REST_URL  — из Upstash Dashboard
 *   UPSTASH_REDIS_REST_TOKEN — из Upstash Dashboard
 *   TELEGRAM_LOG_CHAT       — chat_id админа для поддержки (122107817)
 */

const SUBSCRIBERS_KEY = "triz_subscribers"; // Redis SET key
const SUPPORT_MODE_PREFIX = "support_mode:"; // Redis key prefix for support state
const SUPPORT_MSG_PREFIX = "support_msg:";   // Redis key prefix for message mapping

async function redisCmd(url, token, command, ...args) {
    const resp = await fetch(`${url}/${command}/${args.map(a => encodeURIComponent(a)).join("/")}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) throw new Error(`Upstash error: ${resp.status} ${await resp.text()}`);
    return resp.json();
}

async function sendTgMessage(token, chatId, text, extra = {}) {
    const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...extra }),
    });
    const data = await resp.json();
    return data;
}

export default async function handler(req, res) {
    // Telegram sends POST updates
    if (req.method !== "POST") return res.status(200).json({ ok: true });

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    const adminChatId = process.env.TELEGRAM_LOG_CHAT || "122107817";

    if (!botToken || !redisUrl || !redisToken) {
        console.error("Missing env vars: TELEGRAM_BOT_TOKEN / UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN");
        return res.status(200).json({ ok: true });
    }

    try {
        const update = req.body;
        const message = update?.message;
        if (!message) return res.status(200).json({ ok: true });

        const chatId = message.chat?.id;
        const text = (message.text || "").trim();
        const firstName = message.from?.first_name || "друг";
        const username = message.from?.username || "";

        if (!chatId) return res.status(200).json({ ok: true });

        // ═══ ADMIN REPLY → forward to user ═══
        // When admin replies to a forwarded support message, send response back to user
        if (String(chatId) === String(adminChatId) && message.reply_to_message) {
            const repliedMsgId = message.reply_to_message.message_id;
            const lookupResult = await redisCmd(redisUrl, redisToken, "get", `${SUPPORT_MSG_PREFIX}${repliedMsgId}`);
            const userChatId = lookupResult.result;

            if (userChatId) {
                await sendTgMessage(botToken, userChatId,
                    `💬 <b>Ответ от команды Формулы Интеллекта:</b>\n\n${text}`
                );
                await sendTgMessage(botToken, adminChatId, `✅ Ответ доставлен пользователю.`);
                console.log(`Support reply sent to ${userChatId}`);
                return res.status(200).json({ ok: true });
            }
        }

        // ═══ /start ═══
        if (text === "/start" || (text.startsWith("/start ") && !text.includes("support"))) {
            await redisCmd(redisUrl, redisToken, "sadd", SUBSCRIBERS_KEY, chatId);
            await sendTgMessage(botToken, chatId,
                `Привет, ${firstName}! 🐉\n\n` +
                `Ты подписан на новые задачи тренажёра изобретательского мышления.\n\n` +
                `Как только появится новая задача — пришлю сюда. Пока тренируйся на тех что есть 👇\n` +
                `https://formula-intellect.vercel.app\n\n` +
                `Если возникнут вопросы или ошибки — напиши /support`
            );
            console.log(`New subscriber: ${chatId} (${firstName})`);

        // ═══ /start support (deep link from website) ═══
        } else if (text === "/start support" || text === "/support") {
            // Also subscribe if not yet
            await redisCmd(redisUrl, redisToken, "sadd", SUBSCRIBERS_KEY, chatId);
            // Set support mode with 10-minute TTL
            await redisCmd(redisUrl, redisToken, "set", `${SUPPORT_MODE_PREFIX}${chatId}`, "1", "EX", "600");
            await sendTgMessage(botToken, chatId,
                `📩 <b>Поддержка</b>\n\n` +
                `Напиши своё сообщение — я передам его команде. Отвечу как можно скорее!\n\n` +
                `<i>Можешь описать ошибку, задать вопрос или просто оставить отзыв.</i>`
            );
            console.log(`Support mode activated: ${chatId} (${firstName})`);

        // ═══ /stop ═══
        } else if (text === "/stop" || text === "/unsubscribe") {
            await redisCmd(redisUrl, redisToken, "srem", SUBSCRIBERS_KEY, chatId);
            await sendTgMessage(botToken, chatId, "Ты отписан. Если передумаешь — просто напиши /start 👋");
            console.log(`Unsubscribed: ${chatId}`);

        // ═══ /count (admin only) ═══
        } else if (text === "/count") {
            const result = await redisCmd(redisUrl, redisToken, "scard", SUBSCRIBERS_KEY);
            await sendTgMessage(botToken, chatId, `Подписчиков сейчас: <b>${result.result}</b>`);

        // ═══ Regular message — check if in support mode ═══
        } else {
            // Check if user is in support mode
            const supportMode = await redisCmd(redisUrl, redisToken, "get", `${SUPPORT_MODE_PREFIX}${chatId}`);

            if (supportMode.result) {
                // Forward message to admin with user info
                const userLabel = username ? `@${username}` : `id:${chatId}`;
                const adminMsg = await sendTgMessage(botToken, adminChatId,
                    `📩 <b>Сообщение в поддержку</b>\n` +
                    `От: <b>${firstName}</b> (${userLabel})\n` +
                    `━━━━━━━━━━━━━━━━━━\n` +
                    `${text}\n` +
                    `━━━━━━━━━━━━━━━━━━\n` +
                    `<i>↩️ Ответь на это сообщение — ответ уйдёт пользователю</i>`
                );

                // Store mapping: admin message ID → user chat ID (7 day TTL)
                if (adminMsg.ok && adminMsg.result?.message_id) {
                    await redisCmd(redisUrl, redisToken, "set",
                        `${SUPPORT_MSG_PREFIX}${adminMsg.result.message_id}`,
                        String(chatId), "EX", "604800"
                    );
                }

                // Clear support mode
                await redisCmd(redisUrl, redisToken, "del", `${SUPPORT_MODE_PREFIX}${chatId}`);

                // Confirm to user
                await sendTgMessage(botToken, chatId,
                    `✅ Сообщение отправлено! Отвечу как можно скорее.\n\n` +
                    `Если хочешь написать ещё — нажми /support`
                );
                console.log(`Support message from ${chatId} (${firstName}): ${text.substring(0, 50)}...`);

            } else {
                // Default response
                await sendTgMessage(botToken, chatId,
                    `Я умею только одно — присылать уведомления о новых задачах 🐉\n\n` +
                    `Подписаться: /start\n` +
                    `Отписаться: /stop\n` +
                    `Написать в поддержку: /support`
                );
            }
        }
    } catch (err) {
        console.error("Webhook error:", err.message);
    }

    return res.status(200).json({ ok: true });
}
