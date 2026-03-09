/**
 * Client-side AI bridge.
 * Calls the server-side /api/chat endpoint so API keys never appear in the browser bundle.
 */

// Read persona from URL once (dev-only switching via ?persona=ID)
function getPersonaIdFromUrl() {
    try {
        return new URLSearchParams(window.location.search).get("persona") || undefined;
    } catch {
        return undefined;
    }
}

export async function generateUgolokResponse(userMessage, history, task, onError = null, prizStep = 0) {
    const personaId = getPersonaIdFromUrl();
    // Timeout: 30s — чтобы клиент не зависал если Vercel или AI тормозят
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
        const response = await fetch("/api/chat", {
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
