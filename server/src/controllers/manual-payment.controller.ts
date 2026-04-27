import type { Request, Response } from "express";
import { getCurrentUserData } from "./users";
import {
	createManualPaymentOrder,
	getManualPaymentInstructions,
	getManualPaymentProducts,
	listAllManualPaymentOrders,
	listUserManualPaymentOrders,
	reviewManualPaymentOrder,
} from "../services/manual-payment.service";
import type {
	CreateManualPaymentOrderInput,
	ReviewManualPaymentOrderInput,
} from "../types/manualPayment";

export const getManualPaymentCatalog = (_req: Request, res: Response) => {
	res.json({
		instructions: getManualPaymentInstructions(),
		products: getManualPaymentProducts(),
	});
};

export const getCurrentUserManualPaymentOrders = async (
	req: Request,
	res: Response,
) => {
	const user = getCurrentUserData(req);
	if (!user) {
		res.status(401).json({ error: "No autorizado" });
		return;
	}

	try {
		const orders = await listUserManualPaymentOrders(user.id);
		res.json({ orders });
	} catch (error) {
		console.error("Error al obtener compras manuales:", error);
		res.status(500).json({ error: "Error al obtener compras manuales" });
	}
};

export const createCurrentUserManualPaymentOrder = async (
	req: Request,
	res: Response,
) => {
	const user = getCurrentUserData(req);
	if (!user) {
		res.status(401).json({ error: "No autorizado" });
		return;
	}

	try {
		const payload = req.body as CreateManualPaymentOrderInput;
		const order = await createManualPaymentOrder(user.id, payload);
		res.status(201).json({ order });
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: "No se pudo registrar la compra manual";
		res.status(400).json({ error: message });
	}
};

export const getAdminManualPaymentOrders = async (req: Request, res: Response) => {
	const user = getCurrentUserData(req);
	if (!user || user.privileges !== "admin") {
		res.status(403).json({ error: "No autorizado" });
		return;
	}

	try {
		const orders = await listAllManualPaymentOrders();
		res.json({ orders });
	} catch (error) {
		console.error("Error al obtener compras manuales para admin:", error);
		res.status(500).json({ error: "Error al obtener compras manuales" });
	}
};

export const reviewAdminManualPaymentOrder = async (req: Request, res: Response) => {
	const user = getCurrentUserData(req);
	const orderIdParam = req.params.id;
	const orderId = Array.isArray(orderIdParam) ? orderIdParam[0] : orderIdParam;
	if (!user || user.privileges !== "admin") {
		res.status(403).json({ error: "No autorizado" });
		return;
	}

	if (!orderId) {
		res.status(400).json({ error: "ID de compra invalido" });
		return;
	}

	try {
		const payload = req.body as ReviewManualPaymentOrderInput;
		const order = await reviewManualPaymentOrder(orderId, user.id, payload);
		res.json({ order });
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "No se pudo revisar la compra";
		const statusCode =
			message === "Compra manual no encontrada"
				? 404
				: message === "Esta compra ya fue revisada"
					? 409
					: 400;
		res.status(statusCode).json({ error: message });
	}
};
