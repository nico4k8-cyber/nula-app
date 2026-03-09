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
    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userMessage, history, task, personaId, prizStep }),
        });

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
        console.error("AI API Error:", error);

        if (onError) {
            onError({
                error: error.message,
                details: error.toString(),
                taskTitle: task?.title || "unknown",
                timestamp: new Date().toISOString(),
            });
        }

        return { text: "🐉 Ой-ой! Что-то пошло не так. Давай попробуем ещё раз?", tokensUsed: 0, prizStep: null, stars: 0 };
    }
}
