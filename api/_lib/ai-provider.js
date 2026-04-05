import { PERSONAS, getPersona } from "./personas.js";

/**
 * Parse the response tag [S:N|R:N] where S=stage (0-4), R=rating (1-3)
 * Using simple ASCII numbers — much more reliable than Cyrillic letters.
 */
function parseTag(rawText) {
    let cleanText = rawText.trim();

    // Extract tag: [S:0|R:1] ... [S:4|R:3]
    const tagMatch = cleanText.match(/\[S:([0-4])\|R:([1-3])\]/);
    let prizStep = null; // null = no tag found, keep current stage
    let stars = 1; // default 1 star

    if (tagMatch) {
        prizStep = parseInt(tagMatch[1], 10);
        stars = parseInt(tagMatch[2], 10);
    }

    // Remove the tag from response text
    cleanText = cleanText
        .replace(/\[S:[0-4]\|R:[1-3]\]/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/^["'\s]+|["'\s]+$/g, '')
        .trim();


    return { cleanText, prizStep, stars };
}

/**
 * Direct call to Polza API (Claude 3 Haiku).
 */
export async function getClaudeResponse({
  userMessage,
  history = [],
  task = null,
  personaId = null,
  prizStep = 0,
  systemPromptOverride = null
}) {
  const polzaKey = process.env.POLZA_API_KEY;
  if (!polzaKey) throw new Error("POLZA_API_KEY is not configured on the server");

  // Determine persona and system prompt
  let systemPrompt = systemPromptOverride;
  if (!systemPrompt) {
    const persona = personaId ? PERSONAS[personaId] : getPersona(task?.difficulty || 1);

    let taskContext = "";
    if (task) {
      const resourcesLine = Array.isArray(task.resources)
        ? `RESOURCES: ${task.resources.map(r => typeof r === 'string' ? r : `${r.id} (${r.properties})`).join(", ")}`
        : `RESOURCES: ${task.resources || "unrestricted"}`;

      taskContext = `Task: ${task.title || "New task"}\nCondition: ${task.condition || task.teaser || "Solve the riddle"}\n${resourcesLine}\nCorrect answer hint: ${task.trick || task.ikr || "use available resources creatively"}`;
    }

    const STAGE_GUIDE = {
      0: "STAGE 0 (П): Ask 1 short question to check the child understands the problem.",
      1: "STAGE 1 (Р): Ask what resources or tools are nearby that could help.",
      2: "STAGE 2 (И): The child proposed an idea. CRITICAL RULE: if the child's message already contains BOTH what to use AND how (e.g. 'use Rapunzel's hair as a rope to climb up') — set S:3 immediately, do NOT ask follow-up questions. Only ask ONE clarifying question if the idea is vague or incomplete (e.g. just 'hair' without explaining how).",
      3: `STAGE 3 (З): The child gave a complete solution. Write EXACTLY 2 sentences: first praise what specifically is good, second say 'Задача решена!' Nothing else.\n\nFor the R rating in the tag, evaluate solution QUALITY based on TRIZ principles:\n- R:3 = child's idea uses the EXACT resources already present in the task (matching the IKR). This is the elegant TRIZ solution.\n- R:2 = child found a working solution through analysis but uses new/external resources not mentioned in the task.\n- R:1 = child found any solution (correct but without elegant resource use).\nTask IKR: ${task?.ikr || ''}\nTask resources: ${Array.isArray(task?.resources) ? task.resources.map(r => r.id || r).join(', ') : (task?.resources || '')}`,
    };

    const currentGuide = STAGE_GUIDE[prizStep] || STAGE_GUIDE[0];

    systemPrompt = `${persona.prompt}

${taskContext}

YOUR CURRENT INSTRUCTION: ${currentGuide}

STRICT RULES — follow exactly:
- Reply in Russian, MAX 2 short sentences. Never more.
- Ask only ONE question per reply. Never two.
- Do NOT explain scientific principles, TRIZ theory, or unrelated facts.
- Do NOT repeat ANY question already asked in the conversation history above.
- If child says "не знаю" or gives vague answer — ask something DIFFERENT, more specific.
- When stage is 3: say "Задача решена!" only, nothing about science.
- NEVER ask "а как именно?" or similar follow-ups if the child already described a complete mechanism.

IMPORTANT: End EVERY reply with this tag on a new line: [S:N|R:N]
S = stage to set: 0=П, 1=Р, 2=И, 3=З
R = rating of child's last message: 1=ok, 2=good, 3=excellent
Use S:3 when the child gave a complete working solution. If in doubt — lean toward accepting.
Example: [S:2|R:3]`;
  }

  // Build messages array
  const conversationMessages = [];
  if (history.length > 0) {
    const recent = history.slice(-10);
    for (const m of recent) {
      const isBot = m.role === "assistant" || m.role === "bot" || m.from === "bot" || m.type === "bot";
      conversationMessages.push({
        role: isBot ? "assistant" : "user",
        content: m.text || m.content || ""
      });
    }
  }
  conversationMessages.push({ role: "user", content: userMessage });

  const response = await fetch("https://api.polza.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${polzaKey}`
    },
    body: JSON.stringify({
      model: "anthropic/claude-3-haiku",
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationMessages
      ],
      temperature: 0.7,
      max_tokens: 300
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Polza API Error: ${errText}`);
  }

  const data = await response.json();
  const rawText = data.choices[0].message.content;
  const { cleanText, stars, prizStep: newStep } = parseTag(rawText);

  return {
    text: cleanText,
    stars,
    // If AI returned a valid stage → use it; otherwise keep current
    prizStep: newStep !== null ? newStep : prizStep,
    model: "anthropic/claude-3-haiku",
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    },
  };
}
