import express from "express";
import { generarRespuesta } from "../gemini";
import { isAuthenticated } from "../middlewares/auth";

const router = express.Router();

router.post("/", isAuthenticated, async (req, res) => {
	const { prompt } = req.body;

	if (!prompt) {
		res.status(400).json({ error: "Falta el prompt" });
		return;
	}

	try {
		const respuesta = await generarRespuesta(prompt);
		res.json({ respuesta });
	} catch (err) {
		console.error("Error al llamar a Gemini:", err);
		res.status(500).json({ error: "Error interno" });
	}
});

export default router;
