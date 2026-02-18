import type { Request, Response } from "express";
import { getCurrentUserData } from "./users";
import {
	canUseAccountingDocuments,
	createAccountingDocument,
	getAccountingDocumentById,
	listAccountingDocumentsByUser,
	updateAccountingDocumentPayload,
} from "../services/accounting-documents.service";

const getUserTier = (req: Request): string | undefined => {
	const user = getCurrentUserData(req);
	return user?.user_data?.billing?.tier;
};

const hasPremiumAccess = (req: Request): boolean =>
	canUseAccountingDocuments(getUserTier(req));

export const listAccountingDocuments = async (req: Request, res: Response) => {
	const user = getCurrentUserData(req);
	if (!user?.id) {
		res.status(401).json({ error: "Usuario no autenticado" });
		return;
	}

	if (!hasPremiumAccess(req)) {
		res.status(403).json({
			error: "Esta función está disponible solo para planes Pro y VIP",
		});
		return;
	}

	try {
		const documents = await listAccountingDocumentsByUser(user.id);
		res.status(200).json(documents);
	} catch (error) {
		console.error("Error al listar documentos contables:", error);
		res.status(500).json({ error: "Error al listar documentos contables" });
	}
};

export const createAccountingDocumentController = async (
	req: Request,
	res: Response,
) => {
	const user = getCurrentUserData(req);
	if (!user?.id) {
		res.status(401).json({ error: "Usuario no autenticado" });
		return;
	}

	if (!hasPremiumAccess(req)) {
		res.status(403).json({
			error: "Esta función está disponible solo para planes Pro y VIP",
		});
		return;
	}

	const { name } = req.body as { name?: string };
	if (!name?.trim()) {
		res.status(400).json({ error: "El nombre del documento es obligatorio" });
		return;
	}

	try {
		const document = await createAccountingDocument(user.id, name.trim(), {});
		res.status(201).json(document);
	} catch (error) {
		console.error("Error al crear documento contable:", error);
		res.status(500).json({ error: "Error al crear documento contable" });
	}
};

export const getAccountingDocumentController = async (
	req: Request,
	res: Response,
) => {
	const user = getCurrentUserData(req);
	if (!user?.id) {
		res.status(401).json({ error: "Usuario no autenticado" });
		return;
	}

	if (!hasPremiumAccess(req)) {
		res.status(403).json({
			error: "Esta función está disponible solo para planes Pro y VIP",
		});
		return;
	}

	const { id } = req.params;
	if (!id || typeof id !== "string") {
		res.status(400).json({ error: "Id inválido" });
		return;
	}

	try {
		const document = await getAccountingDocumentById(user.id, id);
		if (!document) {
			res.status(404).json({ error: "Documento no encontrado" });
			return;
		}
		res.status(200).json(document);
	} catch (error) {
		console.error("Error al obtener documento contable:", error);
		res.status(500).json({ error: "Error al obtener documento contable" });
	}
};

export const saveAccountingDocumentController = async (
	req: Request,
	res: Response,
) => {
	const user = getCurrentUserData(req);
	if (!user?.id) {
		res.status(401).json({ error: "Usuario no autenticado" });
		return;
	}

	if (!hasPremiumAccess(req)) {
		res.status(403).json({
			error: "Esta función está disponible solo para planes Pro y VIP",
		});
		return;
	}

	const { id } = req.params;
	const { payload } = req.body as { payload?: unknown };

	if (!id || typeof id !== "string" || typeof payload === "undefined" || payload === null) {
		res.status(400).json({ error: "Parámetros inválidos" });
		return;
	}

	if (typeof payload !== "object" || Array.isArray(payload)) {
		res.status(400).json({ error: "El payload debe ser un objeto JSON" });
		return;
	}

	try {
		const saved = await updateAccountingDocumentPayload(
			user.id,
			id,
			payload as Record<string, unknown>,
		);
		if (!saved) {
			res.status(404).json({ error: "Documento no encontrado" });
			return;
		}
		res.status(200).json({ message: "Documento guardado", updatedAt: saved.updatedAt });
	} catch (error) {
		console.error("Error al guardar documento contable:", error);
		res.status(500).json({ error: "Error al guardar documento contable" });
	}
};
