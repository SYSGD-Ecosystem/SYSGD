import type { Request, Response } from "express";
import { getCurrentUserData } from "./users";
import {
	TimeEntriesService,
	TimeEntriesServiceError,
	type CreateTimeEntryInput,
	type ListTimeEntriesInput,
	type StartTimeEntryInput,
	type UpdateTimeEntryInput,
} from "../services/time-entries.service";

const getAuthenticatedUserId = (req: Request, res: Response) => {
	const user = getCurrentUserData(req);
	if (!user?.id) {
		res.status(401).json({ error: "Usuario no autenticado" });
		return null;
	}
	return String(user.id);
};

const handleServiceError = (
	error: unknown,
	res: Response,
	fallbackMessage: string,
) => {
	if (error instanceof TimeEntriesServiceError) {
		res.status(error.status).json(error.payload);
		return;
	}

	console.error(fallbackMessage, error);
	res.status(500).json({ error: fallbackMessage });
};

export class TimeEntriesController {
	public static async create(req: Request, res: Response) {
		const userId = getAuthenticatedUserId(req, res);
		if (!userId) return;

		try {
			const entry = await TimeEntriesService.create(
				userId,
				req.body as CreateTimeEntryInput,
			);
			res.status(201).json(entry);
		} catch (error) {
			handleServiceError(error, res, "Error al crear registro manual de tiempo");
		}
	}

	public static async start(req: Request, res: Response) {
		const userId = getAuthenticatedUserId(req, res);
		if (!userId) return;

		try {
			const entry = await TimeEntriesService.start(
				userId,
				req.body as StartTimeEntryInput,
			);
			res.status(201).json(entry);
		} catch (error) {
			handleServiceError(error, res, "Error al iniciar registro de tiempo");
		}
	}

	public static async update(req: Request, res: Response) {
		const userId = getAuthenticatedUserId(req, res);
		if (!userId) return;

		try {
			const entry = await TimeEntriesService.update(
				userId,
				String(req.params.id),
				req.body as UpdateTimeEntryInput,
			);
			res.json(entry);
		} catch (error) {
			handleServiceError(error, res, "Error al actualizar registro de tiempo");
		}
	}

	public static async pause(req: Request, res: Response) {
		const userId = getAuthenticatedUserId(req, res);
		if (!userId) return;

		try {
			const entry = await TimeEntriesService.pause(userId, String(req.params.id));
			res.json(entry);
		} catch (error) {
			handleServiceError(error, res, "Error al pausar registro de tiempo");
		}
	}

	public static async resume(req: Request, res: Response) {
		const userId = getAuthenticatedUserId(req, res);
		if (!userId) return;

		try {
			const entry = await TimeEntriesService.resume(userId, String(req.params.id));
			res.json(entry);
		} catch (error) {
			handleServiceError(error, res, "Error al reanudar registro de tiempo");
		}
	}

	public static async stop(req: Request, res: Response) {
		const userId = getAuthenticatedUserId(req, res);
		if (!userId) return;

		try {
			const entry = await TimeEntriesService.stop(userId, String(req.params.id));
			res.json(entry);
		} catch (error) {
			handleServiceError(error, res, "Error al finalizar registro de tiempo");
		}
	}

	public static async list(req: Request, res: Response) {
		const userId = getAuthenticatedUserId(req, res);
		if (!userId) return;

		try {
			const entries = await TimeEntriesService.list(
				userId,
				req.query as ListTimeEntriesInput,
			);
			res.json(entries);
		} catch (error) {
			handleServiceError(error, res, "Error al obtener registros de tiempo");
		}
	}

	public static async remove(req: Request, res: Response) {
		const userId = getAuthenticatedUserId(req, res);
		if (!userId) return;

		try {
			await TimeEntriesService.remove(userId, String(req.params.id));
			res.status(204).send();
		} catch (error) {
			handleServiceError(error, res, "Error al eliminar registro de tiempo");
		}
	}
}
