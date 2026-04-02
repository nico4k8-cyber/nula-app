import { PERSONAS, getPersona } from "./personas.js";

const MODELS = ["claude-3-5-haiku-20241022", "claude-3-haiku-20240307"];

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
 * Direct call to Anthropic API.
 * Used by both /api/chat and /api/engine to avoid self-fetch loops.
 */
export async function getClaudeResponse({
  userMessage,
  history = [],
  task = null,
  personaId = null,
  prizStep = 0,
  systemPromptOverride = null
}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured on the server");

  // Determine persona and system prompt
  let systemPrompt = systemPromptOverride;
  if (!systemPrompt) {
    // 1. Resolve Persona
    const persona = personaId ? PERSONAS[personaId] : getPersona(task?.difficulty || 1);
    
    // 2. Build Context
    let taskContext = "";
    if (task) {
      const resourcesLine = Array.isArray(task.resources)
        ? `РЕСУРСЫ: ${task.resources.map(r => typeof r === 'string' ? r : `${r.id} (${r.properties})`).join(", ")}`
        : `РЕСУРСЫ: ${task.resources || "не ограничены"}`;
        
      taskContext = `
        Задача: ${task.title || "Новая задача"}
        Условие: ${task.condition || "Разгадай загадку"}
        ${resourcesLine}
      `;
    }

    // 3. Stage-Specific Hints (TRIZ Pedagogy by Gihn)
    const STAGE_LABELS = {
      0: "П — Подготовка 🔥: зацепи за живое, спроси про суть.",
      1: "Р — Разведка 🔍: ищем ресурсы и что мешает.",
      2: "И — Идеи 💡: ШТОРМИМ! Если идея одна — проси еще. Ищи ЛУЧШУЮ.",
      3: "З — Зачет 🏆: принимаем сильное решение.",
      4: "✨ — Инсайт: празднуем победу."
    };

    let stageHint = `\nТЕКУЩАЯ СТАДИЯ ПРИЗ: ${STAGE_LABELS[prizStep] || STAGE_LABELS[0]}`;
    if (prizStep === 2) {
      stageHint += `\n⚡ ПРАВИЛО ГИНА: Не принимай первую попавшуюся идею сразу. Если ребенок предложил что-то простое, спроси: "А как сделать это еще изящнее, используя только ресурсы из задачи?". Нам нужно собрать варианты и выбрать чемпиона!`;
    } else if (prizStep === 3) {
      stageHint += `\n⚡ ФИНАЛ: Ребенок выбрал лучшее решение. Поддержи его, похвали за ВЫБОР и аргументацию.`;
    }

    const historyText = history.length > 0 
      ? history.map(m => `${m.role === "user" || m.from === "user" ? "Ребенок" : "Уголек"}: ${m.text}`).join("\n")
      : "(начало диалога)";

    systemPrompt = (persona.prompt || "")
      .replace("{taskContext}", taskContext + stageHint)
      .replace("{history}", historyText);
  }

  // Attempt call with fallback
  let lastErr;
  for (const model of MODELS) {
    try {
      console.log(`[AI Provider] Calling ${model}...`);
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          messages: [
            { role: "user", content: `${systemPrompt}\n\nТекущее сообщение от ребенка: ${userMessage}` }
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data.content[0].text.trim();
        const { cleanText, stars, prizStep } = parseTag(rawText);
        return {
          text: cleanText,
          stars,
          prizStep,
          inputTokens: data.usage?.input_tokens || 0,
          outputTokens: data.usage?.output_tokens || 0,
          model
        };
      }

      const errText = await response.text();
      lastErr = `Claude API ${response.status}: ${errText}`;
      console.error(`[AI Provider] ${model} failed:`, lastErr);
      if (response.status !== 529 && response.status !== 429) break;
    } catch (e) {
      lastErr = e.message;
      console.error(`[AI Provider] ${model} exception:`, e);
    }
  }

  throw new Error(lastErr || "Failed to get response from AI");
}
