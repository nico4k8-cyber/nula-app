
export default async function handler(req, res) {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return res.status(200).json({ 
      status: "❌ ОШИБКА", 
      message: "Ключ GEMINI_API_KEY не найден в переменных окружения Vercel!" 
    });
  }

  const maskedKey = geminiKey.substring(0, 7) + "..." + geminiKey.substring(geminiKey.length - 4);
  
  try {
    // 1. Get Models List from Google AI Studio API
    const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`);
    const modelsData = await modelsRes.json();

    if (!modelsRes.ok) {
      return res.status(200).json({
        status: "❌ ОШИБКА ПОЛУЧЕНИЯ СПИСКА МОДЕЛЕЙ",
        key_preview: maskedKey,
        error_details: modelsData
      });
    }

    // 2. Filter only generation models
    const generationModels = modelsData.models
      .filter(m => m.supportedGenerationMethods.includes("generateContent"))
      .map(m => ({
        name: m.name, // e.g. "models/gemini-1.5-flash"
        displayName: m.displayName,
        description: m.description,
        inputTokenLimit: m.inputTokenLimit
      }));

    // 3. Test simple generation with gemini-1.5-flash (most likely available)
    const testModel = generationModels.find(m => m.name.includes("gemini-1.5-flash"))?.name || "models/gemini-1.5-flash";
    
    const testRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${testModel}:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Привет! Ответь одним словом 'Работает'." }] }]
      })
    });
    
    const testData = await testRes.json();
    let testStatus = "Unknown";
    if (testRes.ok && testData.candidates) {
      testStatus = testData.candidates[0].content.parts[0].text;
    } else {
      testStatus = `Ошибка теста: ${JSON.stringify(testData)}`;
    }

    return res.status(200).json({
      status: "✅ КЛЮЧ GEMINI НАЙДЕН",
      key_preview: maskedKey,
      test_model: testModel,
      test_reply: testStatus,
      available_models_count: generationModels.length,
      available_models: generationModels
    });

  } catch (err) {
    return res.status(200).json({
      status: "❌ КРИТИЧЕСКАЯ ОШИБКА",
      message: err.message
    });
  }
}
