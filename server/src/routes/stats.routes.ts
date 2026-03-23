import { Router, type Request, type Response } from "express";
import { getDailyStats } from "../services/admin-metrics.service";

const router = Router();

// GET /api/stats/daily
// Público por ahora para facilitar la integración con n8n.
// En el futuro se puede proteger añadiendo middlewares de autenticación.
router.get("/stats/daily", async (req: Request, res: Response) => {
	try {
		const dateParam = typeof req.query.date === "string" ? req.query.date : undefined;
		const stats = await getDailyStats(dateParam);
		res.json(stats);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error fetching daily stats:", error);
		res.status(500).json({ error: "Error al obtener estadísticas diarias" });
	}
});

export default router;

