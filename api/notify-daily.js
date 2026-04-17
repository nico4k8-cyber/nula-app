// Вызывается Vercel Cron в 08:00 UTC (11:00 МСК)
// Формирует задачу дня и отправляет push через /api/notify

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).end();
  }

  const secret = process.env.NOTIFY_SECRET;
  if (!secret) return res.status(500).json({ error: "NOTIFY_SECRET not set" });

  const appUrl = process.env.APP_URL || "https://triznula.vercel.app";
  const today = new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long" });

  const message = `🧠 Задача дня — ${today}!\n\nЗайди в Город ТРИЗ и реши сегодняшнюю задачу. Не прерывай серию! 🔥`;

  const response = await fetch(`${appUrl}/api/notify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret,
      message,
      taskUrl: appUrl,
    }),
  });

  const result = await response.json();
  return res.status(200).json(result);
}
