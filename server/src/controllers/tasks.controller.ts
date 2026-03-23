import type { Request, Response } from "express";
import { getCurrentUserData } from "./users";
import { consumeAICredits } from "../middlewares/usageLimits.middleware";
import { geminiAgent } from "../geminiAgent";
import { openRouterAgent } from "../openRouterAgent";
import {
	TasksService,
	TasksServiceError,
	type CreateTaskInput,
	type GenerateTaskInput,
	type UpdateTaskInput,
} from "../services/tasks.service";

const handleServiceError = (
	error: unknown,
	res: Response,
	fallbackMessage: string,
) => {
	if (error instanceof TasksServiceError) {
		res.status(error.status).json(error.payload);
		return;
	}

	console.error(fallbackMessage, error);
	res.status(500).json({ error: fallbackMessage });
};

export class TasksController {
	public static async getByProject(req: Request, res: Response) {
		try {
			const tasks = await TasksService.getTasksByProject(String(req.params.project_id));
			res.status(200).json(tasks);
		} catch (error) {
			handleServiceError(error, res, "Error getting tasks");
		}
	}

	public static async create(req: Request, res: Response) {
		const user = getCurrentUserData(req);
		const createdBy = user?.id ? String(user.id) : null;

		if (!createdBy) {
			res.status(400).json({ error: "Missing required fields" });
			return;
		}

		try {
			const task = await TasksService.createTask(
				createdBy,
				req.body as CreateTaskInput,
			);
			res.status(201).json(task);
		} catch (error) {
			handleServiceError(error, res, "Error creating task");
		}
	}

	public static async update(req: Request, res: Response) {
		try {
			const task = await TasksService.updateTask(
				String(req.params.taskId),
				req.body as UpdateTaskInput,
			);
			res.status(200).json(task);
		} catch (error) {
			handleServiceError(error, res, "Error al actualizar la tarea");
		}
	}

	public static async remove(req: Request, res: Response) {
		const user = getCurrentUserData(req);
		if (!user?.id) {
			res.status(401).json({ error: "Usuario no autenticado" });
			return;
		}

		try {
			await TasksService.deleteTask(
				String(req.params.taskId),
				String(user.id),
				user.privileges,
			);
			res.status(200).json({ message: "Tarea eliminada correctamente" });
		} catch (error) {
			handleServiceError(error, res, "Error al eliminar la tarea");
		}
	}

	public static async generate(req: Request, res: Response) {
		console.log("🔄 Nueva petición a Task Agent:", req.body);
		const { prompt, provider, model } = req.body as GenerateTaskInput;

		if (!prompt) {
			res.status(400).json({ error: "Falta el prompt" });
			return;
		}

		try {
			const useCustomToken = (
				req as unknown as { useCustomToken?: boolean; customToken?: string }
			).useCustomToken;
			const customToken = (
				req as unknown as { useCustomToken?: boolean; customToken?: string }
			).customToken;

			const systemPrompt = `Eres un asistente inteligente especializado en ayudar a mejorar títulos y descripciones de tareas para equipos de desarrollo de software. Tu objetivo es clarificar, profesionalizar y optimizar la redacción para que sea fácilmente entendible por todos los miembros del equipo.`;

			const result =
				provider === "gemini"
					? await geminiAgent({
							prompt,
							image: undefined,
							audio: undefined,
							video: undefined,
							file: undefined,
							model: model || "gemini-2.5-flash",
							customToken: useCustomToken ? customToken : undefined,
							forse_text_response: true,
						})
					: await openRouterAgent({
							prompt,
							model,
							customToken,
							systemPrompt,
							force_text_response: true,
						});

			console.log("✅ Respuesta generada exitosamente");

			if (!useCustomToken) {
				await consumeAICredits(req, res, () => {
					res.json({
						...result,
						billing: {
							used_custom_token: false,
							credits_consumed: 1,
						},
					});
				});
				return;
			}

			res.json({
				...result,
				billing: {
					used_custom_token: true,
					credits_consumed: 0,
				},
			});
		} catch (err) {
			console.error("❌ Error en Task Agent:", err);
			res.status(500).json({
				error: "Error interno del agente",
				details: err instanceof Error ? err.message : "Error desconocido",
			});
		}
	}
}
