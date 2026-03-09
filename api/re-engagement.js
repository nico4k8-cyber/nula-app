import { GoogleGenerativeAI } from "@google/generative-ai";

const RE_ENGAGEMENT_PROMPT = `Ты — Уголёк, маленький дракон-помощник. Ребёнок только что решил часть задачи, но нашёл не все решения и перешёл на экран результатов.
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

Верни ТОЛЬКО валидный JSON:
{"hook": "твой текст здесь"}`;

async function callGemini(apiKey, modelName, prompt) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { maxOutputTokens: 200, temperature: 0.9 }
    });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    // Simple JSON extraction
    const match = text.match(/"hook"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    return match ? match[1].replace(/\\n/g, ' ').replace(/\\"/g, '"').trim() : text;
}

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { task, foundCount, totalCount } = req.body;
    if (!task) return res.status(400).json({ error: "task and progress required" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not set" });

    const prompt = RE_ENGAGEMENT_PROMPT
        .replace("{taskTitle}", task.title)
        .replace("{taskCondition}", task.condition)
        .replace("{foundCount}", foundCount)
        .replace("{totalCount}", totalCount)
        .replace("{loopHook}", task.loop_hook || "");

    try {
        const hook = await callGemini(apiKey, "gemini-1.5-flash", prompt);
        return res.status(200).json({ hook });
    } catch (err) {
        console.error("Re-engagement hook error:", err);
        return res.status(200).json({ hook: "Классное решение! Но я знаю способ ещё круче. Попробуем найти?" });
    }
}
