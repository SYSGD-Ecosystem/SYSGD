import type { Request, Response } from "express";
import { getCurrentUserData } from "./users";
import { consumeAICredits } from "../middlewares/usageLimits.middleware";
import {
	SupportTicketsService,
	SupportTicketsServiceError,
	type CreateSupportTicketInput,
	type ListSupportTicketsInput,
} from "../services/support-tickets.service";

type AiRequest = Request & {
	useCustomToken?: boolean;
	customToken?: string;
};

const handleServiceError = (error: unknown, res: Response, fallbackMessage: string) => {
	if (error instanceof SupportTicketsServiceError) {
		res.status(error.status).json(error.payload);
		return;
	}

	console.error(fallbackMessage, error);
	res.status(500).json({ error: fallbackMessage });
};

export class SupportTicketsController {
	public static async create(req: Request, res: Response) {
		const admin = getCurrentUserData(req);
		if (!admin?.id) {
			res.status(401).json({ error: "Usuario no autenticado" });
			return;
		}

		try {
			const ticket = await SupportTicketsService.create(
				req.body as CreateSupportTicketInput,
				admin.id,
			);
			res.status(201).json(ticket);
		} catch (error) {
			handleServiceError(error, res, "Error al abrir el ticket de soporte");
		}
	}

	public static async list(req: Request, res: Response) {
		try {
			const page = await SupportTicketsService.list(req.query as ListSupportTicketsInput);
			res.json(page);
		} catch (error) {
			handleServiceError(error, res, "Error al obtener los tickets de soporte");
		}
	}

	public static async updateStatus(req: Request, res: Response) {
		try {
			const ticket = await SupportTicketsService.updateStatus(
				String(req.params.id),
				req.body?.status,
			);
			res.json(ticket);
		} catch (error) {
			handleServiceError(error, res, "Error al actualizar el ticket de soporte");
		}
	}

	public static async generate(req: Request, res: Response) {
		const body = req.body as {
			message?: unknown;
			subject?: unknown;
			provider?: unknown;
			model?: unknown;
		};

		const message = typeof body.message === "string" ? body.message.trim() : "";
		if (message.length < 10 || message.length > 5000) {
			res.status(400).json({ error: "El mensaje debe tener entre 10 y 5000 caracteres" });
			return;
		}

		const aiReq = req as AiRequest;
		const useCustomToken = aiReq.useCustomToken === true;

		try {
			const result = await SupportTicketsService.improveMessage({
				message,
				subject: typeof body.subject === "string" ? body.subject : "",
				provider: body.provider,
				model: body.model,
				customToken: useCustomToken ? aiReq.customToken : undefined,
			});

			if (!useCustomToken) {
				await consumeAICredits(req, res, () => {
					res.json({
						...result,
						billing: { used_custom_token: false, credits_consumed: 1 },
					});
				});
				return;
			}

			res.json({
				...result,
				billing: { used_custom_token: true, credits_consumed: 0 },
			});
		} catch (error) {
			console.error("Error mejorando mensaje de soporte con IA:", error);
			res.status(500).json({
				error: "Error interno del agente",
				details: error instanceof Error ? error.message : "Error desconocido",
			});
		}
	}
}
