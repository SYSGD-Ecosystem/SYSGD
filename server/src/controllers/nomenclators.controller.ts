import type { Request, Response } from "express";
import { z } from "zod";
import { getCurrentUserData } from "./users";
import {
	getAccountingCategories,
	getAccountingSubcategories,
	searchAccountingCatalog,
	searchCnaeCatalog,
} from "../services/nomenclators.service";

const accountingSearchQuerySchema = z.object({
	q: z.string().optional(),
	categoryCode: z.string().optional(),
	subcategoryCode: z.string().optional(),
	limit: z.coerce.number().int().min(1).max(200).optional(),
});

const cnaeSearchQuerySchema = z.object({
	q: z.string().optional(),
	limit: z.coerce.number().int().min(1).max(200).optional(),
});

const ensureAuthenticatedUser = (req: Request, res: Response): string | null => {
	const user = getCurrentUserData(req);
	if (!user?.id) {
		res.status(401).json({ error: "Usuario no autenticado" });
		return null;
	}

	return user.id;
};

export const listAccountingCategoriesController = async (
	req: Request,
	res: Response,
) => {
	if (!ensureAuthenticatedUser(req, res)) {
		return;
	}

	try {
		const categories = await getAccountingCategories();
		res.status(200).json(categories);
	} catch (error) {
		console.error("Error al listar categorías contables:", error);
		res.status(500).json({ error: "Error al listar categorías contables" });
	}
};

export const listAccountingSubcategoriesController = async (
	req: Request,
	res: Response,
) => {
	if (!ensureAuthenticatedUser(req, res)) {
		return;
	}

	try {
		const subcategories = await getAccountingSubcategories();
		res.status(200).json(subcategories);
	} catch (error) {
		console.error("Error al listar subcategorías contables:", error);
		res.status(500).json({ error: "Error al listar subcategorías contables" });
	}
};

export const searchAccountingCatalogController = async (
	req: Request,
	res: Response,
) => {
	if (!ensureAuthenticatedUser(req, res)) {
		return;
	}

	const parsedQuery = accountingSearchQuerySchema.safeParse(req.query);
	if (!parsedQuery.success) {
		res.status(400).json({
			error: "Parámetros inválidos",
			details: parsedQuery.error.issues.map((issue) => ({
				path: issue.path.join("."),
				message: issue.message,
			})),
		});
		return;
	}

	try {
		const items = await searchAccountingCatalog({
			term: parsedQuery.data.q,
			categoryCode: parsedQuery.data.categoryCode,
			subcategoryCode: parsedQuery.data.subcategoryCode,
			limit: parsedQuery.data.limit,
		});
		res.status(200).json(items);
	} catch (error) {
		console.error("Error al buscar en nomenclador contable:", error);
		res.status(500).json({ error: "Error al buscar en nomenclador contable" });
	}
};

export const searchCnaeCatalogController = async (
	req: Request,
	res: Response,
) => {
	if (!ensureAuthenticatedUser(req, res)) {
		return;
	}

	const parsedQuery = cnaeSearchQuerySchema.safeParse(req.query);
	if (!parsedQuery.success) {
		res.status(400).json({
			error: "Parámetros inválidos",
			details: parsedQuery.error.issues.map((issue) => ({
				path: issue.path.join("."),
				message: issue.message,
			})),
		});
		return;
	}

	try {
		const items = await searchCnaeCatalog({
			term: parsedQuery.data.q,
			limit: parsedQuery.data.limit,
		});
		res.status(200).json(items);
	} catch (error) {
		console.error("Error al buscar en nomenclador CNAE:", error);
		res.status(500).json({ error: "Error al buscar en nomenclador CNAE" });
	}
};
