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

    // If AI wrote "задача решена" → force stage 4 completion
    if (cleanText.toLowerCase().includes("задача решена")) {
        return { cleanText, prizStep: 4, stars: Math.max(stars, 2) };
    }

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
      0: "STAGE P (Prepare): Ask 1 short question to make sure the child understands the problem.",
      1: "STAGE R (Research): Ask about obstacles or what resources are available nearby.",
      2: "STAGE I (Ideas): The child proposed an idea — ask them to develop it further OR propose one more variant. Do NOT accept the first idea immediately.",
      3: "STAGE Z (Done): The child gave a solid solution. Praise them specifically (mention what exactly is good). End with 'задача решена'.",
    };

    const currentGuide = STAGE_GUIDE[prizStep] || STAGE_GUIDE[0];

    // Determine next valid stages (AI can stay or advance, never go back)
    const nextStages = prizStep < 3
      ? `You may keep stage ${prizStep} or advance to ${prizStep + 1} (or higher if fully solved).`
      : `Stay at stage 3 and end the task.`;

    systemPrompt = `${persona.prompt}

${taskContext}

CURRENT STAGE: ${currentGuide}
${nextStages}

RULES:
- Reply in Russian, max 2 short sentences.
- Ask only ONE question per reply.
- Do not repeat questions already asked.
- Do not explain TRIZ theory — just guide the child's thinking.
- If the child already gave a working solution → praise specifically and say "задача решена".

IMPORTANT: End EVERY reply with a tag on a new line: [S:N|R:N]
where S = new stage number (0=Prepare, 1=Research, 2=Ideas, 3=Done, 4=Solved)
and R = rating of this child's message (1=ok, 2=good, 3=excellent).
Example: [S:1|R:2]`;
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
