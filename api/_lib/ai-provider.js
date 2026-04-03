import { PERSONAS, getPersona } from "./personas.js";

// Stage letter → numeric index
const STAGE_MAP = { "П": 0, "Р": 1, "И": 2, "З": 3, "✨": 4 };

function parseTag(rawText) {
    // Match format: [ПРИЗ:X|⭐:N]
    const newMatch = rawText.match(/\[ПРИЗ:([ПРИЗз✨]+)\|⭐:(\d)\]/);
    if (newMatch) {
        const letter = newMatch[1];
        const stars = parseInt(newMatch[2], 10);
        const prizStep = STAGE_MAP[letter] ?? 0;
        const cleanText = rawText
            .replace(/\*{0,2}\[ПРИЗ:[ПРИЗз✨]+\|⭐:\d\]\*{0,2}\s*/g, '')
            .replace(/^\s*\*[^*\n]+\*\s*$/gm, '')
            .replace(/^[🐉🦎🔥]\s*/gmu, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
        
        // Safety: if AI says "Задача решена" but uses wrong tag
        if (cleanText.toLowerCase().includes("задача решена") && prizStep < 3) {
            return { cleanText, prizStep: 4, stars: Math.max(stars, 2) };
        }
        return { cleanText, prizStep, stars };
    }
    return { cleanText: rawText.replace(/\[.*\]/g, "").trim(), prizStep: 0, stars: 0 };
}

/**
 * Direct call to Google Gemini API.
 */
export async function getClaudeResponse({
  userMessage,
  history = [],
  task = null,
  personaId = null,
  prizStep = 0,
  systemPromptOverride = null
}) {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) throw new Error("GEMINI_API_KEY is not configured on the server");

  // Determine persona and system prompt
  let systemPrompt = systemPromptOverride;
  if (!systemPrompt) {
    const persona = personaId ? PERSONAS[personaId] : getPersona(task?.difficulty || 1);
    
    let taskContext = "";
    if (task) {
      const resourcesLine = Array.isArray(task.resources)
        ? `РЕСУРСЫ: ${task.resources.map(r => typeof r === 'string' ? r : `${r.id} (${r.properties})`).join(", ")}`
        : `РЕСУРСЫ: ${task.resources || "не ограничены"}`;
        
      taskContext = `Задача: ${task.title || "Новая задача"}\nУсловие: ${task.condition || "Разгадай загадку"}\n${resourcesLine}`;
    }

    const STAGE_LABELS = {
      0: "П — Подготовка 🔥: зацепи за живое, спроси про суть.",
      1: "Р — Разведка 🔍: ищем ресурсы и что мешает.",
      2: "И — Идеи 💡: ШТОРМИМ! Если идея одна — проси еще. Ищи ЛУЧШУЮ.",
      3: "З — Зачет 🏆: принимаем сильное решение.",
      4: "✨ — Инсайт: празднуем победу."
    };

    let stageHint = `\nТЕКУЩАЯ СТАДИЯ ПРИЗ: ${STAGE_LABELS[prizStep] || STAGE_LABELS[0]}`;
    if (prizStep === 2) {
      stageHint += `\n⚡ ПРАВИЛО ГИНА: Не принимай первую попавшуюся идею сразу! Проси еще варианты.`;
    }

    const historyText = history.length > 0 
      ? history.slice(-6).map(m => `${m.role === "assistant" || m.from === "bot" ? "Уголек" : "Ребенок"}: ${m.text}`).join("\n")
      : "(начало диалога)";

    systemPrompt = `${persona.prompt}\n\n${taskContext}\n${stageHint}\n\nИСТОРИЯ (последние сообщения):\n${historyText}`;
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\nСЕЙЧАС Ребенок пишет: ${userMessage}\n\nОТВЕТЬ В СТИЛЕ УГОЛЬКА И ОБЯЗАТЕЛЬНО ПОСТАВЬ ТЕГ [ПРИЗ:X|⭐:N] В КОНЦЕ.` }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API Error: ${err}`);
    }

    const data = await response.json();
    if (!data.candidates || !data.candidates[0].content) {
        throw new Error("No candidates returned from Gemini");
    }
    const rawText = data.candidates[0].content.parts[0].text;
    const { cleanText, stars, prizStep: newStep } = parseTag(rawText);

    return {
      text: cleanText,
      stars,
      prizStep: newStep || prizStep,
      model: "gemini-1.5-flash-latest"
    };
  } catch (e) {
    console.error("[Gemini Provider] Error:", e);
    throw e;
  }
}
