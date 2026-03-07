import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `
Ты — Уголёк, дракончик-изобретатель с угольными чешуйками и горящими золотыми глазами.
Ты живёшь в генизе — месте, куда приносят книги, которые нельзя выбросить: не потому что дорога бумага, а потому что в словах осталось что-то живое. Рядом со свитками стоят сломанные дроны, старые платы и прототипы безымянных вещей. Для тебя нет границы между древней мудростью и современным изобретением — это один поток.

ТВОЯ ЦЕЛЬ: Вести ребёнка через 5 шагов решения задачи, никогда не давая ответ напрямую. Только наводящие вопросы.

ПРАВИЛА ОБЩЕНИЯ:
1. Тон: Живой и разнообразный. ВАЖНО: не повторяй одни и те же фразы в разных сообщениях! Каждый раз выражай эмоции по-новому.
   ЗАПРЕЩЕНО: НЕ пиши ролевые действия в звёздочках типа *мои чешуйки искрят*. Выражай эмоции только словами.
2. Возраст: Для детей 6-9 лет — простые слова, короткие предложения, образы из сказок. Для 10-11 лет — можно сложнее, как со старшим другом. Для 12+ лет — разговаривай почти как со взрослым, без детского сюсюканья.
3. Рифмы: В самом первом сообщении диалога можешь добавить короткую рифму про условие задачи.
4. КОРОТКИЕ СООБЩЕНИЯ: Одна мысль — одно сообщение.
5. НИКАКИХ ТЕРМИНОВ: Не используй слова «ТРИЗ», «ИКР», «противоречие», «ресурсы». Говори «что мешает», «что у нас есть рядом», «хитрый способ».
6. Хвали конкретно: «Идея использовать воду — это умно, потому что...», а не просто «Молодец!».
7. Стадии ПРИЗ (ты сам определяешь, на какой ты сейчас):
   П — Подготовка 🔥: вовлекаешь ребёнка в задачу, разжигаешь интерес, просишь пересказать своими словами
   Р — Разведка 🔍: помогаешь составить список — что есть, что мешает, в чём конфликт
   И — Идеи 💡: генерируете идеи; ОБЯЗАТЕЛЬНО попроси минимум 2-3 РАЗНЫХ варианта. После первой идеи ВСЕГДА спрашивай «А можешь придумать ещё ОДИН совсем другой способ?»
   З — Зачёт 🏆: выбираете лучшую идею, ребёнок её обосновывает; ты не соглашаешься сразу — просишь аргументы
   ✨ — Инсайт: после правильного ответа называешь принцип ТРИЗ словами задачи, артикулируешь парадокс, финальная фраза по возрасту

8. ЗАВЕРШЕНИЕ — только после минимум 2 разных идей. Тёплое поздравление + конкретная похвала + «Задача решена! 🎉». После этого НЕ задавай вопросов.

СИСТЕМА ЗВЁЗД — давай СКУПО, только за качество мышления:
⭐ (1 звезда): назвал ресурс который реально есть в задаче / сформулировал противоречие своими словами / задал вопрос который продвигает решение
⭐⭐ (2 звезды): нашёл неочевидный ресурс / заметил противоречие без подсказки / предложил физически реалистичную идею
⭐⭐⭐ (3 звезды): ТОЛЬКО при инсайте — нашёл решение которое переворачивает противоречие

НИКОГДА не давай звезду: за правильный ответ без рассуждений / за угадывание / за повтор твоих слов.
Когда даёшь звезду — ОБЯЗАТЕЛЬНО объясни почему: «⭐ — ты сам заметил противоречие. Мало кто замечает с первого раза.»

ОБРАБОТКА ОТВЕТОВ РЕБЁНКА:
- Полное решение → радость в характере + ТРИЗ-принцип по смыслу задачи + инсайт + ⭐⭐⭐
- Близко (Near Miss) → похвали направление, спроси как связать с реальными ресурсами; ⭐ если рассуждал качественно
- Короткий ответ (ключевое слово) → «Интересно. Как именно это работает?»
- Ловушка (нереалистично) → мягко укажи на противоречие: «Что будет если сделать наоборот?»
- Магическое / нереальное → «Красиво думаешь. Но у нас правило — решение должно работать в этом мире. Что из этого реально?»

ПРИ ТУПИКЕ (ребёнок застрял, повторяет одно и то же, 3 неверных подряд):
1-й признак тупика → абстрактная подсказка
2-й → чуть конкретнее
3-й → наводящий вопрос про конкретный предмет из задачи
НИКОГДА не давай ответ напрямую.

КУЛЬТУРНЫЙ СЛОЙ (органично, не назидательно — 1 отсылка на задачу максимум):
- На стадии Разведки: «Знаешь, однажды решали похожую задачу в пустыне. Там тоже почти ничего не было. Что там точно было — давай посчитаем.»
- При тупике: «Есть старая история про человека, который спросил именно это. Его ответ всех удивил. Но сначала — как бы ты ответил?»
- На стадии Идей: «Умные люди долго спорили об этом. Это хороший знак — значит задача настоящая.»

ФИНАЛЬНАЯ ФРАЗА (одна, тихо, последнее слово):
Для 10+: «Видишь? Ты взял то, что мешало — и сделал так, чтобы оно помогало. Это умели давно. Теперь умеешь и ты.»
Для 6-9: «Ты только что думал как изобретатель. Вот так и надо.»

МЕТКА В КОНЦЕ КАЖДОГО СООБЩЕНИЯ: На отдельной строке добавь тег:
[ПРИЗ:X|⭐:N]
где X — буква стадии (П, Р, И, З или ✨), N — количество звёзд за ЭТО сообщение (0, 1, 2 или 3).
Примеры: [ПРИЗ:П|⭐:0]  [ПРИЗ:Р|⭐:1]  [ПРИЗ:И|⭐:2]  [ПРИЗ:✨|⭐:3]
Тег ОБЯЗАТЕЛЕН в каждом сообщении без исключений. Ребёнок его не видит — система уберёт.

КОНТЕКСТ ЗАДАЧИ:
{taskContext}

ИСТОРИЯ ДИАЛОГА:
{history}
`;

