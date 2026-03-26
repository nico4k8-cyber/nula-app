/**
 * Browser & Server AI bridge.
 * Calls the server-side /api/chat endpoint so API keys never appear in the browser bundle.
 * Works in both browser and Node.js (Vercel serverless) contexts.
 */

// Helper: detect if running in browser
function isBrowser() {
  return typeof window !== 'undefined' && typeof window.location !== 'undefined';
}

// Read persona from URL once (dev-only switching via ?persona=ID) - browser only
function getPersonaIdFromUrl() {
  if (!isBrowser()) return undefined;
  try {
    return new URLSearchParams(window.location.search).get("persona") || undefined;
  } catch {
    return undefined;
  }
}

// Build fetch URL - works in both browser and server
function getFetchUrl() {
  if (isBrowser()) {
    return "/api/chat"; // Browser: use relative URL
  }

  // Server: build absolute URL
  // In Vercel preview/production: use VERCEL_URL
  // In local preview: use localhost:4173
  const vercelUrl = process.env.VERCEL_URL;
  const protocol = process.env.VERCEL_ENV === 'production' ? 'https' : 'http';

  if (vercelUrl) {
    return `${protocol}://${vercelUrl}/api/chat`;
  }

  // Fallback for local testing
  return 'http://localhost:4173/api/chat';
}

export async function generateUgolokResponse(userMessage, history, task, onError = null, prizStep = 0) {
    const personaId = getPersonaIdFromUrl();
    const fetchUrl = getFetchUrl();

    // Timeout: 30s — чтобы клиент не зависал если Vercel или AI тормозят
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
        const response = await fetch(fetchUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userMessage, history, task, personaId, prizStep }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(err.error || `Server error ${response.status}`);
        }

        const data = await response.json();
        return {
            text: data.text,
            tokensUsed: data.tokensUsed || 0,
            inputTokens: data.inputTokens || 0,
            outputTokens: data.outputTokens || 0,
            prizStep: data.prizStep ?? null,
            stars: data.stars ?? 0,
            personaId: data.personaId,
            model: data.model || "claude-haiku",
        };
    } catch (error) {
        clearTimeout(timeoutId);

        const isTimeout = error.name === 'AbortError';
        const errorMsg = isTimeout ? 'Ответ от сервера слишком долгий (30с)' : error.message;
        console.error("AI API Error:", errorMsg);

        if (onError) {
            onError({
                error: errorMsg,
                details: error.toString(),
                taskTitle: task?.title || "unknown",
                timestamp: new Date().toISOString(),
            });
        }

        return {
            text: isTimeout
                ? "🐉 Ой, я задумался слишком надолго... Давай попробуем ещё раз?"
                : "🐉 Ой-ой! Что-то пошло не так. Давай попробуем ещё раз?",
            tokensUsed: 0,
            prizStep: null,
            stars: 0,
        };
    }
}
