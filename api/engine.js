/**
 * /api/engine.js — Bridge to 7-phase TRIZ engine
 * Handles open-ended problem-solving tasks
 */

import { processUserMessage, TASKS } from "../src/bot/engine.js";
import { getClaudeResponse } from "./_lib/ai-provider.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { userMessage, task, state, history, ageGroup } = req.body;

  if (!userMessage || !task || !state) {
    return res.status(400).json({ error: "userMessage, task, and state are required" });
  }

  // Map ageGroup to numeric age for ПРИЗ version selection
  let age = 10; // default
  if (ageGroup === "junior") age = 10;    // ПРИЗ-стандарт (8-13)
  else if (ageGroup === "senior") age = 14; // ПРИЗ-про (13+)

  // Wrapper for the direct AI provider to match engine's expected interface
  const aiWrapper = async (userMsg, hist, tsk, errHandler, prizPhase) => {
    try {
      const resp = await getClaudeResponse({
        userMessage: userMsg,
        history: hist,
        task: tsk,
        prizStep: prizPhase
      });
      // Parse tags if necessary (ai-provider returns raw text)
      // Actually, engine expects the object with text, stars, etc.
      // ai-provider returns { text, model, ... }
      // The original callClaude in chat.js did parseTag.
      // I should make sure ai-provider or engine handles the tag parsing.
      return resp;
    } catch (e) {
      if (errHandler) errHandler(e);
      throw e;
    }
  };

  try {
    const result = await processUserMessage(userMessage, task, state, history || [], null, age, aiWrapper);
    return res.status(200).json(result);
  } catch (err) {
    console.error("[engine API]", err.message);
    return res.status(500).json({
      error: "Engine processing failed",
      details: err.message,
      reply: "Что-то пошло не так. Попробуй ещё раз.",
      newState: state,
      stars: 0
    });
  }
}
