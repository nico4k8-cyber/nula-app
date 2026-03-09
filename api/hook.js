const HOOK_PROMPT = `Ты — Уголёк, маленький дракон-помощник в детском тренажёре изобретательского мышления.
Прочитай задачу и напиши короткое первое сообщение ребёнку.

Задача: {taskTitle}
Условие: {taskCondition}

Напиши РОВНО 3 абзаца, разделяя их пустой строкой (\\n\\n):
1) Первый абзац всегда СТРОГО такое предложение: «Вот наш маршрут: разберём условие → найдём где загвоздка → придумаем идеи → выберем лучшую.»
2) Второй абзац — опиши ситуацию из задачи ярко и живо. Ключевые существительные выдели жирным: **вот так**.
3) Третий абзац — один короткий вопрос-приглашение начать думать. НЕ зондируй тему, НЕ спрашивай про свойства объектов.

ДЛЯ ВОПРОСА используй только такие формы (или похожие):
- «Есть идеи с чего начать?»
- «С чего начнёшь?»
- «Что первым делом приходит в голову?»
- «Похоже на загадку, правда?»

СТРОГО НЕЛЬЗЯ в вопросе:
- Спрашивать про свойства, поведение или отличия объектов из задачи
- Сравнивать («а чем отличаются...», «что происходит с X, а с Y — нет»)
- Называть любые процессы или явления, связанные с задачей
- Намекать на механизм или направление решения

ПЛОХО (нельзя так):
«Что происходит с живыми цветами со временем, а с тканевыми — нет?»
— прямая подсказка на механизм решения

«Что ты знаешь об обезьянах — как они себя ведут, чего боятся?»
— зондирует тему, уже подталкивает к нужным свойствам

ХОРОШО (вот так):
«**Обезьяны** каждый день приходят на **плантацию** и забирают **апельсины**. Есть идеи с чего начать?»
«**Царица** принесла царю **Соломону** две вазы с **цветами** — живые и тканевые выглядят одинаково. С чего начнёшь?»

ЗАПРЕЩЕНО везде: "расскажи своими словами", "давай попробуем", "это интересная задача", любые клише.
ЗАПРЕЩЕНО: глаголы прошедшего времени с родовым окончанием (-ил/-ала/-ел/-ела) при обращении к ребёнку.
Будь живым, тёплым, немного игривым. Только русский язык.
Без эмодзи в начале предложений (можно 1 в конце если очень уместно).

Верни ТОЛЬКО валидный JSON без markdown, без пояснений:
{"hook": "твой текст здесь"}

ВАЖНО: отвечай ТОЛЬКО на русском языке.`;

// Extract hook text from model response (expects JSON {"hook":"..."}, falls back to raw text)
function parseHookResponse(raw) {
    // Strip markdown code fences if present (```json ... ```)
    let text = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    // Try regex extraction first (more robust than JSON.parse for partial responses)
    const match = text.match(/"hook"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (match) return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();
    // Try full JSON parse
    try {
        const parsed = JSON.parse(text);
        if (parsed.hook) return String(parsed.hook).trim();
    } catch { /* fall through */ }
    // Fallback: return raw text as-is (model didn't follow JSON format)
    return text.replace(/^\{.*?"hook"\s*:\s*"?/, '').replace(/"?\s*\}$/, '').trim();
}

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
            max_tokens: 300,
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

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { task, ageRange } = req.body;
    if (!task) return res.status(400).json({ error: "task required" });

    let routePhrase = "Вот наш маршрут: разберём условие → найдём где загвоздка → придумаем идеи → выберем лучшую.";
    if (ageRange === "6-9") {
        routePhrase = "Вот наш маршрут: разберём загадку → найдём секретик → придумаем идеи → выберем лучшую.";
    } else if (ageRange === "12+") {
        routePhrase = "Вот наш маршрут: разберём ситуацию → поймём, что нам мешает → придумаем хитрости → выберем лучшую.";
    }

    const prompt = HOOK_PROMPT
        .replace("{taskTitle}", task.title || "")
        .replace("{taskCondition}", task.condition || "")
        .replace("Первое предложение всегда СТРОГО такое: «Вот наш маршрут: разберём условие → найдём где загвоздка → придумаем идеи → выберем лучшую.»", `Первое предложение всегда СТРОГО такое: «${routePhrase}»`);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });

    let lastErr;
    for (const modelName of CLAUDE_MODELS) {
        try {
            const result = await callClaude(apiKey, modelName, prompt);
            const hook = parseHookResponse(result.text);
            console.log(`Hook ${result.model} (in:${result.inputTokens} out:${result.outputTokens})`);
            return res.status(200).json({ hook, model: result.model, inputTokens: result.inputTokens, outputTokens: result.outputTokens });
        } catch (err) {
            console.warn(`Hook: ${modelName} failed — ${err.message}`);
            lastErr = err;
            if (err.status !== 529 && err.status !== 429) break;
        }
    }

    console.error(`Hook: all models failed. Last error: ${lastErr?.message}`);
    return res.status(503).json({ error: "All AI providers unavailable" });
}
