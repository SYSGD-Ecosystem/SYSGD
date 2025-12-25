import express from "express";
import { geminiAgent, analyzeRequest } from "../geminiAgent";
import { isAuthenticated } from "../middlewares/auth-jwt";

const router = express.Router();

router.post("/", isAuthenticated, async (req, res) => {
	console.log('🔄 Nueva petición a Gemini Agent:', req.body);

	const { prompt, image, audio, video, file } = req.body;

	if (!prompt) {
		res.status(400).json({ error: "Falta el prompt" });
		return;
	}

	try {
		// Usar el nuevo agente inteligente
		const result = await geminiAgent({
			prompt,
			image: image || undefined,
			audio: audio || undefined,
			video: video || undefined,
			file: file || undefined
		});

		console.log('✅ Respuesta generada exitosamente');
		res.json(result);

	} catch (err) {
		console.error("❌ Error en Gemini Agent:", err);
		res.status(500).json({
			error: "Error interno del agente",
			details: err instanceof Error ? err.message : 'Error desconocido'
		});
	}
});

// Endpoint de análisis para debugging
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
			prompt
		});

	} catch (err) {
		console.error("Error analizando:", err);
		res.status(500).json({ error: "Error en análisis" });
	}
});

export default router;
