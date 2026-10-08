import { Router, Request, Response } from "express";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { isAdmin } from "../middlewares/auth";
import {
  getAdminAnalytics,
  getAllMetrics,
  isValidAnalyticsPeriod,
} from "../services/admin-metrics.service";
import { listAdminUsersPage } from "../services/admin-users.service";
import { getMonthlyRevenue } from "../services/admin-revenue.service";
import { getAnomalySignals } from "../services/admin-anomalies.service";

const router = Router();

router.get(
  "/users",
  isAuthenticated,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const page = await listAdminUsersPage({
        page: req.query.page,
        pageSize: req.query.pageSize,
        q: req.query.q,
        segment: req.query.segment,
      });
      res.json(page);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ error: "Error al obtener los usuarios" });
    }
  }
);

router.get(
  "/revenue/monthly",
  isAuthenticated,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const revenue = await getMonthlyRevenue({ months: req.query.months });
      res.json(revenue);
    } catch (error) {
      console.error("Error fetching monthly revenue:", error);
      res.status(500).json({ error: "Error al obtener los ingresos mensuales" });
    }
  }
);

router.get(
  "/anomalies",
  isAuthenticated,
  isAdmin,
  async (_req: Request, res: Response) => {
    try {
      const report = await getAnomalySignals();
      res.json(report);
    } catch (error) {
      console.error("Error fetching anomaly signals:", error);
      res.status(500).json({ error: "Error al obtener las señales de riesgo" });
    }
  }
);

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
