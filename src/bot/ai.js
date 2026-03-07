/**
 * Client-side AI bridge.
 * Calls the server-side /api/chat endpoint so API keys never appear in the browser bundle.
 */
export async function generateUgolokResponse(userMessage, history, task, onError = null) {
    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userMessage, history, task }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(err.error || `Server error ${response.status}`);
        }

        const data = await response.json();
        return {
            text: data.text,
            tokensUsed: data.tokensUsed || 0,
            prizStep: data.prizStep ?? null,
            stars: data.stars ?? 0,
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
