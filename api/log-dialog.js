/**
 * POST /api/log-dialog
 * Отправляет диалог решённой задачи в технический Telegram чат.
 * Вызывается клиентом fire-and-forget при завершении задачи.
 *
 * Env vars:
 *   TELEGRAM_BOT_TOKEN  — токен бота
 *   TELEGRAM_LOG_CHAT   — ID технического чата
 */
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_LOG_CHAT;
  if (!botToken || !chatId) return res.status(200).json({ ok: true, skipped: true });

  const { taskTitle, taskId, stars, solution, messages } = req.body || {};

  const header = `🎮 <b>${taskTitle || taskId || '?'}</b>\n⭐ ${stars || 0}/3 | 💡 ${solution || '—'}\n\n`;
  const body = (messages || [])
    .filter(m => m.text)
    .map(m => `<b>${m.role === 'child' ? '👤' : '🤖'}:</b> ${m.text}`)
    .join('\n\n');

  const full = header + body;
  try {
    for (let i = 0; i < full.length; i += 3800) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: full.slice(i, i + 3800), parse_mode: "HTML" }),
      });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(200).json({ ok: true }); // fire-and-forget — не падаем
  }
}
