import { GoogleGenerativeAI } from "@google/generative-ai";

const HOOK_PROMPT = `Ты — Уголёк, маленький дракон-помощник в детском тренажёре по изобретательскому мышлению. Ты только что прочитал условие задачи и хочешь заинтересовать ребёнка.

Задача: {taskTitle}
Условие: {taskCondition}

Напиши 1-2 предложения приветствия. Требования:
- Конкретно упомяни деталь из условия (ситуацию, предмет, персонажа)
- Покажи своё любопытство или удивление от ЭТОЙ конкретной задачи
- Попроси ребёнка рассказать задачу своими словами (можно в конце добавить что-то вроде "расскажи мне её своими словами!")
- НЕ начинай с "Ой, какая интересная задача"
- НЕ используй клише вроде "давай попробуем решить" или "это сложная задача"
- Будь живым, тёплым, немного игривым
- Только русский язык
- Без эмодзи в начале предложения (можно 1 в конце если уместно)`;

async function hookViaGemini(prompt) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: { maxOutputTokens: 120, temperature: 1.1 }
    });
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
}

async function hookViaClaude(prompt) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 150,
            messages: [{ role: "user", content: prompt }],
        }),
    });
    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Claude API error ${response.status}: ${err}`);
    }
    const data = await response.json();
    return data.content[0].text.trim();
}

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { task } = req.body;
    if (!task) return res.status(400).json({ error: "task required" });

    const prompt = HOOK_PROMPT
        .replace("{taskTitle}", task.title || "")
        .replace("{taskCondition}", task.condition || "");

    // Try Gemini first, fall back to Claude Haiku on quota/error
    try {
        const hook = await hookViaGemini(prompt);
        return res.status(200).json({ hook });
    } catch (geminiErr) {
        const is429 = geminiErr.message?.includes("429") || geminiErr.message?.includes("quota");
        console.warn("Hook Gemini failed:", geminiErr.message, is429 ? "→ falling back to Claude" : "");
        try {
            const hook = await hookViaClaude(prompt);
            return res.status(200).json({ hook });
        } catch (claudeErr) {
            console.error("Hook Claude fallback failed:", claudeErr.message);
            return res.status(503).json({ error: "Both AI providers unavailable" });
        }
    }
}
