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
      0: "П — Подготовка: пойми задачу, задай 1 вопрос про суть проблемы.",
      1: "Р — Разведка: что мешает? какие есть ресурсы рядом?",
      2: "И — Идеи: ребёнок уже предложил идею — развей её, попроси уточнить или предложить ещё одну.",
      3: "З — Зачет: решение найдено! Похвали конкретно, скажи что именно хорошо в идее. Напиши 'задача решена'."
    };

    let stageHint = `\nТЕКУЩАЯ СТАДИЯ: ${STAGE_LABELS[prizStep] || STAGE_LABELS[0]}`;
    if (prizStep === 3) {
      stageHint += `\n⚡ ВАЖНО: Ребёнок уже дал хорошее решение. Похвали его КОНКРЕТНО и заверши диалог фразой "задача решена".`;
    }

    systemPrompt = `${persona.prompt}\n\n${taskContext}\n${stageHint}\n\nПРАВИЛА: Отвечай ОЧЕНЬ коротко (1-2 предложения максимум). Задавай только ОДИН вопрос за раз. Не повторяй вопросы. Не объясняй теорию — только веди диалог. Если ребёнок уже назвал рабочее решение — хвали и завершай.`;
  }

  // Build messages array with real history for proper context
  const conversationMessages = [];
  if (history.length > 0) {
    const recent = history.slice(-8); // last 8 messages max
    for (const m of recent) {
      const isBot = m.role === "assistant" || m.role === "bot" || m.from === "bot" || m.type === "bot";
      conversationMessages.push({
        role: isBot ? "assistant" : "user",
        content: m.text || m.content || ""
      });
    }
  }
  // Add current message
  conversationMessages.push({ role: "user", content: userMessage });

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
        model: "anthropic/claude-3-haiku",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationMessages
        ],
        temperature: 0.7,
        max_tokens: 400
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
      model: "anthropic/claude-3-haiku",
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
