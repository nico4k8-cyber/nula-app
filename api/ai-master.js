import { getClaudeResponse } from "./_lib/ai-provider.js";
import { getPersona } from "./_lib/personas.js";
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

// Логируем токены в Supabase (fire-and-forget, не блокирует ответ)
function logUsage({ action, model, usage, userId }) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return;
  // Log even if tokens=0 so we can see failed/empty responses
  // Claude 3 Haiku via Polza: 23.09 ₽/1M input + 115.46 ₽/1M output
  const costRub = ((usage.promptTokens || 0) / 1_000_000) * 23.09
                + ((usage.completionTokens || 0) / 1_000_000) * 115.46;
  const costUsd = costRub / 90; // approximate RUB→USD
  const supabase = createClient(url, key);
  supabase.from('token_usage').insert({
    user_id: userId || null,
    action,
    model: model || 'anthropic/claude-3-haiku',
    prompt_tokens: usage.promptTokens || 0,
    completion_tokens: usage.completionTokens || 0,
    total_tokens: usage.totalTokens || 0,
    cost_usd: costUsd,
  }).then(({ error }) => { if (error) console.error('[token_usage log]', error); });
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

      logUsage({ action: 'twenty_q_answer', model: result.model, usage: result.usage, userId });

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
        userMessage: `Ребёнок придумал изобретение на основе предмета "${item}" (${itemHint || ''}): "${invention}". Оцени оригинальность от 5 до 30 (только число). Затем напиши краткую реакцию (1–2 предложения, с восхищением, для ребёнка 7–12 лет).`,
        history: [],
        systemPromptOverride: `Ты — весёлый изобретатель Орин, помощник детей. Оценивай детские идеи тепло и подбадривающе. Формат ответа: первая строка — число (оценка 5–30), вторая строка — реакция.`,
      });

      logUsage({ action: 'evaluate_invention', model: result.model, usage: result.usage, userId });

      const lines = (result.text || '').trim().split('\n').filter(Boolean);
      const scoreMatch = lines[0]?.match(/\d+/);
      const score = scoreMatch ? Math.min(30, Math.max(5, parseInt(scoreMatch[0]))) : 15;
      const reaction = lines.slice(1).join(' ').trim() || "Отличная идея! Орин записывает в копилочку 📜";

      return new Response(JSON.stringify({ score, reaction }), {
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

    const result = await getClaudeResponse({
      userMessage, history, task, prizStep, _forceHaiku: true,
    });

    logUsage({ action: 'chat', model: result.model, usage: result.usage, userId });

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
      ? err.message.replace('Gemini API Error: Error: ', '')
      : "Сетевая заминка. Обдумай свою мысль и отправь ещё раз через минуту!";
    return new Response(JSON.stringify({
      error: "AI service error",
      reply: customReply,
      details: err.message,
      _v: Date.now(),
    }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
}
