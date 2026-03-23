import type { Request, Response } from "express";
import { pool } from "../db";
import { EmailService } from "../services/emailService";

export class NotificationsController {
	static async sendDailyReport(req: Request, res: Response) {
		const { to, html, subject } = req.body as {
			to?: string;
			html?: string;
			subject?: string;
		};

		if (!to || typeof to !== "string") {
			res.status(400).json({ error: "Campo 'to' (email destino) es requerido" });
			return;
		}

		if (!html || typeof html !== "string") {
			res.status(400).json({ error: "Campo 'html' es requerido" });
			return;
		}

		const finalSubject =
			typeof subject === "string" && subject.trim().length > 0
				? subject.trim()
				: "Informe diario de uso de la plataforma";

		try {
			const sent = await EmailService.sendEmail({
				to,
				subject: finalSubject,
				html,
			});

			// Registrar en tabla de notificaciones de email (sin asociar a usuario concreto)
			await pool.query(
				`INSERT INTO email_notifications (
          user_id,
          recipient_email,
          subject,
          type,
          status,
          sent_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW())`,
				[null, to, finalSubject, "daily_usage_report", sent ? "sent" : "failed"],
			);

			if (!sent) {
				res.status(500).json({ error: "No se pudo enviar el email" });
				return;
			}

			res.status(201).json({
				message: "Informe diario enviado correctamente",
				to,
				subject: finalSubject,
			});
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error("Error sending daily usage report:", error);
			res.status(500).json({ error: "Error al enviar el informe diario" });
		}
	}
}

