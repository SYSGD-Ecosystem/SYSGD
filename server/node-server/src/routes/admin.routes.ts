import { Router, Request, Response } from "express";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { isAdmin } from "../middlewares/auth";
import { getAllMetrics } from "../services/admin-metrics.service";

const router = Router();

router.get(
  "/metrics",
  isAuthenticated,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const metrics = await getAllMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching admin metrics:", error);
      res.status(500).json({ error: "Error al obtener métricas del administrador" });
    }
  }
);

export default router;