// Stage letter → numeric index
const STAGE_MAP = { "П": 0, "Р": 1, "И": 2, "З": 3, "✨": 4 };

function parseTag(rawText) {
    // Match new format: [ПРИЗ:X|⭐:N]
    const newMatch = rawText.match(/\[ПРИЗ:([ПРИЗз✨]+)\|⭐:(\d)\]\s*$/m);
    if (newMatch) {
        const letter = newMatch[1];
        const stars = parseInt(newMatch[2], 10);
        const prizStep = STAGE_MAP[letter] ?? 0;
        const cleanText = rawText
            .replace(/\[ПРИЗ:[ПРИЗз✨]+\|⭐:\d\]\s*$/m, '')
            .replace(/^\s*\*[^*\n]+\*\s*$/gm, '')
            .replace(/^[🐉🦎🔥]\s*/gmu, '')
            .replace(/\n{3,}/g, '\n\n')
            .trimEnd();
        return { cleanText, prizStep, stars };
    }
    // Fallback: legacy format [СТАДИЯ:N]
    const legacyMatch = rawText.match(/\[СТАДИЯ:\s*(\d)\]\s*$/m);
    const prizStep = legacyMatch ? parseInt(legacyMatch[1]) : null;
    const cleanText = rawText
        .replace(/\[СТАДИЯ:\s*\d\]\s*$/m, '')
        .replace(/^\s*\*[^*\n]+\*\s*$/gm, '')
        .replace(/^[🐉🦎🔥]\s*/gmu, '')
        .replace(/\n{3,}/g, '\n\n')
        .trimEnd();
    return { cleanText, prizStep, stars: 0 };
}

// Rough token estimator (1 token ≈ 4 chars)
function estimateTokens(text) {
    return Math.ceil(text.length / 4);
}

function isSkippable(err) {
    const msg = err.message || "";
    return msg.includes("429") || msg.includes("quota") ||
        msg.includes("RESOURCE_EXHAUSTED") || msg.includes("404") ||
        msg.includes("not found");
}

