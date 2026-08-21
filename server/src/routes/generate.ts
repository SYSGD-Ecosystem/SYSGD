import express from "express";
import { pool } from "../db";
import { geminiAgent, analyzeRequest } from "../geminiAgent";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { checkAICredits, consumeAICredits } from "../middlewares/usageLimits.middleware";

const router = express.Router();

/**
 * Modelo por defecto configurable por entorno.
 * Si Google retira gemini-2.5-flash basta con definir AI_DEFAULT_MODEL
 * en las variables de entorno sin tocar código.
 */
const DEFAULT_AI_MODEL = process.env.AI_DEFAULT_MODEL || "gemini-2.5-flash";

interface CachedAiPayload {
	prompt: string;
	result: Record<string, unknown>;
}

/**
 * Extrae un mensaje legible de cualquier tipo de error (Error, string,
 * objeto con message, respuesta HTTP, etc.) para no perder la causa del fallo.
 */
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

/**
 * Busca en ai_request_cache una respuesta previa para el mismo requestId.
 * Solo se considera válida si el prompt almacenado coincide con el actual.
 */
async function getCachedAiResponse(requestId: string, prompt: string): Promise<Record<string, unknown> | null> {
	const { rows } = await pool.query<{ response_body: CachedAiPayload | null }>(
		"SELECT response_body FROM ai_request_cache WHERE request_id = $1",
		[requestId],
	);

	const body = rows[0]?.response_body;
	if (!body || typeof body !== "object" || !body.result) return null;
	if (body.prompt !== prompt) return null;

	return body.result;
}

/**
 * Guarda temporalmente la respuesta asociada al requestId del cliente.
 * La tabla se autolimpia con el trigger clean_old_ai_requests (>24h).
 */
async function saveCachedAiResponse(
	requestId: string,
	prompt: string,
	result: unknown,
): Promise<void> {
	await pool.query(
		`INSERT INTO ai_request_cache (request_id, response_body)
		 VALUES ($1, $2::jsonb)
		 ON CONFLICT (request_id) DO UPDATE SET response_body = EXCLUDED.response_body`,
		[requestId, JSON.stringify({ prompt, result })],
	);
}

/**
 * Endpoint principal del agente Gemini
 * 1. Verifica autenticación
 * 2. Verifica créditos o token custom
 * 3. Procesa la petición
 * 4. Consume créditos si fue exitosa y no usó token custom
 */
router.post("/", isAuthenticated, checkAICredits, async (req, res) => {
  console.log("🔄 Nueva petición a Gemini Agent:", req.body);

  const { prompt, image, audio, video, file, model } = req.body;

  if (!prompt) {
    res.status(400).json({ error: "Falta el prompt" });
    return;
  }

  try {
    // Obtener el token custom si está usando token custom
    const useCustomToken = (req as any).useCustomToken;
    const customToken = (req as any).customToken;

    // Usar el nuevo agente inteligente
    const result = await geminiAgent({
      prompt,
      image: image || undefined,
      audio: audio || undefined,
      video: video || undefined,
      file: file || undefined,
      model: model || DEFAULT_AI_MODEL,
      customToken: useCustomToken ? customToken : undefined
    });

    console.log("✅ Respuesta generada exitosamente");
    
    // Si la operación fue exitosa, consumir créditos
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
    console.error("❌ Error en Gemini Agent:", err);
    res.status(500).json({
      error: "Error interno del agente",
      details: extractErrorMessage(err),
    });
  }
});


router.post("/text", isAuthenticated, checkAICredits, async (req, res) => {

  // El cliente puede enviar requestId (o request_id) para deduplicar peticiones.
  // Si no se envía id, no hay caché y siempre se consulta a la IA.
  const rawRequestId = req.body?.requestId ?? req.body?.request_id;
  const requestId =
    typeof rawRequestId === "string" && rawRequestId.trim() ? rawRequestId.trim() : null;

  const { prompt, model } = req.body;

  if (!prompt) {
    res.status(400).json({ error: "Falta el prompt" });
    return;
  }

  const useCustomToken = (req as any).useCustomToken;
  const customToken = (req as any).customToken;

  // Consultar si ya existe una respuesta guardada para este id + prompt.
  // Un acierto de caché no vuelve a consumir créditos ni llama a la IA.
  if (requestId) {
    try {
      const cachedResult = await getCachedAiResponse(requestId, prompt);
      if (cachedResult) {
        console.log("⚡ Respuesta servida desde ai_request_cache:", requestId);
        res.json({
          ...cachedResult,
          billing: {
            used_custom_token: Boolean(useCustomToken),
            credits_consumed: 0,
            cached: true,
          },
        });
        return;
      }
    } catch (cacheErr) {
      // Un fallo de caché no debe interrumpir la petición
      console.error("⚠️ No se pudo leer ai_request_cache:", cacheErr);
    }
  }

  try {
    const result = await geminiAgent({
      prompt,
      forse_text_response: true,
      model: model || DEFAULT_AI_MODEL,
      customToken: useCustomToken ? customToken : undefined
    });

    // Guardar la respuesta de forma temporal asociada al id enviado por el cliente
    if (requestId) {
      try {
        await saveCachedAiResponse(requestId, prompt, result);
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
    console.error("❌ Error en Gemini Agent:", err);
    res.status(500).json({
      error: "Error interno del agente",
      details: extractErrorMessage(err),
    });
  }
});


/**
 * Endpoint de análisis para debugging
 * Permite analizar un prompt sin consumir créditos
 */
router.post("/analyze", isAuthenticated, async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    res.status(400).json({ error: "Falta el prompt" });
    return;
  }

  try {
    const analysis = await analyzeRequest(prompt);

    res.json({
      analysis,
      prompt,
    });
  } catch (err) {
    console.error("Error analizando:", err);
    res.status(500).json({ error: "Error en análisis" });
  }
});

export default router;
