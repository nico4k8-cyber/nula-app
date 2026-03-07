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

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { task } = req.body;
    if (!task) return res.status(400).json({ error: "task required" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not set" });

    const prompt = HOOK_PROMPT
        .replace("{taskTitle}", task.title || "")
        .replace("{taskCondition}", task.condition || "");

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { maxOutputTokens: 120, temperature: 1.1 }
        });
        const result = await model.generateContent(prompt);
        const hook = result.response.text().trim();
        return res.status(200).json({ hook });
    } catch (err) {
        console.error("Hook generation failed:", err.message);
        return res.status(500).json({ error: err.message });
    }
}
