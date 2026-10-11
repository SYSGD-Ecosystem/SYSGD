import type { Request, Response } from "express";
import { z } from "zod";
import { getCurrentUserData } from "./users";
import {
	createApklisClaimOrder,
	getApklisClaimProducts,
	listAllApklisClaimOrders,
	listUserApklisClaimOrders,
	reviewApklisClaimOrder,
} from "../services/apklis-claim.service";
import type { ReviewApklisClaimOrderInput } from "../types/apklisClaim";

const createApklisClaimSchema = z.object({
	productId: z.string().min(1).max(64),
	smsMessage: z.string().min(1).max(4000),
	apklisLicense: z.string().max(4096).optional(),
	apklisUsername: z.string().max(255).optional(),
});

const reviewApklisClaimSchema = z.object({
	status: z.enum(["approved", "rejected"]),
	reviewNotes: z.string().max(2000).optional(),
});

export const getApklisClaimCatalog = (_req: Request, res: Response) => {
	res.json({ products: getApklisClaimProducts() });
};

export const getCurrentUserApklisClaimOrders = async (
	req: Request,
	res: Response,
) => {
	const user = getCurrentUserData(req);
	if (!user) {
		res.status(401).json({ error: "No autorizado" });
		return;
	}

	try {
		const orders = await listUserApklisClaimOrders(user.id);
		res.json({ orders });
	} catch (error) {
		console.error("Error al obtener reclamos Apklis:", error);
		res.status(500).json({ error: "Error al obtener reclamos" });
	}
};

export const createCurrentUserApklisClaimOrder = async (
	req: Request,
	res: Response,
) => {
	const user = getCurrentUserData(req);
	if (!user) {
		res.status(401).json({ error: "No autorizado" });
		return;
	}

	const parsed = createApklisClaimSchema.safeParse(req.body);
	if (!parsed.success) {
		res.status(400).json({ error: "Datos del reclamo inválidos" });
		return;
	}

	try {
		const { order, alreadyClaimed } = await createApklisClaimOrder(
			user.id,
			parsed.data,
		);
		res.status(alreadyClaimed ? 200 : 201).json({ order, alreadyClaimed });
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "No se pudo registrar el reclamo";
		const statusCode =
			message === "Esta compra ya fue reclamada por otra cuenta" ? 409 : 400;
		res.status(statusCode).json({ error: message });
	}
};

export const getAdminApklisClaimOrders = async (
	req: Request,
	res: Response,
) => {
	const user = getCurrentUserData(req);
	if (!user || user.privileges !== "admin") {
		res.status(403).json({ error: "No autorizado" });
		return;
	}

	try {
		const orders = await listAllApklisClaimOrders();
		res.json({ orders });
	} catch (error) {
		console.error("Error al obtener reclamos Apklis para admin:", error);
		res.status(500).json({ error: "Error al obtener reclamos" });
	}
};

export const reviewAdminApklisClaimOrder = async (
	req: Request,
	res: Response,
) => {
	const user = getCurrentUserData(req);
	const orderIdParam = req.params.id;
	const orderId = Array.isArray(orderIdParam) ? orderIdParam[0] : orderIdParam;
	if (!user || user.privileges !== "admin") {
		res.status(403).json({ error: "No autorizado" });
		return;
	}

	if (!orderId) {
		res.status(400).json({ error: "ID de reclamo inválido" });
		return;
	}

	const parsed = reviewApklisClaimSchema.safeParse(req.body);
	if (!parsed.success) {
		res.status(400).json({ error: "Datos de revisión inválidos" });
		return;
	}

	try {
		const order = await reviewApklisClaimOrder(
			orderId,
			user.id,
			parsed.data as ReviewApklisClaimOrderInput,
		);
		res.json({ order });
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "No se pudo revisar el reclamo";
		const statusCode =
			message === "Reclamo no encontrado"
				? 404
				: message === "Este reclamo ya fue revisado"
					? 409
					: 400;
		res.status(statusCode).json({ error: message });
	}
};
