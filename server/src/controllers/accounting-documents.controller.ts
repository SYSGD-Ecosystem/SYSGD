import type { Request, Response } from "express";
import { z } from "zod";
import { getCurrentUserData } from "./users";
import {
	consumePdfGenerationCredit,
	createAccountingDocument,
	getUserAvailableCredits,
	getAccountingDocumentById,
	listAccountingDocumentsByUser,
	updateAccountingDocumentPayload,
	userHasAccountingAccess,
} from "../services/accounting-documents.service";
import { buildTcpPdfBuffer } from "../services/accounting-pdf.service";

const monthEntrySchema = z.object({
	dia: z.string(),
	importe: z.string(),
});

const monthEntriesSchema = z.object({
	ENE: z.array(monthEntrySchema),
	FEB: z.array(monthEntrySchema),
	MAR: z.array(monthEntrySchema),
	ABR: z.array(monthEntrySchema),
	MAY: z.array(monthEntrySchema),
	JUN: z.array(monthEntrySchema),
	JUL: z.array(monthEntrySchema),
	AGO: z.array(monthEntrySchema),
	SEP: z.array(monthEntrySchema),
	OCT: z.array(monthEntrySchema),
	NOV: z.array(monthEntrySchema),
	DIC: z.array(monthEntrySchema),
});

const tcpPayloadSchema = z.object({
	generalData: z.object({
		anio: z.string(),
		nombre: z.string(),
		nit: z.string(),
		fiscalCalle: z.string(),
		fiscalMunicipio: z.string(),
		fiscalProvincia: z.string(),
		legalCalle: z.string(),
		legalMunicipio: z.string(),
		legalProvincia: z.string(),
		actividad: z.string(),
		codigo: z.string(),
		firmaDia: z.string(),
		firmaMes: z.string(),
		firmaAnio: z.string(),
	}),
	ingresos: monthEntriesSchema,
	gastos: monthEntriesSchema,
	tributos: z.array(
		z.object({
			mes: z.string(),
			b: z.string(),
			c: z.string(),
			d: z.string(),
			e: z.string(),
			f: z.string(),
			h: z.string(),
			i: z.string(),
			j: z.string(),
			l: z.string(),
			m: z.string(),
			n: z.string(),
			o: z.string(),
			p: z.string(),
		}),
	),
});

export const listAccountingDocuments = async (req: Request, res: Response) => {
	const user = getCurrentUserData(req);
	if (!user?.id) {
		res.status(401).json({ error: "Usuario no autenticado" });
		return;
	}

	if (!(await userHasAccountingAccess(user.id))) {
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

	if (!(await userHasAccountingAccess(user.id))) {
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

	if (!(await userHasAccountingAccess(user.id))) {
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

	if (!(await userHasAccountingAccess(user.id))) {
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

export const generateTcpPdfController = async (req: Request, res: Response) => {
	const user = getCurrentUserData(req);
	if (!user?.id) {
		res.status(401).json({ error: "Usuario no autenticado" });
		return;
	}

	const incomingPayload =
		typeof req.body === "object" && req.body !== null && "payload" in req.body
			? (req.body as { payload?: unknown }).payload
			: req.body;
	const parsedPayload = tcpPayloadSchema.safeParse(incomingPayload);

	if (!parsedPayload.success) {
		res.status(400).json({
			error: "Payload inválido para generar PDF TCP",
			details: parsedPayload.error.issues.map((issue) => ({
				path: issue.path.join("."),
				message: issue.message,
			})),
		});
		return;
	}

	try {
		const creditsBefore = await getUserAvailableCredits(user.id);
		if (creditsBefore < 1) {
			res.status(402).json({
				error: "Créditos insuficientes",
				message: "No tienes créditos disponibles para generar el PDF",
				credits: { available: creditsBefore },
			});
			return;
		}

		const pdfBuffer = await buildTcpPdfBuffer(parsedPayload.data);
		const consumed = await consumePdfGenerationCredit(user.id);

		if (!consumed.consumed) {
			res.status(402).json({
				error: "Créditos insuficientes",
				message: "No tienes créditos disponibles para generar el PDF",
				credits: { available: consumed.remainingCredits },
			});
			return;
		}

		const safeYear = /^\d{4}$/.test(parsedPayload.data.generalData.anio)
			? parsedPayload.data.generalData.anio
			: new Date().getFullYear().toString();
		const filename = `Registro_TCP_${safeYear}.pdf`;

		res.setHeader("Content-Type", "application/pdf");
		res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
		res.setHeader("X-Credits-Consumed", "1");
		res.setHeader("X-Credits-Remaining", String(consumed.remainingCredits));
		res.status(200).send(pdfBuffer);
	} catch (error) {
		if (
			error instanceof Error &&
			(error.message.includes("Cannot find module 'pdfmake'") ||
				error.message.includes("Cannot find module"))
		) {
			res.status(500).json({
				error: "Dependencia de PDF no instalada en el servidor",
				message: "Instala pdfmake en server/node-server para habilitar esta función",
			});
			return;
		}

		console.error("Error al generar PDF TCP:", error);
		res.status(500).json({ error: "Error al generar el PDF TCP" });
	}
};
