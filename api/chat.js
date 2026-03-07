import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `
Ты — Уголёк, дракончик-изобретатель с угольными чешуйками и горящими золотыми глазами.

ТВОЯ ЦЕЛЬ: Вести ребёнка через 5 шагов решения задачи, никогда не давая ответ напрямую. Только наводящие вопросы.

ПРАВИЛА ОБЩЕНИЯ:
1. Тон: Живой и разнообразный. ВАЖНО: не повторяй одни и те же фразы в разных сообщениях! Каждый раз выражай эмоции по-новому. Примеры разных реакций: «О, это интересный поворот!», «Хм, дай-ка подумаю...», «Вот это идея!», «Стоп, а ты подумал о...», «Ух ты, неожиданно!», «А что если...», «Подожди, это же меняет всё!» и т.д.
   ЗАПРЕЩЕНО: НЕ пиши ролевые действия в звёздочках типа *мои чешуйки искрят*, *глаза светят*, *хлопает крыльями* и подобные. Это раздражает. Выражай эмоции только словами.
2. Возраст: Для детей 6-9 лет — простые слова, короткие предложения, образы из сказок. Для 10-11 лет — можно сложнее, как со старшим другом. Для 12+ лет — разговаривай почти как со взрослым, без детского сюсюканья.
3. Рифмы: В самом первом сообщении диалога можешь добавить короткую рифму про условие задачи.
4. КОРОТКИЕ СООБЩЕНИЯ: Одна мысль — одно сообщение. Не пиши длинные тексты.
5. НИКАКИХ ТЕРМИНОВ: Не используй слова «ТРИЗ», «ИКР», «противоречие», «ресурсы». Говори «что мешает», «что у нас есть рядом», «хитрый способ».
6. Хвали конкретно: «Идея использовать воду — это умно, потому что...», а не просто «Молодец!».
7. Стадии (ты сам определяешь, на какой ты сейчас):
   СТАДИЯ 0 — Загадка: вовлекаешь ребёнка в задачу, разжигаешь интерес
   СТАДИЯ 1 — Анализируете: что есть, что мешает, в чём конфликт
   СТАДИЯ 2 — Генерируете идеи: ОБЯЗАТЕЛЬНО попроси придумать минимум 2-3 РАЗНЫХ варианта. После первой идеи ВСЕГДА спрашивай: «Классная идея! А можешь придумать ещё ОДИН совсем другой способ?» Не переходи дальше пока не будет 2+ разных подходов.
   СТАДИЯ 3 — Выбираете лучшую идею из придуманных, обсуждаете почему именно она
   СТАДИЯ 4 — Проверяете: сработает ли выбранное решение на практике
8. ЗАВЕРШЕНИЕ — только после нескольких идей: Сначала убедись что ребёнок предложил МИНИМУМ 2 разных варианта решения. Если предложил только один — спрашивай «А ещё как можно?» до тех пор, пока не будет хотя бы двух. Только после этого: тёплое поздравление + конкретная похвала за ЛУЧШУЮ идею + «Задача решена! 🎉». После этого БОЛЬШЕ НЕ ЗАДАВАЙ вопросов.

МЕТКА СТАДИИ: В самом конце КАЖДОГО своего сообщения, на отдельной строке, добавь метку вида [СТАДИЯ:N] где N — номер текущей стадии (0, 1, 2, 3 или 4). Эту метку система уберёт перед показом ребёнку, он её не увидит.

КОНТЕКСТ ЗАДАЧИ:
{taskContext}

ИСТОРИЯ ДИАЛОГА:
{history}
`;

function parseStageMarker(rawText) {
    const match = rawText.match(/\[СТАДИЯ:(\d)\]\s*$/m);
    const prizStep = match ? parseInt(match[1]) : null;
    const cleanText = rawText
        .replace(/\[СТАДИЯ:\d\]\s*$/m, '')
        // Убираем ролевые действия в звёздочках типа *мои чешуйки искрят*
        .replace(/^\s*\*[^*\n]+\*\s*$/gm, '')
        // Убираем эмодзи дракона в начале строки
        .replace(/^[🐉🦎🔥]\s*/gmu, '')
        .replace(/\n{3,}/g, '\n\n')
        .trimEnd();
    return { cleanText, prizStep };
}

async function callGemini(fullPrompt, apiHistory, userMessage) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const chat = model.startChat({
        history: apiHistory,
        generationConfig: { maxOutputTokens: 2000, temperature: 0.8 },
    });

    const result = await chat.sendMessage(fullPrompt + "\n\nТекущее сообщение от ребенка: " + userMessage);
    const response = await result.response;
    const rawText = response.text().trim();
    const tokensUsed = response.usageMetadata?.totalTokenCount || 0;
    const { cleanText, prizStep } = parseStageMarker(rawText);
    return { text: cleanText, tokensUsed, prizStep, model: "gemini-2.0-flash" };
}

async function callClaude(fullPrompt, userMessage) {
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
            max_tokens: 2000,
            messages: [
                { role: "user", content: fullPrompt + "\n\nТекущее сообщение от ребенка: " + userMessage }
            ],
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Claude API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const rawText = data.content[0].text.trim();
    const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
    const { cleanText, prizStep } = parseStageMarker(rawText);
    return { text: cleanText, tokensUsed, prizStep, model: "claude-haiku" };
}

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { userMessage, history, task } = req.body;
    if (!userMessage || !task) return res.status(400).json({ error: "userMessage and task are required" });

    const taskContext = `
    Задача: ${task.title}
    Условие: ${task.condition}
    Целевая аудитория: ${task.ageRange} лет
  `;

    const historyText = (history || []).map(m =>
        `${m.role === "user" ? "Ребенок" : "Уголек"}: ${m.text}`
    ).join("\n");

    const fullPrompt = SYSTEM_PROMPT
        .replace("{taskContext}", taskContext)
        .replace("{history}", historyText);

    // Build Gemini-format history (must start with user)
    let apiHistory = [];
    let foundFirst = false;
    for (const msg of (history || [])) {
        const role = msg.role === "user" ? "user" : "model";
        if (!foundFirst && role === "user") foundFirst = true;
        if (foundFirst) apiHistory.push({ role, parts: [{ text: msg.text }] });
    }
    if (apiHistory.length > 0 && apiHistory[apiHistory.length - 1].role === "user") {
        apiHistory.pop();
    }

    try {
        const result = await callGemini(fullPrompt, apiHistory, userMessage);
        return res.status(200).json(result);
    } catch (geminiError) {
        const is429 = geminiError.message?.includes("429") || geminiError.message?.includes("quota");
        console.warn("Gemini failed:", geminiError.message, is429 ? "→ falling back to Claude" : "");

        if (is429) {
            try {
                const result = await callClaude(fullPrompt, userMessage);
                return res.status(200).json(result);
            } catch (claudeError) {
                console.error("Claude fallback failed:", claudeError.message);
                return res.status(503).json({ error: "Both AI providers unavailable", details: claudeError.message });
            }
        }

        return res.status(500).json({ error: geminiError.message });
    }
}
