import express from "express";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { gemaAgent } from "../gemaAgent";

const router = express.Router();

router.post("/", isAuthenticated, async (req, res) => {
    console.log('🔄 Nueva petición a Gema Agent:', req.body);

    const { prompt, image, audio, video, file } = req.body;

    if (!prompt) {
        res.status(400).json({ error: "Falta el prompt" });
        return;
    }

    try {
        // Usar el nuevo agente inteligente
        const result = await gemaAgent({
            prompt
        });

        console.log('✅ Respuesta generada exitosamente');
        res.json(result);

    } catch (err) {
        console.error("❌ Error en Gema Agent:", err);
        res.status(500).json({
            error: "Error interno del agente",
            details: err instanceof Error ? err.message : 'Error desconocido'
        });
    }
});

export default router;
