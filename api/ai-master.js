import { getClaudeResponse } from "./_lib/ai-provider.js";
import { getPersona } from "./_lib/personas.js";

export const config = {
  runtime: 'edge', // Break out of the 10s Serverless limit!
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store, max-age=0, must-revalidate",
};

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { 
      status: 405, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  try {
    const body = await req.json();
    const { userMessage, history = [], task, prizStep = 0 } = body;

    if (!userMessage || !task) {
      return new Response(JSON.stringify({ error: "userMessage and task are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const result = await getClaudeResponse({
      userMessage,
      history: history, // Send full history if ai-provider wants to slice it
      task,
      prizStep,
      _forceHaiku: true
    });

    const persona = getPersona(task.difficulty);

    return new Response(JSON.stringify({
      text: result.text,
      reply: result.text,
      stars: result.stars || 0,
      prizStep: result.prizStep || prizStep,
      personaId: persona.id,
      model: result.model,
      _v: Date.now()
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("[Ugolok Chat Error]:", err);
    return new Response(JSON.stringify({ 
      error: "AI service error", 
      reply: "Уголёк задумался слишком глубоко. Давай попробуем ещё раз через минуту!",
      details: err.message,
      _v: Date.now()
    }), {
      status: 503, // Can be caught by frontend to show friendly message
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