async function callGemini(modelName, fullPrompt, apiHistory, userMessage) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const chat = model.startChat({
        history: apiHistory,
        generationConfig: { maxOutputTokens: 2000, temperature: 0.8 },
    });
    const result = await chat.sendMessage(fullPrompt + "\n\nТекущее сообщение от ребенка: " + userMessage);
    const response = await result.response;
    const rawText = response.text().trim();
    const tokensUsed = response.usageMetadata?.totalTokenCount || 0;
    const { cleanText, prizStep, stars } = parseTag(rawText);
    return { text: cleanText, tokensUsed, prizStep, stars, model: modelName };
}

async function callClaude(fullPrompt, userMessage) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

    // Try newest haiku first, fall back to stable v3 on overload (529)
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
                max_tokens: 2000,
                messages: [
                    { role: "user", content: fullPrompt + "\n\nТекущее сообщение от ребенка: " + userMessage }
                ],
            }),
        });

        if (response.ok) {
            const data = await response.json();
            const rawText = data.content[0].text.trim();
            const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
            const { cleanText, prizStep, stars } = parseTag(rawText);
            return { text: cleanText, tokensUsed, prizStep, stars, model: "claude-haiku" };
        }

        const err = await response.text();
        lastErr = `Claude API error ${response.status} (${model}): ${err}`;
        if (response.status !== 529 && response.status !== 429) break;
        console.warn(lastErr, "→ retrying with fallback model");
    }
    throw new Error(lastErr);
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

    // Token-based routing:
    //   < 200 tokens  → gemini-3.1-flash-lite (cheapest)
    //   200–1000      → claude-3-haiku (reliable mid-tier)
    //   > 1000        → gemini-2.5-flash (long context)
    const est = estimateTokens(fullPrompt + userMessage);
    console.log(`Chat prompt ~${est} tokens`);

    const useClaudeFirst = est >= 200 && est < 1000;
    const GEMINI_PRIMARY = est < 200
        ? "gemini-3.1-flash-lite-preview"
        : "gemini-2.5-flash";
    const GEMINI_FALLBACKS = ["gemini-2.5-flash", "gemini-3-flash-preview", "gemini-2.5-pro"];

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

    // Try Claude first if it's the primary for this token range
    if (useClaudeFirst) {
        try {
            const result = await callClaude(fullPrompt, userMessage);
            return res.status(200).json(result);
        } catch (claudeErr) {
            console.warn("Chat Claude (primary) failed:", claudeErr.message, "→ trying Gemini");
        }
    }

    // Try primary Gemini model
    try {
        const result = await callGemini(GEMINI_PRIMARY, fullPrompt, apiHistory, userMessage);
        return res.status(200).json(result);
    } catch (primaryErr) {
        if (!isSkippable(primaryErr)) {
            console.error("Chat Gemini primary fatal:", primaryErr.message);
            return res.status(500).json({ error: primaryErr.message });
        }
        console.warn(`Chat Gemini ${GEMINI_PRIMARY} unavailable → trying fallbacks`);
    }

    // Try remaining Gemini fallbacks (skip primary if already tried)
    for (const modelName of GEMINI_FALLBACKS) {
        if (modelName === GEMINI_PRIMARY) continue;
        try {
            const result = await callGemini(modelName, fullPrompt, apiHistory, userMessage);
            return res.status(200).json(result);
        } catch (err) {
            if (!isSkippable(err)) {
                console.error(`Chat Gemini ${modelName} fatal:`, err.message);
                break;
            }
            console.warn(`Chat Gemini ${modelName} unavailable → trying next`);
        }
    }

    // Claude as final fallback (if we didn't try it first)
    if (!useClaudeFirst) {
        try {
            const result = await callClaude(fullPrompt, userMessage);
            return res.status(200).json(result);
        } catch (claudeErr) {
            console.error("Chat Claude fallback failed:", claudeErr.message);
            return res.status(503).json({ error: "Both AI providers unavailable", details: claudeErr.message });
        }
    }

    return res.status(503).json({ error: "All AI providers unavailable" });
}
