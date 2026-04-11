import { getClaudeResponse } from "./_lib/ai-provider.js";
import { getPersona } from "./_lib/personas.js";
import { sanitizeUserMessage } from "./_lib/input-sanitizer.js";
import { createClient } from "@supabase/supabase-js";

export const config = {
  runtime: 'edge',
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store, max-age=0, must-revalidate",
};

// Логируем токены в Supabase (await — edge runtime убивает fire-and-forget)
async function logUsage({ action, model, usage, userId }) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return;
  // Claude 3 Haiku via Polza: 23.09 ₽/1M input + 115.46 ₽/1M output
  const costRub = ((usage?.promptTokens || 0) / 1_000_000) * 23.09
                + ((usage?.completionTokens || 0) / 1_000_000) * 115.46;
  const costUsd = costRub / 90;
  const supabase = createClient(url, key);
  const { error } = await supabase.from('token_usage').insert({
    user_id: userId || null,
    action,
    model: model || 'anthropic/claude-3-haiku',
    prompt_tokens: usage?.promptTokens || 0,
    completion_tokens: usage?.completionTokens || 0,
    total_tokens: usage?.totalTokens || 0,
    cost_usd: costUsd,
  });
  if (error) console.error('[token_usage log]', error);
}

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { action, userId } = body;

    // ── Царь-гора: ответить да/нет ───────────────────────────────────────────
    if (action === "twenty_q_answer") {
      const { secretWord, question } = body;
      if (!secretWord || !question) throw new Error("secretWord and question required");

      const result = await getClaudeResponse({
        userMessage: `Загаданное слово: "${secretWord}". Вопрос: "${question}". Отвечай строго одним словом: "Да" или "Нет".`,
        history: [],
        systemPromptOverride: `Ты ведущий игры "20 вопросов". Тебе известно загаданное слово. На вопрос отвечай ТОЛЬКО "Да" или "Нет" без объяснений.`,
      });

      await logUsage({ action: 'twenty_q_answer', model: result.model, usage: result.usage, userId });

      const raw = (result.text || '').trim();
      const answer = raw.startsWith('Да') ? 'Да' : raw.startsWith('Нет') ? 'Нет' : (Math.random() > 0.5 ? 'Да' : 'Нет');
      return new Response(JSON.stringify({ answer }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Бредогенератор: оценить изобретение ──────────────────────────────────
    if (action === "evaluate_invention") {
      const { item, itemHint, invention } = body;
      if (!item || !invention) throw new Error("item and invention required");

      const result = await getClaudeResponse({
        userMessage: `Ребёнок придумал изобретение на основе предмета "${item}" (${itemHint || ''}): "${invention}". Оцени оригинальность от 5 до 30 (только число). Затем напиши краткую реакцию (1–2 предложения, с восхищением, для ребёнка 10–14 лет).`,
        history: [],
        systemPromptOverride: `Ты — весёлый изобретатель Орин, помощник детей. Оценивай детские идеи тепло и подбадривающе. Формат ответа: первая строка — число (оценка 5–30), вторая строка — реакция.`,
      });

      await logUsage({ action: 'evaluate_invention', model: result.model, usage: result.usage, userId });

      const lines = (result.text || '').trim().split('\n').filter(Boolean);
      const scoreMatch = lines[0]?.match(/\d+/);
      const score = scoreMatch ? Math.min(30, Math.max(5, parseInt(scoreMatch[0]))) : 15;
      const reaction = lines.slice(1).join(' ').trim() || "Отличная идея! Орин записывает в копилочку 📜";

      return new Response(JSON.stringify({ score, reaction }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Персонализированный дебриф ────────────────────────────────────────────
    if (action === "generate_debrief") {
      const { task, history = [], stars, childSolution, lang = 'ru' } = body;
      if (!task) throw new Error("task required");

      const taskTitle = task.title || 'задача';
      const taskCondition = task.condition || task.teaser || '';
      const ikr = task.ikr || '';
      const childMessages = history.filter(m => m.role === 'user').map(m => m.text).join('\n');
      const lastIdea = childSolution || history.filter(m => m.role === 'user').at(-1)?.text || '';

      const retryHintInstruction = stars < 3
        ? (lang === 'en'
          ? `3. "retryHint" — 1 short sentence inviting them to find a better solution. Mention specifically what resource/method the child used AND what drawback it has (can it be repeated? does it have side effects? does it need extra resources?). Format: "Want to find a solution where you don't need [what they used]?" Be specific, warm, not pushy.`
          : `3. "retryHint" — 1 короткое предложение-приглашение найти решение лучше. Упомяни конкретно что именно использовал ребёнок И какой у этого недостаток по Гину (можно ли повторить? есть ли побочный эффект? нужны ли дополнительные ресурсы?). Формат: "Хочешь найти такое решение, где не нужно [то что использовал]?" Конкретно, тепло, без давления.`)
        : '';

      const prompt = lang === 'en'
        ? `A child (10-14 years old) just solved a TRIZ puzzle. Write a SHORT personalized feedback (2-3 sentences max) about what they actually did.

Task: "${taskTitle}"
${taskCondition ? `Problem: "${taskCondition}"` : ''}
Ideal final result (don't reveal): "${ikr}"
Child's key idea: "${lastIdea}"
Child's messages: ${childMessages}
Stars: ${stars}/3

Write:
1. "feedback" — 1-2 sentences: mention what specifically the child came up with (use their words/ideas), praise the inventive thinking. Be specific, not generic.
2. "insight" — 1 sentence: what TRIZ principle was at work here (explain simply, without the term itself).
${retryHintInstruction}

Respond ONLY with JSON: {"feedback": "...", "insight": "..."${stars < 3 ? ', "retryHint": "..."' : ''}}`
        : `Ребёнок (10-14 лет) только что решил задачу. Напиши КОРОТКИЙ персонализированный отзыв (2-3 предложения) о том, что он конкретно сделал.

Задача: "${taskTitle}"
${taskCondition ? `Условие: "${taskCondition}"` : ''}
ИКР (не раскрывай): "${ikr}"
Ключевая идея ребёнка: "${lastIdea}"
Что писал ребёнок: ${childMessages}
Звёзды: ${stars}/3

Напиши:
1. "feedback" — 1-2 предложения: упомяни что конкретно придумал ребёнок (используй его слова/идеи), похвали изобретательское мышление. Конкретно, не шаблонно.
2. "insight" — 1 предложение: какой приём мышления сработал (объясни просто, без ТРИЗ-терминов).
${retryHintInstruction}

Отвечай ТОЛЬКО JSON: {"feedback": "...", "insight": "..."${stars < 3 ? ', "retryHint": "..."' : ''}}`;

      const result = await getClaudeResponse({
        userMessage: prompt,
        history: [],
        systemPromptOverride: lang === 'en'
          ? "You are Orin, a friendly dragon who coaches children in creative thinking. Write warmly, specifically, in 2-3 short sentences. Never use generic phrases like 'great job' without specifics."
          : "Ты Орин — дружелюбный дракон, который помогает детям думать изобретательно. Пиши тепло, конкретно, 2-3 коротких предложения. Никаких шаблонных фраз типа 'молодец' без конкретики.",
      });

      await logUsage({ action: 'generate_debrief', model: result.model, usage: result.usage, userId });

      let parsed = { feedback: null, insight: null, retryHint: null };
      try {
        const jsonMatch = (result.text || '').match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.warn('[debrief] JSON parse failed:', result.text, e?.message);
      }

      return new Response(JSON.stringify(parsed), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Основной диалог ТРИЗ ──────────────────────────────────────────────────
    const { userMessage, history = [], task, prizStep = 0 } = body;
    if (!userMessage || !task) {
      return new Response(JSON.stringify({ error: "userMessage and task are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // First-line defence: block injection before any processing
    const { safe, sanitized: sanitizedMsg, threat } = sanitizeUserMessage(userMessage);
    if (!safe && threat !== 'message_too_long') {
      console.warn('[security] ai-master blocked:', threat, '| userId:', userId);
      return new Response(JSON.stringify({
        reply: "Давай решим задачу! Что ты думаешь?",
        text:  "Давай решим задачу! Что ты думаешь?",
        stars: 1,
        prizStep,
        _v: Date.now(),
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    // Use truncated message if too long (instead of blocking)
    const effectiveMessage = safe ? userMessage : sanitizedMsg;

    // ── Hint request: separate prompt, no stage advancement ──────────────────
    const isHintRequest = userMessage.startsWith('[ПОДСКАЗКА]');
    if (isHintRequest) {
      const taskDesc = task.condition || task.teaser || task.title || '';
      const taskIkr = task.ikr || task.trick || '';

      // Build readable conversation summary for AI to analyze
      const childMessages = history.filter(m => m.role === 'user' || m.role === 'child' || m.type === 'child');
      const conversationSummary = history.map(m => {
        const isChild = m.role === 'user' || m.role === 'child' || m.type === 'child';
        return `${isChild ? 'Ребёнок' : 'Орин'}: ${m.text}`;
      }).join('\n');

      const hintPrompt = `Ты — добрый помощник Орин. Ребёнок решает задачу и просит подсказку.

ЗАДАЧА: ${task.title}
УСЛОВИЕ: ${taskDesc}
ПРАВИЛЬНЫЙ ОТВЕТ (не говори его): ${taskIkr}

ВЕСЬ ДИАЛОГ ДО ЭТОГО МОМЕНТА:
${conversationSummary || '(только начали)'}

Ребёнок застрял и просит подсказку. Действуй по шагам:

ШАГ 1. Оцени направление, в котором идёт ребёнок:
- Он движется в ПРАВИЛЬНОМ направлении (его идея или рассуждение ведёт к решению, но он не может сделать следующий шаг)?
- Или он зашёл в ТУПИК (направление явно не ведёт к решению задачи)?

ШАГ 2а. Если направление ПРАВИЛЬНОЕ — задай один конкретный вопрос, который помогает пройти ДАЛЬШЕ в том же направлении. Сделай следующий шаг более очевидным, спросив про конкретную деталь или свойство объекта, который ребёнок уже упоминал.

ШАГ 2б. Если направление ТУПИКОВОЕ — посмотри, какие типы явлений ребёнок ещё не рассматривал:
механические (форма, движение, сила) | тепловые | световые/зрительные | звуковые | химические | социальные (поведение людей)
Выбери тип, который ведёт к решению, и задай вопрос про конкретный объект из условия через этот тип.

ПРАВИЛА:
- НЕ давай ответ напрямую и НЕ называй ИКР.
- НЕ повторяй вопросы из диалога выше.
- Обращайся к ребёнку напрямую на «ты». Никогда не пиши "предложи ребёнку", "пусть ребёнок" и т.п.
- НЕ включай анализ (Шаг 1, оценку направления).
- Ответ — ровно 2 предложения:
  1) Конкретное наблюдение-подсказка: назови один объект или свойство из условия задачи, на которое ребёнок ещё не обратил внимание. Это должна быть реальная новая информация, а не повтор условия.
  2) Один конкретный вопрос, который помогает думать в нужном направлении.
- Подсказка должна реально помогать — давать ребёнку новый угол зрения, который он сам не рассмотрел.`;

      const result = await getClaudeResponse({
        userMessage: 'Подсказка',
        history,
        task,
        prizStep,
        systemPromptOverride: hintPrompt,
      });
      await logUsage({ action: 'hint', model: result.model, usage: result.usage, userId });
      return new Response(JSON.stringify({
        reply: result.text,
        text: result.text,
        stars: 0,
        prizStep, // never advance stage on hint
        _v: Date.now(),
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const result = await getClaudeResponse({
      userMessage: effectiveMessage, history, task, prizStep, _forceHaiku: true,
    });

    await logUsage({ action: 'chat', model: result.model, usage: result.usage, userId });

    const persona = getPersona(task.difficulty);
    return new Response(JSON.stringify({
      text: result.text,
      reply: result.text,
      stars: result.stars || 0,
      prizStep: result.prizStep || prizStep,
      personaId: persona.id,
      model: result.model,
      _v: Date.now(),
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("[AI Master Error]:", err);
    const isLimitError = err.message?.includes('🛑');
    const customReply = isLimitError
      ? err.message.replace('Polza API Error: Error: ', '')
      : "Сетевая заминка. Обдумай свою мысль и отправь ещё раз через минуту!";
    return new Response(JSON.stringify({
      error: "AI service error",
      reply: customReply,
      details: err.message,
      _v: Date.now(),
    }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
}
