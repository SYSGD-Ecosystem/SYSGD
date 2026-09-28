// routes/openrouter.ts
import express from "express";
import { pool } from "../db";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { checkAICredits, consumeAICredits } from "../middlewares/usageLimits.middleware";
import { openRouterAgent } from "../openRouterAgent";

const router = express.Router();

interface CachedAiPayload {
	prompt: string;
	systemPrompt?: string | null;
	result: Record<string, unknown>;
}

function extractErrorMessage(err: unknown): string {
	if (err instanceof Error) return err.message;
	if (typeof err === "string") return err;
	if (err && typeof err === "object" && "message" in err) {
		const message = (err as { message?: unknown }).message;
		if (typeof message === "string" && message.trim()) return message;
	}
	try {
		return JSON.stringify(err);
	} catch {
		return "Error desconocido";
	}
}

async function getCachedAiResponse(requestId: string, prompt: string, systemPrompt?: string | null): Promise<Record<string, unknown> | null> {
	const { rows } = await pool.query<{ response_body: CachedAiPayload | null }>(
		"SELECT response_body FROM ai_request_cache WHERE request_id = $1",
		[requestId],
	);

	const body = rows[0]?.response_body;
	if (!body || typeof body !== "object" || !body.result) return null;
	if (body.prompt !== prompt) return null;
	if (body.systemPrompt !== systemPrompt) return null;

	return body.result;
}

async function saveCachedAiResponse(requestId: string, prompt: string, systemPrompt: string | undefined, result: unknown): Promise<void> {
	await pool.query(
		`INSERT INTO ai_request_cache (request_id, response_body)
		 VALUES ($1, $2::jsonb)
		 ON CONFLICT (request_id) DO UPDATE SET response_body = EXCLUDED.response_body`,
		[requestId, JSON.stringify({ prompt, systemPrompt, result })],
	);
}

router.post("/", isAuthenticated, checkAICredits, async (req, res) => {
	console.log("Nueva petición a OpenRouter Agent:", req.body);

	const rawRequestId = req.body?.requestId ?? req.body?.request_id;
	const requestId =
		typeof rawRequestId === "string" && rawRequestId.trim() ? rawRequestId.trim() : null;

	const { prompt, systemPrompt, model } = req.body;

	if (!prompt) {
		return res.status(400).json({ error: "Falta el prompt" });
	}

	console.log({ systemPrompt });
	console.log({ reqBody: req.body });

	if (requestId) {
		try {
			const cachedResult = await getCachedAiResponse(requestId, prompt, systemPrompt);
			if (cachedResult) {
				console.log("⚡ Respuesta servida desde ai_request_cache:", requestId);
				return res.json({
					...cachedResult,
					cached: true,
				});
			}
		} catch (cacheErr) {
			console.error("⚠️ No se pudo leer ai_request_cache:", cacheErr);
		}
	}

	const useCustomToken = (req as any).useCustomToken;
	const customToken = (req as any).customToken;

	try {
		const result = await openRouterAgent({
			prompt,
			model: model || "openai/gpt-oss-120b:free",
			systemPrompt,
			customToken: useCustomToken ? customToken : undefined,
		});

		if (requestId) {
			try {
				await saveCachedAiResponse(requestId, prompt, systemPrompt, result);
			} catch (cacheErr) {
				console.error("⚠️ No se pudo guardar en ai_request_cache:", cacheErr);
			}
		}

		if (!useCustomToken) {
			await consumeAICredits(req, res, () => {
				res.json({
					...result,
					billing: {
						used_custom_token: false,
						credits_consumed: 1
					}
				});
			});
		} else {
			res.json({
				...result,
				billing: {
					used_custom_token: true,
					credits_consumed: 0
				}
			});
		}
	} catch (err) {
		console.error("Error en OpenRouter Agent:", err);
		res.status(500).json({
			error: "Error interno del agente OpenRouter",
			details: extractErrorMessage(err),
		});
	}
});

export default router;
