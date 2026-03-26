import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

/**
 * /api/analyze.js — AI evaluation endpoint for new 7-phase engine
 *
 * Types:
 * 1. evaluate_good_bad — Did child answer "what's good/bad?" relevantly?
 * 2. generate_hint — Generate a leading question for stuck child
 * 3. evaluate_resource — Is child's resource usage useful?
 * 4. evaluate_improvement — How good is child's improved idea?
 */

async function evaluateGoodBad({ text, taskId, isGood = true, resources }) {
  const prompt = `Ты оцениваешь ответ ребёнка в игре.

Задача: "${taskId}"
Ресурсы в задаче: ${resources ? resources.map(r => r.id).join(", ") : "не ограничены"}

${isGood ? "Вопрос был: Что ХОРОШЕГО в этой идее?" : "Вопрос был: Что ПЛОХОГО может случиться?"}
Ответ ребёнка: "${text}"

Оцени ОЧЕНЬ КРАТКО (2-3 фразы) в JSON:
{
  "relevant": true/false,
  "point": "суть того, что сказал ребёнок",
  "follow_up": "если не релевантно — вопрос для перефокуса, иначе пустая строка"
}`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  try {
    return JSON.parse(response.content[0].text);
  } catch {
    return {
      relevant: false,
      point: text.substring(0, 50),
      follow_up: "Помоги мне лучше понять: что ты имеешь в виду?",
    };
  }
}

async function generateHint({ taskId, currentPhase, pastAttempts, resources }) {
  const phaseNames = {
    0: "предложить идею",
    1: "анализировать хорошее/плохое",
    2: "сформулировать противоречие",
    3: "посмотреть на ресурсы",
    4: "проверить ресурс",
    5: "сформулировать ИКР",
    6: "улучшить идею",
  };

  const prompt = `Ребёнок застрял. Помоги ему подсказкой.

Задача: "${taskId}"
Фаза: ${phaseNames[currentPhase] || "начало"}
Попыток без ответа: ${pastAttempts}
Ресурсы: ${resources ? resources.map(r => r.id).join(", ") : "свободно"}

Придумай ОДИН открытый вопрос (не подсказка-список, а ВОПРОС про конкретный объект или момент).
Вопрос должен быть 1-2 предложения.

Ответь ТОЛЬКО самим вопросом, без объяснений.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 150,
    messages: [{ role: "user", content: prompt }],
  });

  return response.content[0].text.trim();
}

async function evaluateResourceUsage({ text, resourceId, taskContext }) {
  const prompt = `Ты эксперт по творческому решению задач.

Задача: "${taskContext?.title || "неизвестная"}"
Ресурс, который предложил ребёнок использовать: "${resourceId}"
Идея ребёнка: "${text}"

Оцени в JSON:
{
  "useful": true/false,
  "consequence": "возможная проблема или противоречие с этой идеей",
  "push_question": "если не очень хорошо — вопрос для размышления, иначе пустая"
}`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  try {
    return JSON.parse(response.content[0].text);
  } catch {
    return {
      useful: true,
      consequence: "",
      push_question: "",
    };
  }
}

async function evaluateImprovement({ originalIdea, improvedIdea, taskContext }) {
  const prompt = `Ты оцениваешь творческое улучшение идеи.

Задача: "${taskContext?.title || "неизвестная"}"
Исходная идея: "${originalIdea}"
Улучшенная идея: "${improvedIdea}"

Оцени качество в JSON:
{
  "quality": 1-5,
  "reasoning": "почему эта оценка",
  "celebration": "похвала за что-то конкретное в улучшении"
}`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  try {
    return JSON.parse(response.content[0].text);
  } catch {
    return {
      quality: 3,
      reasoning: "рабочая идея",
      celebration: "Мне нравится как ты думаешь!",
    };
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { type, text, taskId, taskContext, isGood, resources, resourceId, currentPhase, pastAttempts, originalIdea, improvedIdea } = req.body;

  if (!type) return res.status(400).json({ error: "type is required" });

  try {
    let result;

    switch (type) {
      case "evaluate_good_bad":
        if (!text) return res.status(400).json({ error: "text required for evaluate_good_bad" });
        result = await evaluateGoodBad({ text, taskId, isGood, resources });
        break;

      case "generate_hint":
        result = {
          hint: await generateHint({ taskId, currentPhase, pastAttempts, resources }),
        };
        break;

      case "evaluate_resource":
        if (!text || !resourceId) return res.status(400).json({ error: "text and resourceId required" });
        result = await evaluateResourceUsage({ text, resourceId, taskContext });
        break;

      case "evaluate_improvement":
        if (!originalIdea || !improvedIdea) return res.status(400).json({ error: "originalIdea and improvedIdea required" });
        result = await evaluateImprovement({ originalIdea, improvedIdea, taskContext });
        break;

      default:
        return res.status(400).json({ error: `Unknown type: ${type}` });
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error("Analyze error:", err);
    return res.status(500).json({ error: "Analysis failed", details: err.message });
  }
}
