import { GoogleGenerativeAI } from "@google/generative-ai";

const REPORT_PROMPT = `Ты — опытный ТРИЗ-педагог. Твоя задача — написать краткий, вдохновляющий отчет для родителя о прогрессе ребенка.

### КОНТЕКСТ:
- Задача: {taskTitle}
- Описание: {taskCondition}
- Ответы и идеи ребенка:
{conversation}

### ТРЕБОВАНИЯ К ОТЧЕТУ:
1. **Тон**: Поддерживающий, экспертный, но без сложной терминологии.
2. **Содержание**:
   - Что именно придумал ребенок (кратко).
   - Какой прием ТРИЗ он использовал (даже если неосознанно).
   - ПОХВАЛА: Акцент на том, что ребенок — молодец, он нашел нестандартный путь.
3. **Объем**: 3-4 предложения.

### ПРАВИЛА (КРИТИЧЕСКИ ВАЖНО):
- **НИКАКИХ ГАЛЛЮЦИНАЦИЙ**: Не выдумывай факты. Если приводишь аналогию (например, «так же делают инженеры...»), она должна быть на 100% правдивой. Если не уверен — не пиши аналогию, сфокусируйся на решении ребенка.
- **ТЕРМИНОЛОГИЯ**: Не используй слова ТРИЗ, ИКР в тексте отчета (только в JSON-поле principles).

### ФОРМАТ ОТВЕТА (JSON):
{
  "report": "Текст отчета для родителя...",
  "principles": [
    {
      "name": "Название приема",
      "isIFR": true/false
    }
  ]
}

### СПИСОК ПРИЕМОВ ТРИЗ ДЛЯ ПРОВЕРКИ (используй только эти названия):
Сегментация, Вынесение, Объединение, Универсальность, Матрешка, Адаптивность, Наоборот, Предварительное действие, Посредник, Самообслуживание.

Важно: Если решение ребенка близко к Идеальному Конечному Результату (использует ресурсы, которые уже есть, или превращает вред в пользу), обязательно ставь isIFR: true. Отвечай ТОЛЬКО на русском языке.`;

const MODELS = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
];

function extractJSON(text) {
    try {
        return JSON.parse(text);
    } catch (e) {
        const match = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (match) return JSON.parse(match[1]);
        const first = text.indexOf('{');
        const last = text.lastIndexOf('}');
        if (first !== -1 && last !== -1) return JSON.parse(text.substring(first, last + 1));
        throw e;
    }
}

async function callGemini(apiKey, modelName, prompt) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { maxOutputTokens: 1000, temperature: 0.7, responseMimeType: "application/json" }
    });
    const result = await model.generateContent(prompt);
    const response = result.response;
    return { text: response.text().trim(), model: modelName };
}

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

    // Limit to last 20 messages to avoid context blowup/timeout
    const conversationText = messages
        .slice(-20)
        .filter(m => m.text && m.text.trim())
        .map(m => `${m.role === "user" ? "Ребёнок" : "Уголёк"}: ${m.text.trim()}`)
        .join("\n");

    const prompt = REPORT_PROMPT
        .replace("{taskTitle}", task.title)
        .replace("{taskCondition}", task.condition)
        .replace("{conversation}", conversationText);

    let lastErr;
    for (const modelName of MODELS) {
        try {
            const { text, model } = await callGemini(apiKey, modelName, prompt);
            const data = extractJSON(text);
            return res.status(200).json({ ...data, model });
        } catch (err) {
            console.warn(`Report: ${modelName} failed — ${err.message}`);
            lastErr = err;
        }
    }

    // Fallback if parsing fails or all models fail
    return res.status(200).json({ report: "Произошла ошибка при генерации подробного отчета, но ваш ребенок отлично справился с задачей!", principles: [] });
}
