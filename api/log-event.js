/**
 * POST /api/log-event
 * Logs an AI operation event to Vercel KV (Upstash Redis).
 * Called client-side fire-and-forget after each AI call (chat, hook, report).
 *
 * Required env vars:
 *   KV_REST_API_URL   — Upstash Redis REST endpoint (auto-set by Vercel KV)
 *   KV_REST_API_TOKEN — Upstash Redis REST token   (auto-set by Vercel KV)
 *   LOG_SECRET        — shared secret for basic auth
 */

// Cost per million tokens (USD), by model
const PRICING = {
    "claude-haiku":                  { in: 0.80, out: 4.00 },
    "gemini-3.1-flash-lite-preview": { in: 0.075, out: 0.30 },
    "gemini-2.5-flash":              { in: 0.15, out: 0.60 },
    "gemini-2.5-pro":                { in: 1.25, out: 10.00 },
    "gemma-3-4b-it":                 { in: 0, out: 0 },
};
const DEFAULT_PRICING = { in: 0.80, out: 4.00 }; // conservative fallback

function calcCost(model, inputTokens, outputTokens) {
    const p = PRICING[model] || DEFAULT_PRICING;
    return (inputTokens / 1_000_000) * p.in + (outputTokens / 1_000_000) * p.out;
}

// Execute a pipeline of Redis commands via Upstash REST API
async function kvPipeline(commands) {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!url || !token) {
        console.warn("log-event: KV not configured, skipping");
        return null;
    }
    const resp = await fetch(`${url}/pipeline`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(commands),
    });
    if (!resp.ok) {
        const txt = await resp.text();
        console.error("log-event KV error:", resp.status, txt);
    }
    return resp;
}

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-log-secret");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    // Auth: soft check — log warning but don't block (internal logging only)
    const secret = process.env.LOG_SECRET;
    if (secret && req.headers["x-log-secret"] !== secret) {
        console.warn("log-event: secret mismatch, proceeding anyway");
    }

    const {
        sessionId,
        op,           // "chat" | "hook" | "report"
        taskId,
        ageRange,
        personaId,
        model,
        inputTokens = 0,
        outputTokens = 0,
        prizStep,
        completed = false,
    } = req.body || {};

    if (!op) return res.status(400).json({ error: "op is required" });

    const costUsd = calcCost(model || "", inputTokens, outputTokens);
    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const prefix = `fi:daily:${date}`;
    const TTL = 604800; // 7 days in seconds

    const event = {
        ts: new Date().toISOString(),
        sessionId, op, taskId, ageRange, personaId, model,
        inputTokens, outputTokens, costUsd, prizStep, completed,
    };

    // Build pipeline commands
    const cmds = [
        ["INCRBYFLOAT", `${prefix}:cost_usd`, costUsd],
        ["INCRBYFLOAT", `${prefix}:${op}_cost`, costUsd],
        ["INCRBY", `${prefix}:input_tokens`, inputTokens],
        ["INCRBY", `${prefix}:output_tokens`, outputTokens],
        ["INCRBY", `${prefix}:turns`, 1],
        ["LPUSH", "fi:events", JSON.stringify(event)],
        ["LTRIM", "fi:events", 0, 499],
        // Set TTL on cost key (representative key to check daily cleanup)
        ["EXPIRE", `${prefix}:cost_usd`, TTL],
    ];

    if (op === "hook") cmds.push(["INCRBY", `${prefix}:tasks_started`, 1]);
    if (completed)     cmds.push(["INCRBY", `${prefix}:tasks_completed`, 1]);

    await kvPipeline(cmds);

    console.log(`log-event: op=${op} model=${model} in=${inputTokens} out=${outputTokens} cost=$${costUsd.toFixed(5)}`);
    return res.status(200).json({ ok: true });
}
