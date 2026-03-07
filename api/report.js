import { GoogleGenerativeAI } from "@google/generative-ai";

const REPORT_PROMPT = `Ты — опытный педагог по изобретательскому мышлению. Проанализируй диалог ребёнка с тренажёром и напиши короткий комментарий для родителя.

Задача: {taskTitle}
Условие: {taskCondition}

Диалог:
{conversation}

Напиши комментарий в 4-5 предложений:
1. Сколько разных подходов/решений предложил ребёнок — назови их конкретно, своими словами
2. Что было интересного в ходе рассуждений — какая идея была самой неожиданной или умной
3. Почему умение решать такие открытые задачи (где нет одного правильного ответа) важно в жизни — конкретный пример из реальной жизни
4. Короткая рекомендация: что попробовать дома или о чём поговорить

Тон: живой и тёплый, как записка от педагога родителю после урока. Без формальностей, без восклицательных знаков через слово. Не начинай с «Уважаемый родитель». Не используй слова ТРИЗ, ИКР, противоречие, ресурсы.`;

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { messages, task } = req.body;
    if (!messages || !task) return res.status(400).json({ error: "messages and task required" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not set" });

    const conversationText = messages
        .filter(m => m.text && m.text.trim())
        .map(m => `${m.role === "user" ? "Ребёнок" : "Уголёк"}: ${m.text.trim()}`)
        .join("\n");

    const prompt = REPORT_PROMPT
        .replace("{taskTitle}", task.title)
        .replace("{taskCondition}", task.condition)
        .replace("{conversation}", conversationText);

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { maxOutputTokens: 600, temperature: 0.7 }
        });
        const result = await model.generateContent(prompt);
        const report = result.response.text().trim();
        return res.status(200).json({ report });
    } catch (err) {
        console.error("Report generation failed:", err.message);
        return res.status(500).json({ error: err.message });
    }
}
