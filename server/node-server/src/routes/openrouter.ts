// routes/openrouter.ts
import express from "express";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { openRouterAgent } from "../openRouterAgent";

const router = express.Router();

router.post("/", isAuthenticated, async (req, res) => {
  console.log('Nueva petición a OpenRouter Agent:', req.body);

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Falta el prompt" });
  }

  try {
    const result = await openRouterAgent({ prompt, model: "openai/gpt-oss-120b:free",  });
    res.json(result);
  } catch (err) {
    console.error("Error en OpenRouter Agent:", err);
    res.status(500).json({
      error: "Error interno del agente OpenRouter",
      details: err instanceof Error ? err.message : "Error desconocido",
    });
  }
});

export default router;