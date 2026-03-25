/**
 * Browser-side AI bridge for "SHARIEL".
 * In dev: calls /api/ai-chat (Vite middleware proxy → Anthropic)
 * In prod: calls /api/ai-chat (Vercel serverless → Anthropic)
 */

export async function askAI(userMessage, history, puzzle, ageGroup = "senior") {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch("/api/ai-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userMessage, history, puzzle, ageGroup }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    const isTimeout = err.name === "AbortError";
    console.error("AI error:", err.message);
    return {
      text: isTimeout
        ? "Дракон задумался слишком долго... Давай ещё раз?"
        : "Что-то пошло не так. Попробуй написать ещё раз.",
      prizStep: 0,
      stars: 0,
      error: true,
    };
  }
}
