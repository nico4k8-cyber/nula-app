import { isSafe } from "./safety.js";
import TASKS_DATA from "./tasks.js";
import { generateUgolokResponse } from "./ai.js";

export const TASKS = TASKS_DATA.default || TASKS_DATA;

export const normalize = (s) => {
  let n = s.toLowerCase().replace(/ё/g, "е").trim().replace(/\s+/g, " ");
  return n.slice(0, 500);
};

export const PICK = (a) => a[Math.floor(Math.random() * a.length)];

/**
 * Основная функция обработки сообщений через ИИ-агента.
 * Чистый мост между ребенком и LLM.
 */
export async function processUserMessage(txt, task, state, history = [], onError = null) {
  // 1. Проверка безопасности
  if (!isSafe(txt)) {
    return {
      reply: "🐉 Ой! Это звучит как-то не очень по-доброму. Давай лучше искать решение, которое всем поможет!",
      newState: state,
      resultType: "harmful"
    };
  }

  // 2. Генерация ответа через реальный ИИ
  const { text: aiReply, tokensUsed, prizStep: aiPrizStep, stars: aiStars } = await generateUgolokResponse(txt, history, task, onError);

  // 3. Обновляем состояние: prizStep и stars приходят от ИИ
  const newPrizStep = (aiPrizStep !== null && aiPrizStep !== undefined) ? aiPrizStep : state.prizStep;
  return {
    reply: aiReply,
    tokensUsed,
    stars: aiStars || 0,
    newState: { ...state, prizStep: newPrizStep },
    resultType: "ai_thought"
  };
}
