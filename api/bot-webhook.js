// Telegram Bot Webhook — принимает updates от Telegram
// Добавляет chatId в Supabase telegram_subscribers при команде /start
// Поддерживает выбор часа доставки задачи в локальном времени
// Защищён X-Telegram-Bot-Api-Secret-Token header

const TIMEZONES = [
  { label: "🌏 UTC−8 (Los Angeles)", offset: -8 },
  { label: "🌎 UTC−7 (Denver)", offset: -7 },
  { label: "🌎 UTC−6 (Mexico City)", offset: -6 },
  { label: "🌎 UTC−5 (New York)", offset: -5 },
  { label: "🌍 UTC−4 (São Paulo)", offset: -4 },
  { label: "🌍 UTC−3 (Buenos Aires)", offset: -3 },
  { label: "🌍 UTC+0 (London, Lisbon)", offset: 0 },
  { label: "🌍 UTC+1 (Paris, Berlin)", offset: 1 },
  { label: "🌍 UTC+2 (Cairo, Helsinki)", offset: 2 },
  { label: "🌍 UTC+3 (Moscow, Istanbul)", offset: 3 },
  { label: "🌏 UTC+5:30 (India)", offset: 5.5 },
  { label: "🌏 UTC+8 (Singapore, China)", offset: 8 },
  { label: "🌏 UTC+9 (Tokyo, Seoul)", offset: 9 },
  { label: "🌏 UTC+10 (Sydney)", offset: 10 },
  { label: "🌏 UTC+12 (Fiji, New Zealand)", offset: 12 },
];

const SUPPORT_CHAT = process.env.TELEGRAM_SUPPORT_CHAT || "@triznula_support";
const APP_URL = process.env.APP_URL || "https://triznula.vercel.app";

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

async function sendMessage(botToken, chatId, text, extra = {}) {
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: "HTML",
    ...extra,
  };

  const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    console.error("Telegram sendMessage error:", resp.status, txt);
  }

  return resp;
}

