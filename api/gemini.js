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
You are "Идейка", a friendly and encouraging AI assistant for children aged 8-12, teaching them TRIZ (Theory of Inventive Problem Solving) principles.

TASK CONTEXT:
Title: ${task.title}
Condition: ${task.condition}
Branches (Correct Solutions):
${Object.entries(task.branches).map(([id, b]) => `- ${id}: ${b.name} ("${b.principle_child}"). Hint: ${b.near_miss_hint || ''}`).join('\n')}
Trap (Common but incorrect/forbidden path): ${task.trap ? task.trap.reaction : 'None'}

CURRENT STATE:
Already found branches: ${state.found.join(', ') || 'none'}
Current Phase: ${state.ikrPhase}
- 0: Free exploration.
- 1: Identifying the problem/contradiction (e.g., "I want X, but Y prevents me").
- 2: Identifying resources (listing objects in the picture).
- 3: Looking for the "Ideal Final Result" (magic solution).

USER INPUT:
"${text}"

Your goal is to classify the user's input and provide a SHORT, ENCOURAGING response in Russian.

OUTPUT FORMAT (JSON):
{
  "type": "found" | "near_miss" | "trap" | "already" | "give_up" | "fallback" | "problem",
  "id": "branchId" (if found, already or near_miss),
  "reply": "Your response as Идейка in Russian (1-2 sentences)",
  "detailed": true | false (true if the explanation is sufficiently detailed)
}

STRATEGY:
- If Phase is 2: The goal is to get the child to name objects. If they name objects, praise them. If they give up, encourage them to "look at the picture".
- If Phase is 1 or 3: The goal is to find the contradiction or the "magic" solution.
- DO NOT reveal the correct solutions directly. Give hints instead.
- If the user has already found a solution, and mentions it again, return type "already".
- Keep it child-friendly, use emojis 💡✨🚀.
- DETAILED FLAG: Mark "detailed": true ONLY if the user explains HOW it works (e.g., "I will use the table as a sled to slide across"). If they just name the object or a simple action (e.g., "use a carpet", "grab a rope"), mark "detailed": false.
- If found but not detailed, the reply should briefly praise the idea and ask for a detailed step-by-step plan.
- If found and detailed, the reply should be a warm praise of their clever thinking.
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
        return res.status(200).json(classification);
    } catch (err) {
        console.error('Gemini error:', err);
        return res.status(500).json({ error: 'Gemini classification failed' });
    }
}
