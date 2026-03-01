import { Router } from "express";
import { NotificationsController } from "../controllers/notifications.controller";

const router = Router();

// Sistema de notificaciones - envío de informes diarios desde flujos externos (ej: n8n)
// Actualmente público para facilitar debugging e integración.
// FUTURO: Proteger con autenticación de administrador (isAuthenticated + isAdmin).
router.post("/notifications/daily-report", NotificationsController.sendDailyReport);

export default router;