async function updateSubscriber(url, key, chatId, fields) {
  const resp = await fetch(`${url}/rest/v1/telegram_subscribers?chat_id=eq.${chatId}`, {
    method: "PATCH",
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(fields),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    console.error("Supabase updateSubscriber error:", resp.status, txt);
  }

  return resp;
}

async function handleTimeSelection(botToken, chatId) {
  const timeButtons = [
    [{ text: "7:00", callback_data: "hour:7" }, { text: "8:00", callback_data: "hour:8" }, { text: "9:00", callback_data: "hour:9" }],
    [{ text: "10:00", callback_data: "hour:10" }, { text: "11:00", callback_data: "hour:11" }, { text: "12:00", callback_data: "hour:12" }],
    [{ text: "15:00", callback_data: "hour:15" }, { text: "16:00", callback_data: "hour:16" }, { text: "17:00", callback_data: "hour:17" }],
    [{ text: "18:00", callback_data: "hour:18" }, { text: "19:00", callback_data: "hour:19" }, { text: "20:00", callback_data: "hour:20" }],
    [{ text: "21:00", callback_data: "hour:21" }],
  ];

  await sendMessage(botToken, chatId, "Выбери время доставки задачи дня (по местному времени):", {
    reply_markup: JSON.stringify({ inline_keyboard: timeButtons }),
  });
}

async function handleTimezoneSelection(botToken, chatId, hour) {
  const tzButtons = TIMEZONES.map((tz) => ({
    text: tz.label,
    callback_data: `tz:${hour}:${tz.offset}`,
  })).reduce((arr, btn, idx) => {
    if (idx % 2 === 0) arr.push([btn]);
    else arr[arr.length - 1].push(btn);
    return arr;
  }, []);

  await sendMessage(botToken, chatId, "Выбери свой часовой пояс:", {
    reply_markup: JSON.stringify({ inline_keyboard: tzButtons }),
  });
}

async function supabaseDelete(url, key, chatId) {
  const resp = await fetch(`${url}/rest/v1/telegram_subscribers?chat_id=eq.${chatId}`, {
    method: "DELETE",
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`,
    },
  });
  if (!resp.ok) {
    const txt = await resp.text();
    console.error("Supabase delete error:", resp.status, txt);
  }
  return resp;
}

async function sendStartMessage(botToken, chatId) {
  const keyboard = {
    inline_keyboard: [
      [{ text: "⏰ Настроить время уведомлений", callback_data: "cmd:time" }],
      [{ text: "🎮 Открыть Город ТРИЗ", web_app: { url: APP_URL } }],
      [{ text: "❌ Отписаться", callback_data: "cmd:unsubscribe" }],
    ]
  };
  await sendMessage(botToken, chatId,
    `👋 Привет! Я буду присылать тебе <b>задачу дня</b> из Города ТРИЗ.\n\n` +
    `📚 <b>Что умею:</b>\n` +
    `/time — изменить время уведомлений\n` +
    `/unsubscribe — отписаться\n` +
    `/subscribe — подписаться снова\n` +
    `/help — помощь\n` +
    `/support — написать в поддержку\n\n` +
    `Выбери удобное время — и каждый день получай новую задачу!`,
    { reply_markup: JSON.stringify(keyboard) }
  );
}

async function handleTimezoneConfirm(botToken, supabaseUrl, supabaseKey, chatId, hour, offset) {
  const notifyHourUtc = ((hour - offset) % 24 + 24) % 24;

  await updateSubscriber(supabaseUrl, supabaseKey, chatId, {
    notify_hour_utc: Math.floor(notifyHourUtc),
  });

  const tzLabel = TIMEZONES.find((tz) => tz.offset === parseFloat(offset))?.label || `UTC${offset >= 0 ? "+" : ""}${offset}`;
  const localTimeStr = `${hour.toString().padStart(2, "0")}:00`;

  await sendMessage(botToken, chatId, `✅ Отлично! Каждый день в <b>${localTimeStr}</b> (${tzLabel}) я буду присылать задачу дня из Города ТРИЗ.`);
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

  const botToken = process.env.TELEGRAM_SUBSCRIBER_BOT_TOKEN;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  const update = req.body;

  // Обработка callback_query (кнопки в клавиатуре)
  if (update?.callback_query) {
    const callbackQuery = update.callback_query;
    const chatId = callbackQuery.from?.id;
    const data = callbackQuery.data || "";

    if (!chatId) {
      return res.status(200).json({ ok: true });
    }

    // Обработка выбора часа: hour:7, hour:8, и т.д.
    if (data.startsWith("hour:")) {
      const hour = parseInt(data.split(":")[1], 10);
      if (botToken) {
        await handleTimezoneSelection(botToken, chatId, hour);
      }
      return res.status(200).json({ ok: true });
    }

    // Обработка выбора часового пояса: tz:HOUR:OFFSET
    if (data.startsWith("tz:")) {
      const parts = data.split(":");
      const hour = parseInt(parts[1], 10);
      const offset = parseFloat(parts[2]);

      if (supabaseUrl && supabaseKey && botToken) {
        // Подписать пользователя, если не подписан
        await supabaseUpsert(supabaseUrl, supabaseKey, chatId);
        // Сохранить выбранное время
        await handleTimezoneConfirm(botToken, supabaseUrl, supabaseKey, chatId, hour, offset);
      }
      return res.status(200).json({ ok: true });
    }

    // Обработка cmd: кнопок
    if (data.startsWith("cmd:")) {
      const cmd = data.split(":")[1];
      if (cmd === "time" && botToken) {
        await handleTimeSelection(botToken, chatId);
      } else if (cmd === "subscribe" && supabaseUrl && supabaseKey) {
        await supabaseUpsert(supabaseUrl, supabaseKey, chatId);
        if (botToken) await sendMessage(botToken, chatId, "✅ Ты снова подписан! Используй /time для настройки времени.");
      } else if (cmd === "unsubscribe" && supabaseUrl && supabaseKey) {
        await supabaseDelete(supabaseUrl, supabaseKey, chatId);
        if (botToken) await sendMessage(botToken, chatId, "👋 Ты отписался. Напиши /subscribe чтобы вернуться.");
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(200).json({ ok: true });
  }

  // Обработка текстовых сообщений
  const message = update?.message;
  if (!message) {
    return res.status(200).json({ ok: true }); // Telegram ждёт 200 даже на пустые updates
  }

  const chatId = message.chat?.id;
  const text = message.text || "";

  if (!chatId) return res.status(200).json({ ok: true });

  // /start — подписаться + приветствие
  if (text.startsWith("/start")) {
    if (supabaseUrl && supabaseKey) {
      await supabaseUpsert(supabaseUrl, supabaseKey, chatId);
    }
    if (botToken) {
      await sendStartMessage(botToken, chatId);
    }
    return res.status(200).json({ ok: true });
  }

  // /subscribe — подписаться
  if (text.startsWith("/subscribe")) {
    if (supabaseUrl && supabaseKey) {
      await supabaseUpsert(supabaseUrl, supabaseKey, chatId);
    }
    if (botToken) {
      await sendMessage(botToken, chatId, "✅ Ты подписан на задачи дня! Используй /time чтобы выбрать удобное время.");
    }
    return res.status(200).json({ ok: true });
  }

  // /unsubscribe — отписаться
  if (text.startsWith("/unsubscribe")) {
    if (supabaseUrl && supabaseKey) {
      await supabaseDelete(supabaseUrl, supabaseKey, chatId);
    }
    if (botToken) {
      await sendMessage(botToken, chatId,
        "👋 Ты отписался от задач дня.\n\nЕсли захочешь вернуться — просто напиши /subscribe.",
        { reply_markup: JSON.stringify({ inline_keyboard: [[{ text: "🔔 Подписаться снова", callback_data: "cmd:subscribe" }]] }) }
      );
    }
    return res.status(200).json({ ok: true });
  }

  // /time — изменить время уведомлений
  if (text.startsWith("/time")) {
    if (botToken) {
      await handleTimeSelection(botToken, chatId);
    }
    return res.status(200).json({ ok: true });
  }

  // /help — помощь
  if (text.startsWith("/help")) {
    if (botToken) {
      await sendMessage(botToken, chatId,
        `ℹ️ <b>Город ТРИЗ — бот задач дня</b>\n\n` +
        `/subscribe — подписаться на задачи\n` +
        `/unsubscribe — отписаться\n` +
        `/time — изменить время уведомлений\n` +
        `/support — написать в поддержку\n\n` +
        `🎮 <a href="${APP_URL}">Открыть приложение</a>`
      );
    }
    return res.status(200).json({ ok: true });
  }

  // /support — написать в поддержку
  if (text.startsWith("/support")) {
    if (botToken) {
      await sendMessage(botToken, chatId,
        `📩 Напишите нам в поддержку: ${SUPPORT_CHAT}\n\nМы отвечаем в рабочее время.`
      );
    }
    return res.status(200).json({ ok: true });
  }

  return res.status(200).json({ ok: true });
}
