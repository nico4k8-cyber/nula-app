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
- Без эмодзи в начале предложения (можно 1 в конце если уместно)

Верни ТОЛЬКО валидный JSON без markdown, без пояснений:
{"hook": "твой текст здесь"}

ВАЖНО: отвечай ТОЛЬКО на русском языке.`;

// Rough token estimator (1 token ≈ 4 chars, good enough for routing)
function estimateTokens(text) {
    return Math.ceil(text.length / 4);
}

// Extract hook text from model response (expects JSON {"hook":"..."}, falls back to raw text)
function parseHookResponse(raw) {
    // Strip markdown code fences if present (```json ... ```)
    let text = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    // Try regex extraction first (more robust than JSON.parse for partial responses)
    const match = text.match(/"hook"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (match) return match[1].replace(/\\n/g, ' ').replace(/\\"/g, '"').trim();
    // Try full JSON parse
    try {
        const parsed = JSON.parse(text);
        if (parsed.hook) return String(parsed.hook).trim();
    } catch { /* fall through */ }
    // Fallback: return raw text as-is (model didn't follow JSON format)
    return text.replace(/^\{.*?"hook"\s*:\s*"?/, '').replace(/"?\s*\}$/, '').trim();
}

async function hookViaGemini(modelName, prompt) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { maxOutputTokens: 200, temperature: 1.0 }
    });
    const result = await model.generateContent(prompt);
    return parseHookResponse(result.response.text());
}

async function hookViaClaude(prompt) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

    // Try newest haiku first, fall back to stable v3 if overloaded (529)
    const models = ["claude-haiku-4-5-20251001", "claude-3-haiku-20240307"];
    let lastErr;
    for (const model of models) {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            body: JSON.stringify({
                model,
                max_tokens: 200,
                messages: [{ role: "user", content: prompt }],
            }),
        });
        if (response.ok) {
            const data = await response.json();
            return parseHookResponse(data.content[0].text);
        }
        const err = await response.text();
        lastErr = `Claude API error ${response.status} (${model}): ${err}`;
        // Only retry on overload/rate-limit, not auth errors
        if (response.status !== 529 && response.status !== 429) break;
        console.warn(lastErr, "→ retrying with fallback model");
    }
    throw new Error(lastErr);
}

// Skippable Gemini errors: quota, rate-limit, model not found
function isSkippable(err) {
    const msg = err.message || "";
    return msg.includes("429") || msg.includes("quota") ||
        msg.includes("RESOURCE_EXHAUSTED") || msg.includes("404") ||
        msg.includes("not found");
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

    // Token-based routing:
    //   < 200 tokens  → gemini-3.1-flash-lite (cheapest)
    //   200–1000      → claude-3-haiku (reliable mid-tier)
    //   > 1000        → gemini-2.5-flash (long context)
    // Hook prompt is always short (<200), so flash-lite is always primary here.
    // Fallback chain: flash-lite → claude-haiku → flash → gemini-3-flash → pro
    const est = estimateTokens(prompt);
    console.log(`Hook prompt ~${est} tokens`);

    const GEMINI_FALLBACKS = est < 200
        ? ["gemini-3.1-flash-lite-preview", "gemini-2.5-flash", "gemini-3-flash-preview", "gemini-2.5-pro"]
        : est < 1000
            ? ["gemini-2.5-flash", "gemini-3-flash-preview", "gemini-2.5-pro"]
            : ["gemini-2.5-flash", "gemini-3-flash-preview", "gemini-2.5-pro"];

    // If primary tier is Claude (200-1000 tokens range), try Claude first
    const useClaudeFirst = est >= 200 && est < 1000;

    if (useClaudeFirst) {
        try {
            const hook = await hookViaClaude(prompt);
            return res.status(200).json({ hook });
        } catch (claudeErr) {
            console.warn("Hook Claude (primary) failed:", claudeErr.message, "→ trying Gemini");
        }
    }

    // Try Gemini models in order
    let lastErr;
    for (const modelName of GEMINI_FALLBACKS) {
        try {
            const hook = await hookViaGemini(modelName, prompt);
            return res.status(200).json({ hook });
        } catch (err) {
            lastErr = err;
            if (!isSkippable(err)) {
                // Auth or unexpected error — propagate immediately
                console.error(`Hook Gemini ${modelName} fatal error:`, err.message);
                break;
            }
            console.warn(`Hook Gemini ${modelName} unavailable → trying next`);
        }
    }

    // Claude as final fallback (if we didn't try it first)
    if (!useClaudeFirst) {
        try {
            const hook = await hookViaClaude(prompt);
            return res.status(200).json({ hook });
        } catch (claudeErr) {
            console.error("Hook Claude fallback failed:", claudeErr.message);
        }
    }

    return res.status(503).json({ error: "All AI providers unavailable" });
}
