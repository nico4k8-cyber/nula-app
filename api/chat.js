import { getPersona } from "./_lib/personas.js";
import { getClaudeResponse } from "./_lib/ai-provider.js";

// Stage letter → numeric index for HUD sync
const STAGE_MAP = { "П": 0, "Р": 1, "И": 2, "З": 3, "✨": 4 };

/**
 * ─── History compression ───
 * Keeps first msg (hook) + last 6 msgs, summarizes middle.
 * Essential for long TRIZ brainstorming sessions.
 */
function compressHistory(history = []) {
  if (history.length <= 8) return history.map(m => `${m.role === "user" || m.from === "user" ? "Ребенок" : "Уголек"}: ${m.text}`).join("\n");

  const hook = history[0];
  const tail = history.slice(-6);
  const middle = history.slice(1, -6);
  const middleChildMsgs = middle.filter(m => m.role === "user" || m.from === "user");
  const middleTopics = middleChildMsgs.map(m => (m.text || "").substring(0, 60) + "...");
  
  const summary = middleTopics.length > 0 
    ? `[...ранее ребенок предлагал: ${middleTopics.join("; ")}...]` 
    : "[...идет обсуждение ресурсов и противоречий...]";

  return [
    `${hook.role === "user" || hook.from === "user" ? "Ребенок" : "Уголек"}: ${hook.text}`,
    summary,
    ...tail.map(m => `${m.role === "user" || m.from === "user" ? "Ребенок" : "Уголек"}: ${m.text}`)
  ].join("\n");
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { 
    userMessage, 
    history = [], 
    task, 
    prizStep = 0, 
    mode, 
    item 
  } = req.body;

  try {
    // 1. Handle Design Bureau Mode (Special case)
    if (mode === "design-bureau") {
      if (!userMessage || !item) return res.status(400).json({ error: "userMessage and item required" });
      const systemPrompt = `Ты — Главный Инженер. Оценивай идею ребенка про ${item}. Дай [ОДОБРЕНО] или [ДОРАБОТАТЬ].`;
      const result = await getClaudeResponse({ userMessage, history: [], systemPromptOverride: systemPrompt });
      const approved = result.text.includes("[ОДОБРЕНО]");
      return res.status(200).json({ text: result.text.replace(/\[.*\]/g, "").trim(), approved });
    }

    // 2. Default TRIZ Mode (Ugolok Dragon)
    if (!userMessage || !task) return res.status(400).json({ error: "userMessage and task are required" });

    // Build the compressed history for the prompt
    const historyText = compressHistory(history);
    
    // Call the heavy-duty provider
    const result = await getClaudeResponse({
      userMessage,
      history: [], // History is already inside context
      task,
      prizStep,
      systemPromptOverride: null // Use persona-based prompt in provider
    });

    const persona = getPersona(task.difficulty);

    // Final response for the game engine
    return res.status(200).json({
      text: result.text,
      reply: result.text,
      stars: result.stars || 0,
      prizStep: result.prizStep || prizStep,
      personaId: persona.id,
      model: result.model,
      tokens: { in: result.inputTokens, out: result.outputTokens }
    });

  } catch (err) {
    console.error("[Chat API Error]:", err);
    return res.status(503).json({ 
      error: "AI service error", 
      reply: "Уголёк задумался слишком глубоко. Давай попробуем ещё раз через минуту!",
      details: err.message 
    });
  }
}

