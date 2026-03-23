import { Router, Request, Response } from "express";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { isAdmin } from "../middlewares/auth";
import {
  getAdminAnalytics,
  getAllMetrics,
  isValidAnalyticsPeriod,
} from "../services/admin-metrics.service";

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

router.get(
  "/analytics",
  isAuthenticated,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const periodParam = typeof req.query.period === "string" ? req.query.period : "month";
      const period = isValidAnalyticsPeriod(periodParam) ? periodParam : "month";
      const anchorDate =
        typeof req.query.anchor === "string" && req.query.anchor.trim()
          ? req.query.anchor.trim()
          : undefined;
      const analytics = await getAdminAnalytics(period, anchorDate);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching admin analytics:", error);
      res.status(500).json({ error: "Error al obtener analíticas del administrador" });
    }
  }
);

export default router;
