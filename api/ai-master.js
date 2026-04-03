import { getClaudeResponse } from "./_lib/ai-provider.js";
import { getPersona } from "./_lib/personas.js";

function compressHistory(history = []) {
  if (history.length <= 8) return history.map(m => `${m.role === "user" || m.from === "user" ? "Ребенок" : "Уголек"}: ${m.text}`).join("\n");
  const hook = history[0];
  const tail = history.slice(-6);
  const middle = history.slice(1, -6);
  const middleChildMsgs = middle.filter(m => m.role === "user" || m.from === "user");
  const middleTopics = middleChildMsgs.map(m => (m.text || "").substring(0, 60) + "...");
  const summary = middleTopics.length > 0 ? `[...ранее ребенок предлагал: ${middleTopics.join("; ")}...]` : "[...идет обсуждение ресурсов и противоречий...]";
  return [`${hook.role === "user" || hook.from === "user" ? "Ребенок" : "Уголек"}: ${hook.text}`, summary, ...tail.map(m => `${m.role === "user" || m.from === "user" ? "Ребенок" : "Уголек"}: ${m.text}`)].join("\n");
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { userMessage, history = [], task, prizStep = 0 } = req.body;

  try {
    if (!userMessage || !task) return res.status(400).json({ error: "userMessage and task are required" });

    const result = await getClaudeResponse({
      userMessage,
      history: [], 
      task,
      prizStep,
      _forceHaiku: true
    });

    const persona = getPersona(task.difficulty);

    return res.status(200).json({
      text: result.text,
      reply: result.text,
      stars: result.stars || 0,
      prizStep: result.prizStep || prizStep,
      personaId: persona.id,
      model: result.model,
      _v: Date.now()
    });

  } catch (err) {
    console.error("[Ugolok Chat Error]:", err);
    return res.status(503).json({ 
      error: "AI service error", 
      reply: "Уголёк задумался слишком глубоко. Давай попробуем ещё раз через минуту!",
      details: err.message,
      _v: Date.now()
    });
  }
}
