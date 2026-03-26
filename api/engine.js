/**
 * /api/engine.js — Bridge to 7-phase TRIZ engine
 * Handles open-ended problem-solving tasks
 */

import { processUserMessage, TASKS } from "../src/bot/engine.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { userMessage, task, state, history } = req.body;

  if (!userMessage || !task || !state) {
    return res.status(400).json({ error: "userMessage, task, and state are required" });
  }

  try {
    const result = await processUserMessage(userMessage, task, state, history || []);
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
