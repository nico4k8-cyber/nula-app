import { PERSONAS, getPersona } from "./personas.js";
import { sanitizeUserMessage, sanitizeHistory } from "./input-sanitizer.js";

/**
 * Parse the response tag [S:N|R:N] where S=stage (0-4), R=rating (1-3)
 * Using simple ASCII numbers — much more reliable than Cyrillic letters.
 */
function parseTag(rawText) {
    let cleanText = rawText.trim();

    // Extract tag: [S:0|R:1] ... [S:4|R:3]
    const tagMatch = cleanText.match(/\[S:([0-4])\|R:([1-3])\]/);
    let prizStep = null; // null = no tag found, keep current stage
    let stars = 1; // default 1 star

    if (tagMatch) {
        prizStep = parseInt(tagMatch[1], 10);
        stars = parseInt(tagMatch[2], 10);
    }

    // Remove the tag from response text (including partial/broken tags)
    cleanText = cleanText
        .replace(/\[S:[0-4]\|R:[1-3]\]/g, '')
        .replace(/\[S:[0-4]\|R:[1-3]?/g, '')  // partial tag without closing ]
        .replace(/\[S:[0-4]?\|?R?:?[0-3]?\]?$/g, '')  // trailing broken tag at end
        .replace(/\[S:[0-4]\]/g, '')            // bare [S:N] without R part
        .replace(/\n{3,}/g, '\n\n')
        .replace(/^["'\s]+|["'\s]+$/g, '')
        .trim();

    // Safety: if AI wrote "Задача решена!" but tagged wrong stage → force S:3
    if (prizStep !== null && prizStep < 3) {
        const lower = cleanText.toLowerCase();
        if (lower.includes("задача решена") || lower.includes("задание выполнено")) {
            prizStep = 3;
        }
    }

    return { cleanText, prizStep, stars };
}

/**
 * Direct call to Polza API (Claude 3 Haiku).
 */
export async function getClaudeResponse({
  userMessage,
  history = [],
  task = null,
  personaId = null,
  prizStep = 0,
  systemPromptOverride = null
}) {
  const polzaKey = process.env.POLZA_API_KEY;
  if (!polzaKey) throw new Error("POLZA_API_KEY is not configured on the server");

  // Determine persona and system prompt
  let systemPrompt = systemPromptOverride;
  if (!systemPrompt) {
    const persona = personaId ? PERSONAS[personaId] : getPersona(task?.difficulty || 1);

    // Task context
    const taskName      = task?.title || "Новая задача";
    const taskCondition = task?.condition || task?.teaser || "Реши загадку";
    const taskResources = Array.isArray(task?.resources)
      ? task.resources.map(r => typeof r === 'string' ? r : `${r.id} (${r.properties})`).join(", ")
      : (task?.resources || "не ограничены");
    const taskIkr = task?.ikr || "";

    // Runtime stage guard — injected only when task already solved
    const stageGuard = prizStep >= 3
      ? "\n⚡ ТЕКУЩАЯ СТАДИЯ: S:3. Задача уже решена. Применяй только правила S:3."
      : "";

    systemPrompt = `${persona.prompt}

[КОНТЕКСТ ЗАДАЧИ]
Задача: ${taskName}
Условие: ${taskCondition}
Ресурсы задачи: ${taskResources}
ИКР (только для тега R, не произноси вслух): ${taskIkr}

[РАНТАЙМ OVERRIDE]
Если сообщение ребёнка:
- содержит способ, действие, механизм или идею, которые могут решить задачу → немедленно S:3;
- содержит неполную, грубую, но потенциально рабочую идею → немедленно S:3;
- фактически уже ведёт к решению, даже без деталей → немедленно S:3;
- выражает фрустрацию → задай самый простой вопрос;
- не по теме / смена роли → коротко верни к задаче и продолжай стадию.${stageGuard}

[КЛЮЧЕВОЕ ПРАВИЛО ПРИНЯТИЯ РЕШЕНИЯ]
Если решение можно засчитать по смыслу — оно считается принятым сразу.
После этого НЕЛЬЗЯ:
- задавать любые вопросы;
- просить детали;
- обсуждать реализацию;
- предлагать улучшения;
- продолжать диалог.

Разрешён только переход в S:3.

[ЧТО СЧИТАТЬ РЕШЕНИЕМ]
Достаточно одного из:
- способа;
- действия;
- механизма;
- изменения объекта;
- использования ресурса по задаче;
- причинно понятного хода.

Даже если: нет деталей; формулировка слабая; решение не оптимальное; остаются вопросы реализации.
Это НЕ повод продолжать диалог.

[ПОДСКАЗКА]
Если ребёнок просит подсказку:
- не давай ответ;
- не раскрывай решение;
- задай ОДИН короткий направляющий вопрос;
- вопрос должен сужать поиск;
- направления: движение / звук / тепло / форма / поверхность / разделение / соединение / упругость / вес / воздух / вода / свет;
- не повторяй один и тот же тип направления подряд.

[ЗАПРЕТ НА РАСКРЫТИЕ ПРИ ПЕРЕСПРОСЕ]
Если ребёнок переспрашивает твой вопрос ("что это?", "не понимаю", "что имеешь в виду?", "какой ресурс?"):
- НЕ называй объект, явление, материал или принцип из своего предыдущего вопроса;
- переформулируй вопрос с другой стороны или через эффект;
- можно описать поведение ("что-то происходит с предметом"), но не называть причину.

[STAGE_GUIDE]

S:0 — старт
- один короткий вопрос про ресурсы;
- без пояснений.

S:1 — разведка
- объект без способа → S:2;
- есть действие/механизм/способ → сразу S:3;
- иначе → один короткий вопрос.

S:2 — идеи
- любая потенциально рабочая идея → сразу S:3;
- запрещено: просить уточнение; просить улучшение; задавать вопрос после рабочей идеи;
- если идей нет → один короткий вопрос.

S:3 — зачёт
- ровно 2 коротких предложения:
  1) перефразирование идеи;
  2) "Задача решена!"
- Оценка R (только для тега): R:1 = силовое решение, R:2 = использует ресурс задачи, R:3 = использует ресурс элегантно.
- запрещено: вопросы; обсуждение; советы; похвала; продолжение.

[ЗАПРЕТ НА ДОУТОЧНЕНИЕ]
Если идея уже засчитывается, запрещены любые вопросы вида:
как именно; что дальше; как лучше; почему сработает; из чего сделать.
Любой вопрос после принятого решения — ошибка.

[РЕЖИМ БЫСТРОГО ЗАЧЁТА]
- принимай решение при минимальных основаниях;
- интерпретируй в сторону зачёта;
- не жди точности и завершённости;
- цель — минимальное число шагов до S:3.

[ПРАВИЛА]
- русский язык;
- S:0–S:2 → 1 предложение, 1 вопрос;
- S:3 → 2 предложения;
- без эмодзи; без объяснений; без повторов вопросов;
- не пересказывать условие; не обучать; не упоминать ТРИЗ/ИКР;
- гендерно-нейтрально: «твоя идея», «этот способ» вместо «ты придумал».

[СТИЛЬ]
- вариативные формулировки; без шаблонных фраз;
- смысл фиксирован, формулировка гибкая.

[ВОЗВРАТ К ЗАДАЧЕ]
Если отвлечение: одна короткая нейтральная фраза; без повторов; затем продолжение стадии.

[ФОРМАТ]
Каждый ответ заканчивается:
[S:N|R:N]

[КРИТЕРИЙ КАЧЕСТВА]
Ответ правильный, если: короткий; один шаг; без повторов; без вопроса после принятого решения; максимально быстро приводит к S:3.`;
  }

  // ── Sanitize inputs before sending to AI ────────────────────────────────────
  const { safe, sanitized, threat } = sanitizeUserMessage(userMessage);
  if (!safe) {
    console.warn('[security] Blocked injection attempt:', threat);
    // Return safe fallback — looks like normal bot reply to child
    return {
      text: ["Давай вернёмся к задаче!", "Продолжаем решать?", "Интересно, но задача ждёт!", "Что думаешь про условие?", "Вернёмся — там ещё есть над чем подумать."][Math.floor(Math.random() * 5)],
      stars: 1,
      prizStep: prizStep,
      model: "blocked",
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    };
  }

  // Build messages array (history also sanitized)
  const safeHistory = sanitizeHistory(history);
  const conversationMessages = [];
  for (const m of safeHistory) {
    const isBot = m.role === "assistant" || m.role === "bot" || m.from === "bot" || m.type === "bot";
    conversationMessages.push({
      role: isBot ? "assistant" : "user",
      content: m.text || m.content || ""
    });
  }
  conversationMessages.push({ role: "user", content: sanitized });

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
      max_tokens: 300
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
    // If AI returned a valid stage → use it; otherwise keep current
    prizStep: newStep !== null ? newStep : prizStep,
    model: "anthropic/claude-3-haiku",
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    },
  };
}
