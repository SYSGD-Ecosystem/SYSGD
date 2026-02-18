import express from "express";
import { geminiAgent, analyzeRequest } from "../geminiAgent";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { checkAICredits, consumeAICredits } from "../middlewares/usageLimits.middleware";

const router = express.Router();

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
      model: model || "gemini-2.5-flash",
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
      details: err instanceof Error ? err.message : "Error desconocido",
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