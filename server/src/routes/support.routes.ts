import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { isAdmin } from "../middlewares/auth";
import { checkAICredits } from "../middlewares/usageLimits.middleware";
import { SupportTicketsController } from "../controllers/support-tickets.controller";

const router = Router();

/**
 * @openapi
 * /api/admin/support/generate:
 *   post:
 *     tags: [Admin Support]
 *     summary: Mejora un mensaje de soporte con IA antes de enviarlo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *               subject:
 *                 type: string
 *               provider:
 *                 type: string
 *                 enum: [gemini, openrouter]
 *               model:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Texto mejorado
 */
router.post(
	"/generate",
	isAuthenticated,
	isAdmin,
	checkAICredits,
	SupportTicketsController.generate,
);

/**
 * @openapi
 * /api/admin/support/tickets:
 *   post:
 *     tags: [Admin Support]
 *     summary: Abre un ticket de soporte y envia el correo al destinatario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, subject, message]
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       "201":
 *         description: Ticket creado
 *   get:
 *     tags: [Admin Support]
 *     summary: Lista los tickets de soporte con paginacion y busqueda
 *     responses:
 *       "200":
 *         description: Pagina de tickets
 */
router.post("/tickets", isAuthenticated, isAdmin, SupportTicketsController.create);
router.get("/tickets", isAuthenticated, isAdmin, SupportTicketsController.list);

/**
 * @openapi
 * /api/admin/support/tickets/{id}/status:
 *   patch:
 *     tags: [Admin Support]
 *     summary: Cambia el estado de un ticket (abierto/cerrado)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [open, closed]
 *     responses:
 *       "200":
 *         description: Ticket actualizado
 */
router.patch(
	"/tickets/:id/status",
	isAuthenticated,
	isAdmin,
	SupportTicketsController.updateStatus,
);

export default router;
