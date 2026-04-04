const RE_ENGAGEMENT_PROMPT = `Ты — Орин, маленький дракон-помощник. Ребёнок только что решил часть задачи, но нашёл не все решения и перешёл на экран результатов.
Твоя задача — написать короткий, вдохновляющий и завлекающий "крючок" (hook), чтобы ребёнок захотел вернуться и найти ещё более крутое решение.

Задача: {taskTitle}
Условие: {taskCondition}
Найдено решений: {foundCount} из {totalCount}

Вводные данные (подсказка для крючка): {loopHook}

Напиши РОВНО 2 коротких предложения:
1. Похвали за найденное решение, но намекни, что есть кое-что помощнее/хитрее.
2. Брось вызов или предложи открыть еще один "секретный" способ.

### ПРАВИЛА (КРИТИЧЕСКИ ВАЖНО):
- **НИКАКИХ ГАЛЛЮЦИНАЦИЙ**: Не придумывай сомнительные факты из жизни (например, "альпинисты используют лестницы на льду" — это странно).
- **ТОЧНОСТЬ**: Если хочешь привести пример, он должен быть абсолютно реальным и понятным ребенку. Если сомневаешься — не приводи пример, просто сфокусируйся на задаче.
- Никаких «молодец», «отлично». Используй «Ого», «Ничего себе», «Хитро!».
- Будь живым, как друг.
- Обращайся на «ты», но без использования глаголов прошедшего времени с родовым окончанием (-ил/-ала).
- Ключевые слова выделяй жирным: **вот так**.
- Только русский язык.

Верни ТОЛЬКО валидный JSON без markdown:
{"hook": "твой текст здесь"}`;

const CLAUDE_MODELS = ["claude-haiku-4-5-20251001", "claude-3-haiku-20240307"];

async function callClaude(apiKey, modelName, prompt) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        body: JSON.stringify({
            model: modelName,
            max_tokens: 200,
            messages: [{ role: "user", content: prompt }],
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        const error = new Error(`Claude ${modelName} error ${response.status}: ${err}`);
        error.status = response.status;
        throw error;
    }

    const data = await response.json();
    return {
        text: data.content[0].text.trim(),
        model: modelName,
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
    };
}

function parseHookResponse(raw) {
    let text = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const match = text.match(/"hook"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (match) return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
    try {
        const parsed = JSON.parse(text);
        if (parsed.hook) return String(parsed.hook).trim();
    } catch { /* fall through */ }
    return text;
}

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { task, foundCount, totalCount } = req.body;
    if (!task) return res.status(400).json({ error: "task and progress required" });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });

    const prompt = RE_ENGAGEMENT_PROMPT
        .replace("{taskTitle}", task.title)
        .replace("{taskCondition}", task.condition)
        .replace("{foundCount}", foundCount)
        .replace("{totalCount}", totalCount)
        .replace("{loopHook}", task.loop_hook || "");

    let lastErr;
    for (const modelName of CLAUDE_MODELS) {
        try {
            const result = await callClaude(apiKey, modelName, prompt);
            const hook = parseHookResponse(result.text);
            console.log(`Re-engagement ${result.model} (in:${result.inputTokens} out:${result.outputTokens})`);
            return res.status(200).json({ hook, model: result.model });
        } catch (err) {
            console.warn(`Re-engagement: ${modelName} failed — ${err.message}`);
            lastErr = err;
            if (err.status !== 529 && err.status !== 429) break;
        }
    }

    // Fallback: static hook if all models fail
    console.error(`Re-engagement: all models failed. Last error: ${lastErr?.message}`);
    return res.status(200).json({ hook: "Классное решение! Но я знаю способ ещё круче. Попробуем найти?", fallback: true });
}
