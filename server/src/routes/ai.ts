// routes/ai.ts - Endpoint limpio para hablar con IA
// El cliente indica el proveedor, modelo y systemPrompt directamente.
// Soporta idempotencia vía requestId y facturación (créditos o token custom).
import express from "express";
import { pool } from "../db";
import { geminiAgent } from "../geminiAgent";
import { openRouterAgent } from "../openRouterAgent";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { checkAICredits, consumeAICredits } from "../middlewares/usageLimits.middleware";

const DEFAULT_AI_MODEL = process.env.AI_DEFAULT_MODEL || "gemini-2.5-flash";
const DEFAULT_OPENROUTER_MODEL = "openai/gpt-oss-120b:free";

export const AI_MODELS = {
	gemini: [
		"gemini-2.5-flash",
		"gemini-2.5-pro",
		"gemini-2.0-flash",
		"gemini-1.5-flash",
		"gemini-1.5-pro",
	],
	openrouter: [
		"openai/gpt-oss-120b:free",
		"openai/gpt-4o",
		"openai/gpt-4-turbo",
		"anthropic/claude-3.5-sonnet",
		"anthropic/claude-3-opus",
		"google/gemini-2.5-flash",
		"google/gemini-pro",
		"meta-llama/llama-3.3-70b-instruct",
		"deepseek/deepseek-chat",
		"mistralai/mistral-large",
		"qwen/qwen-2.5-72b-instruct",
	],
};

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

async function getCachedAiResponse(
	requestId: string,
	prompt: string,
	systemPrompt?: string | null,
): Promise<Record<string, unknown> | null> {
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

async function saveCachedAiResponse(
	requestId: string,
	prompt: string,
	systemPrompt: string | undefined,
	result: unknown,
): Promise<void> {
	await pool.query(
		`INSERT INTO ai_request_cache (request_id, response_body)
		 VALUES ($1, $2::jsonb)
		 ON CONFLICT (request_id) DO UPDATE SET response_body = EXCLUDED.response_body`,
		[requestId, JSON.stringify({ prompt, systemPrompt, result })],
	);
}

/**
 * GET /api/ai/models
 * Lista los modelos disponibles para cada proveedor.
 */
router.get("/models", isAuthenticated, async (_req, res) => {
	res.json(AI_MODELS);
});

/**
 * POST /api/ai/completions
 * Cuerpo:
 *   {
 *     provider: "gemini" | "openrouter",
 *     prompt: string,
 *     model?: string,
 *     systemPrompt?: string,
 *     requestId?: string   // opcional, para cache/idempotencia
 *   }
 */
router.post("/completions", isAuthenticated, checkAICredits, async (req, res) => {
	const { provider, prompt, model, systemPrompt } = req.body;

	if (!prompt) {
		res.status(400).json({ error: "Falta el prompt" });
		return;
	}

	const rawRequestId = req.body?.requestId ?? req.body?.request_id;
	const requestId =
		typeof rawRequestId === "string" && rawRequestId.trim() ? rawRequestId.trim() : null;

	const normalizedProvider =
		typeof provider === "string" && provider.trim()
			? provider.trim().toLowerCase()
			: "gemini";

	const useCustomToken = (req as any).useCustomToken;
	const customToken = (req as any).customToken;

	// Cache / idempotencia (mismo requestId + prompt + systemPrompt)
	if (requestId) {
		try {
			const cachedResult = await getCachedAiResponse(requestId, prompt, systemPrompt);
			if (cachedResult) {
				console.log("⚡ [ai] Respuesta servida desde ai_request_cache:", requestId);
				res.json({
					...cachedResult,
					billing: {
						used_custom_token: Boolean(useCustomToken),
						credits_consumed: 0,
						cached: true,
					},
					provider: normalizedProvider,
				});
				return;
			}
		} catch (cacheErr) {
			console.error("⚠️ [ai] No se pudo leer ai_request_cache:", cacheErr);
		}
	}

	try {
		const result =
			normalizedProvider === "openrouter"
				? await openRouterAgent({
						prompt,
						model: model || DEFAULT_OPENROUTER_MODEL,
						systemPrompt,
						customToken: useCustomToken ? customToken : undefined,
				  })
				: await geminiAgent({
						prompt,
						forse_text_response: true,
						model: model || DEFAULT_AI_MODEL,
						systemPrompt,
						customToken: useCustomToken ? customToken : undefined,
				  });

		if (requestId) {
			try {
				await saveCachedAiResponse(requestId, prompt, systemPrompt, result);
			} catch (cacheErr) {
				console.error("⚠️ [ai] No se pudo guardar en ai_request_cache:", cacheErr);
			}
		}

		if (!useCustomToken) {
			await consumeAICredits(req, res, () => {
				res.json({
					...result,
					billing: {
						used_custom_token: false,
						credits_consumed: 1,
					},
					provider: normalizedProvider,
					model: result.metadata?.model || model || null,
				});
			});
		} else {
			res.json({
				...result,
				billing: {
					used_custom_token: true,
					credits_consumed: 0,
				},
				provider: normalizedProvider,
				model: result.metadata?.model || model || null,
			});
		}
	} catch (err) {
		console.error(`❌ [ai] Error en el agente (${normalizedProvider}):`, err);
		res.status(500).json({
			error: `Error interno del agente ${normalizedProvider}`,
			details: extractErrorMessage(err),
		});
	}
});

export default router;