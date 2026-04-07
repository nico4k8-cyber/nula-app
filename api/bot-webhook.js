// Telegram Bot Webhook — принимает updates от Telegram
// Добавляет chatId в Redis Set triz_subscribers при команде /start
// Защищён X-Telegram-Bot-Api-Secret-Token header

const SUBSCRIBERS_KEY = "triz_subscribers";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Security: проверить secret token (устанавливается при setWebhook)
  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (webhookSecret) {
    const incoming = req.headers["x-telegram-bot-api-secret-token"];
    if (incoming !== webhookSecret) {
      return res.status(403).json({ error: "Forbidden" });
    }
  }

  const update = req.body;
  const message = update?.message;
  if (!message) {
    return res.status(200).json({ ok: true }); // Telegram ждёт 200 даже на пустые updates
  }

  const chatId = message.chat?.id;
  const text = message.text || "";

  if (!chatId) return res.status(200).json({ ok: true });

  // Обработка /start
  if (text.startsWith("/start")) {
    // Добавить в Redis Set
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (redisUrl && redisToken) {
      await fetch(`${redisUrl}/sadd/${SUBSCRIBERS_KEY}/${chatId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${redisToken}` },
      });
    }

    // Ответить пользователю
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (botToken) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "✅ Подписан! Каждый день в 11:00 (МСК) буду присылать задачу дня из Города ТРИЗ.",
          parse_mode: "HTML",
        }),
      });
    }
  }

  return res.status(200).json({ ok: true });
}
