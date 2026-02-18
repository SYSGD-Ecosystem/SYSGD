import type { Request, Response } from "express";
import {
	getContLedgerByUser,
	upsertContLedgerByUser,
} from "../services/cont-ledger.service";
import { getCurrentUserData } from "./users";

export const getContLedger = async (req: Request, res: Response) => {
	const user = getCurrentUserData(req);
	if (!user?.id) {
		res.status(401).json({ error: "Usuario no autenticado" });
		return;
	}

	try {
		const record = await getContLedgerByUser(user.id);
		res.status(200).json({
			registro: record?.registro ?? null,
			updatedAt: record?.updatedAt ?? null,
		});
	} catch (error) {
		console.error("Error al obtener registro contable:", error);
		res.status(500).json({ error: "Error al obtener registro contable" });
	}
};

export const saveContLedger = async (req: Request, res: Response) => {
	const user = getCurrentUserData(req);
	if (!user?.id) {
		res.status(401).json({ error: "Usuario no autenticado" });
		return;
	}

	const { registro } = req.body as { registro?: unknown };
	if (typeof registro === "undefined") {
		res.status(400).json({ error: "Falta el campo registro" });
		return;
	}

	try {
		const saved = await upsertContLedgerByUser(user.id, registro);
		res.status(200).json({
			message: "Registro contable guardado",
			updatedAt: saved.updatedAt,
		});
	} catch (error) {
		console.error("Error al guardar registro contable:", error);
		res.status(500).json({ error: "Error al guardar registro contable" });
	}
};
