// Telegram Bot Webhook — принимает updates от Telegram
// Добавляет chatId в Supabase telegram_subscribers при команде /start
// Защищён X-Telegram-Bot-Api-Secret-Token header

async function supabaseUpsert(url, key, chatId) {
  const resp = await fetch(`${url}/rest/v1/telegram_subscribers`, {
    method: "POST",
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      "Prefer": "resolution=ignore-duplicates",
    },
    body: JSON.stringify({ chat_id: String(chatId) }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    console.error("Supabase upsert error:", resp.status, txt);
  }
}

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
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      await supabaseUpsert(supabaseUrl, supabaseKey, chatId);
    }

    // Ответить пользователю
    const botToken = process.env.TELEGRAM_SUBSCRIBER_BOT_TOKEN;
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
