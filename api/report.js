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
      "name": "ТОЧНОЕ название из списка ниже",
      "isIFR": true/false,
      "childUsage": "Одно предложение — КАК ИМЕННО ребенок применил этот прием в своем решении"
    }
  ]
}

### СТРОГИЙ СПИСОК ПРИЕМОВ (используй ТОЛЬКО эти точные строки в поле "name"):
- Сегментация
- Вынесение
- Объединение
- Универсальность
- Матрешка
- Адаптивность
- Наоборот
- Предварительное действие
- Посредник
- Самообслуживание

КРИТИЧЕСКИ ВАЖНО для поля "name":
- Копируй название РОВНО как написано выше, без изменений, без скобок, без пояснений.
- НЕ ПИШИ свои названия типа "Замена вещества" — найди ближайший из 10 приемов.
- Пример ПРАВИЛЬНО: "name": "Вынесение"
- Пример НЕПРАВИЛЬНО: "name": "Замена вещества (Вынесение свойств)"

Поле "childUsage" — обязательно. Опиши КОНКРЕТНО что придумал ребенок. Пример: "Ты предложил убрать лишнюю часть — как настоящий инженер!"

Важно: Если решение ребенка близко к Идеальному Конечному Результату (использует ресурсы, которые уже есть, или превращает вред в пользу), обязательно ставь isIFR: true. Отвечай ТОЛЬКО на русском языке. Верни ТОЛЬКО валидный JSON без markdown.`;

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

// Claude Haiku models — newest first, stable fallback
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
            max_tokens: 1000,
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

    const { messages, task } = req.body;
    if (!messages || !task) return res.status(400).json({ error: "messages and task required" });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });

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
    for (const modelName of CLAUDE_MODELS) {
        try {
            const result = await callClaude(apiKey, modelName, prompt);
            const data = extractJSON(result.text);
            console.log(`Report ${result.model} (in:${result.inputTokens} out:${result.outputTokens})`);
            return res.status(200).json({ ...data, model: result.model, inputTokens: result.inputTokens, outputTokens: result.outputTokens });
        } catch (err) {
            console.warn(`Report: ${modelName} failed — ${err.message}`);
            lastErr = err;
            // Only retry on overload/rate-limit
            if (err.status !== 529 && err.status !== 429) break;
        }
    }

    // Fallback if all models fail
    console.error(`Report: all models failed for task "${task.title}". Last error: ${lastErr?.message}`);
    return res.status(200).json({
        report: null,
        principles: [],
        fallback: true,
        error: lastErr?.message || "All models failed",
    });
}
