/**
 * GET /api/personas-list
 * Returns the list of available personas (id, name, label, description).
 * Prompts are intentionally omitted from the response.
 */
import { PERSONAS, DEFAULT_PERSONA_ID } from "./personas.js";

export default function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    const list = Object.values(PERSONAS).map(({ id, name, label, description, isDefault }) => ({
        id,
        name,
        label,
        description,
        isDefault: !!isDefault,
    }));

    return res.status(200).json({ personas: list, defaultId: DEFAULT_PERSONA_ID });
}
