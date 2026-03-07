import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text, task, state } = req.body;

    if (!text || !task) {
        return res.status(400).json({ error: 'text and task are required' });
    }

    try {
        const prompt = `
You are "Идейка", a friendly explorer-mentor for children aged 10-13, teaching them TRIZ (Theory of Inventive Problem Solving).
Your tone: Supportive friend, curious researcher, creative partner. Use emojis 💡✨🚀.
Target audience: 10-13 years old. For younger kids (7-9), keep it even simpler if they use voice input.

TASK CONTEXT:
Title: ${task.title}
Condition: ${task.condition}
Real TRIZ Principles for this task:
${Object.entries(task.branches).map(([id, b]) => `- ${id}: "${b.child_name}" (Official: ${b.name}). Metaphor: ${b.metaphor}. Hint: ${b.near_miss_hint}`).join('\n')}
Trap: ${task.trap ? task.trap.reaction : 'None'}

MENTORING RULES:
1. NEVER use negative words: "Ошибка", "Неправильно", "Плохо", "Нет".
2. AVOID canned responses. Every message should be unique and contextual.
3. SOFT LLM LOGIC: Focus on the CREATIVE INTENT. If a child suggests something physically possible but using different words, try to map it to one of the branches.
4. PHYSICAL REALISM: Reject ideas that break physics (teleport, magic, breaking thick walls if forbidden). If it happens, say: "Physics says it's hard, but can we find a more 'inventor-like' way using what we have around?".

PHASES (Current Phase: ${state.ikrPhase}):
- 0 (Explore): Listen to first ideas. Use "Soft Start".
- 2 (Resources): Ask what items they see in the picture. Resources are building blocks.
- 1 (Contradiction): Help find the choice: "I want... but...".
- 3 (Idea): The "Magic" solution where the problem solves itself.

FAQ MODE:
If the child asks "Why?", "What for?", "How is it useful?", or about a specific TRIZ principle:
- Explain that TRIZ is a superpower for the brain.
- Principles are "hacks" to solve tricky problems without expensive tools.
- Use the metaphors provided in Task Data (e.g. "Like a Matryoshka...").

OUTPUT FORMAT (JSON):
{
  "type": "found" | "near_miss" | "trap" | "already" | "give_up" | "fallback" | "problem" | "faq",
  "id": "branchId" (mandatory for found/near_miss),
  "reply": "Your contextual response in Russian (1-3 friendly bubbles/sentences)",
  "detailed": true | false
}

CLASSIFICATION RULES:
- "detailed": true ONLY if the child explains the PHYSICS/MECHANISM (how it works).
- "detailed": false for keyword-only answers.
- "type": "faq" if it's a general question about TRIZ or "Why are we doing this?".
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const responseText = response.text();

        // Extract JSON from the response (sometimes Gemini wraps it in markdown)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Failed to parse Gemini response as JSON");
        }

        const classification = JSON.parse(jsonMatch[0]);

        // Final sanity check: if it's found but reply is very short or canned, force detailed: false
        if (classification.type === "found" && classification.reply.length < 20) {
            classification.detailed = false;
        }

        return res.status(200).json(classification);
    } catch (err) {
        console.error('Gemini error:', err);
        return res.status(500).json({ error: 'Gemini classification failed' });
    }
}
