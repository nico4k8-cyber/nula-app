
export default async function handler(req, res) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return res.status(200).json({ 
      status: "❌ ОШИБКА", 
      message: "Ключ ANTHROPIC_API_KEY не найден в переменных окружения Vercel!" 
    });
  }

  const maskedKey = key.substring(0, 7) + "..." + key.substring(key.length - 4);
  
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 10,
        messages: [{ role: "user", content: "Привет! Ответь одним словом 'Работает'." }]
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      return res.status(200).json({
        status: "✅ КЛЮЧ РАБОТАЕТ",
        key_preview: maskedKey,
        ai_reply: data.content[0].text
      });
    } else {
      return res.status(200).json({
        status: "❌ ОШИБКА АПИ",
        key_preview: maskedKey,
        error_details: data
      });
    }
  } catch (err) {
    return res.status(200).json({
      status: "❌ КРИТИЧЕСКАЯ ОШИБКА",
      message: err.message
    });
  }
}
