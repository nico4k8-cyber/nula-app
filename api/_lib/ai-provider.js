import { PERSONAS, getPersona } from "./personas.js";

// Stage letter → numeric index
const STAGE_MAP = { "П": 0, "Р": 1, "И": 2, "З": 3, "✨": 4 };

function parseTag(rawText) {
    // 1. Remove everything before the last actual response text (Gemma often outputs Drafts)
    let cleanText = rawText;
    
    // Split by common thinking markers and take the last block
    const blocks = rawText.split(/\*?\*?(?:Draft|Final|Response|Draft \d):?\*?\*?/i);
    if (blocks.length > 1) {
        cleanText = blocks[blocks.length - 1].trim();
    }

    // 2. Extract Tag
    const tagMatch = cleanText.match(/\[ПРИЗ:([ПРИЗз✨]+)\|⭐:(\d)\]/);
    let prizStep = 0;
    let stars = 0;

    if (tagMatch) {
       prizStep = STAGE_MAP[tagMatch[1]] ?? 0;
       stars = parseInt(tagMatch[2], 10);
    }

    // 3. Cleanup garbage (bullets, persona markers, etc.)
    cleanText = cleanText
        .replace(/\[ПРИЗ:[ПРИЗз✨]+\|⭐:\d\]/g, '') // remove tag
        .replace(/^\s*\*[^*\n]+\*\s*$/gm, '')       // remove bullet lines
        .replace(/\n{2,}/g, '\n\n')                // normalize double lines
        .replace(/^["'\s]+|["'\s]+$/g, '')         // strip wrapper quotes
        .trim();

    // Final safety check: if cleanText is too short and rawText has better content
    if (cleanText.length < 5 && rawText.includes('"')) {
        const quoteMatch = rawText.match(/"([^"]{10,})"/);
        if (quoteMatch) cleanText = quoteMatch[1];
    }

    if (cleanText.toLowerCase().includes("задача решена")) {
       return { cleanText, prizStep: 4, stars: 2 };
    }
    
    return { cleanText, prizStep, stars };
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
      ? history.slice(-6).map(m => `${m.role === "assistant" || m.from === "bot" ? "Орион" : "Ребенок"}: ${m.text}`).join("\n")
      : "(начало диалога)";

    // ИНСТРУКЦИЯ ПО КРАТКОСТИ:
    systemPrompt = `${persona.prompt}\n\n${taskContext}\n${stageHint}\n\nКРАТКОСТЬ: Отвечай очень сжато (макс 2-3 предложения). Сразу к сути, без воды. Твоя цель — ПОМОЧЬ РЕШИТЬ, а не болтать.\n\nИСТОРИЯ:\n${historyText}`;
  }

  try {
    const polzaKey = process.env.POLZA_API_KEY;
    if (!polzaKey) throw new Error("POLZA_API_KEY is not configured on the server");

    const response = await fetch("https://api.polza.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${polzaKey}`
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4-5",
        messages: [
          { role: "system", content: `${systemPrompt}\nВАЖНО: ВЫВЕДИ ТОЛЬКО ИТОГОВУЮ РЕПЛИКУ НАСТАВНИКА! В КОНЦЕ ОБЯЗАТЕЛЬНО ПОСТАВЬ ТЕГ [ПРИЗ:X|⭐:N].` },
          { role: "user", content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Polza API Error: ${errText}`);
    }

    const data = await response.json();
    const rawText = data.choices[0].message.content;
    const { cleanText, stars, prizStep: newStep } = parseTag(rawText);

    return {
      text: cleanText,
      stars,
      prizStep: newStep || prizStep,
      model: "anthropic/claude-haiku-4-5",
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  } catch (e) {
    console.error("[Polza Provider] Error:", e);
    throw e;
  }
}
