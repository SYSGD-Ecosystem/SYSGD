import type { Request, Response } from "express";
import { z } from "zod";
import { getCurrentUserData } from "./users";
import {
	createApp,
	createAppArticle,
	createAppCategory,
	deleteApp,
	deleteAppArticle,
	deleteAppCategory,
	deleteAppReview,
	deleteOwnAppReview,
	getAppArticle,
	getAppBySlug,
	getAppIdBySlugOrThrow,
	listAllApps,
	listAppArticles,
	listAppCategories,
	listAppReviews,
	listPublishedApps,
	updateApp,
	updateAppArticle,
	upsertAppReview,
} from "../services/app-catalog.service";

const slugSchema = z
	.string()
	.min(1)
	.max(80)
	.regex(/^[a-z0-9-]+$/)
	.optional();

const appSchema = z.object({
	slug: slugSchema,
	name: z.string().min(1).max(160),
	tagline: z.string().max(280).optional(),
	description: z.string().max(10000).optional(),
	iconUrl: z.string().url().max(2000).or(z.literal("")).optional(),
	platforms: z.array(z.string().max(40)).max(10).optional(),
	priceLabel: z.string().max(60).optional(),
	downloadUrl: z.string().url().max(2000).or(z.literal("")).optional(),
	releaseKey: z.string().max(64).nullable().optional(),
	isPublished: z.boolean().optional(),
});

const categorySchema = z.object({
	name: z.string().min(1).max(80),
	slug: slugSchema,
});

const articleSchema = z.object({
	categoryId: z.string().uuid().nullable().optional(),
	slug: slugSchema,
	title: z.string().min(1).max(200),
	body: z.string().max(50000).optional(),
	isPublished: z.boolean().optional(),
});

const reviewSchema = z.object({
	rating: z.number().int().min(1).max(5),
	comment: z.string().max(2000).optional(),
});

const SLUG_RE = /^[a-z0-9-]{1,80}$/;

const checkSlug = (res: Response, slug: unknown): slug is string => {
	if (typeof slug !== "string" || !SLUG_RE.test(slug)) {
		res.status(400).json({ error: "Slug inválido" });
		return false;
	}
	return true;
};

const requireAdmin = (req: Request, res: Response): string | null => {
	const user = getCurrentUserData(req);
	if (!user || user.privileges !== "admin") {
		res.status(403).json({ error: "No autorizado" });
		return null;
	}
	return user.id;
};

const toError = (error: unknown, fallback: string): string =>
	error instanceof Error ? error.message : fallback;

// ---------- Públicas ----------
export const getPublicApps = async (_req: Request, res: Response) => {
	try {
		res.json({ apps: await listPublishedApps() });
	} catch (error) {
		console.error("Error al listar apps:", error);
		res.status(500).json({ error: "Error al listar apps" });
	}
};

export const getPublicApp = async (req: Request, res: Response) => {
	if (!checkSlug(res, req.params.slug)) return;
	try {
		const app = await getAppBySlug(req.params.slug, true);
		if (!app) {
			res.status(404).json({ error: "App no encontrada" });
			return;
		}
		res.json({ app });
	} catch (error) {
		console.error("Error al obtener app:", error);
		res.status(500).json({ error: "Error al obtener app" });
	}
};

export const getPublicAppArticles = async (req: Request, res: Response) => {
	if (!checkSlug(res, req.params.slug)) return;
	try {
		const articles = await listAppArticles(
			req.params.slug,
			true,
			typeof req.query.category === "string" ? req.query.category : undefined,
		);
		res.json({ articles });
	} catch (error) {
		console.error("Error al listar artículos:", error);
		res.status(500).json({ error: "Error al listar artículos" });
	}
};

export const getPublicAppArticle = async (req: Request, res: Response) => {
	if (!checkSlug(res, req.params.slug)) return;
	try {
		const article = await getAppArticle(
			req.params.slug,
			String(req.params.articleSlug),
			true,
		);
		if (!article) {
			res.status(404).json({ error: "Artículo no encontrado" });
			return;
		}
		res.json({ article });
	} catch (error) {
		console.error("Error al obtener artículo:", error);
		res.status(500).json({ error: "Error al obtener artículo" });
	}
};

// ---------- Reseñas (auth) ----------
export const upsertOwnReview = async (req: Request, res: Response) => {
	const user = getCurrentUserData(req);
	if (!user) {
		res.status(401).json({ error: "No autorizado" });
		return;
	}
	if (!checkSlug(res, req.params.slug)) return;
	const parsed = reviewSchema.safeParse(req.body);
	if (!parsed.success) {
		res.status(400).json({ error: "Valoración inválida (1-5 y comentario)" });
		return;
	}
	try {
		const appId = await getAppIdBySlugOrThrow(req.params.slug);
		const review = await upsertAppReview(
			appId,
			user.id,
			parsed.data.rating,
			parsed.data.comment ?? "",
		);
		res.json({ review });
	} catch (error) {
		res.status(400).json({ error: toError(error, "No se pudo guardar la reseña") });
	}
};

export const deleteOwnReview = async (req: Request, res: Response) => {
	const user = getCurrentUserData(req);
	if (!user) {
		res.status(401).json({ error: "No autorizado" });
		return;
	}
	if (!checkSlug(res, req.params.slug)) return;
	try {
		const appId = await getAppIdBySlugOrThrow(req.params.slug);
		await deleteOwnAppReview(appId, user.id);
		res.json({ ok: true });
	} catch (error) {
		res.status(400).json({ error: toError(error, "No se pudo borrar la reseña") });
	}
};

// ---------- Admin ----------
export const getAdminApps = async (req: Request, res: Response) => {
	if (!requireAdmin(req, res)) return;
	try {
		res.json({ apps: await listAllApps() });
	} catch (error) {
		console.error("Error al listar apps:", error);
		res.status(500).json({ error: "Error al listar apps" });
	}
};

export const createAdminApp = async (req: Request, res: Response) => {
	if (!requireAdmin(req, res)) return;
	const parsed = appSchema.safeParse(req.body);
	if (!parsed.success) {
		res.status(400).json({ error: "Datos de app inválidos" });
		return;
	}
	try {
		const app = await createApp(parsed.data);
		res.status(201).json({ app });
	} catch (error) {
		res.status(400).json({ error: toError(error, "No se pudo crear la app") });
	}
};

export const updateAdminApp = async (req: Request, res: Response) => {
	if (!requireAdmin(req, res)) return;
	const parsed = appSchema.safeParse(req.body);
	if (!parsed.success) {
		res.status(400).json({ error: "Datos de app inválidos" });
		return;
	}
	try {
		const app = await updateApp(String(req.params.id), parsed.data);
		if (!app) {
			res.status(404).json({ error: "App no encontrada" });
			return;
		}
		res.json({ app });
	} catch (error) {
		res.status(400).json({ error: toError(error, "No se pudo actualizar la app") });
	}
};

export const deleteAdminApp = async (req: Request, res: Response) => {
	if (!requireAdmin(req, res)) return;
	try {
		const ok = await deleteApp(String(req.params.id));
		if (!ok) {
			res.status(404).json({ error: "App no encontrada" });
			return;
		}
		res.json({ ok: true });
	} catch (error) {
		res.status(500).json({ error: toError(error, "No se pudo borrar la app") });
	}
};

export const getAdminAppCategories = async (req: Request, res: Response) => {
	if (!requireAdmin(req, res)) return;
	try {
		res.json({ categories: await listAppCategories(String(req.params.id)) });
	} catch (error) {
		res.status(500).json({ error: "Error al listar categorías" });
	}
};

export const createAdminAppCategory = async (req: Request, res: Response) => {
	if (!requireAdmin(req, res)) return;
	const parsed = categorySchema.safeParse(req.body);
	if (!parsed.success) {
		res.status(400).json({ error: "Datos de categoría inválidos" });
		return;
	}
	try {
		const category = await createAppCategory(
			String(req.params.id),
			parsed.data.name,
			parsed.data.slug,
		);
		res.status(201).json({ category });
	} catch (error) {
		res.status(400).json({ error: toError(error, "No se pudo crear la categoría") });
	}
};

export const deleteAdminAppCategory = async (req: Request, res: Response) => {
	if (!requireAdmin(req, res)) return;
	try {
		await deleteAppCategory(String(req.params.categoryId));
		res.json({ ok: true });
	} catch (error) {
		res.status(500).json({ error: "Error al borrar categoría" });
	}
};

export const createAdminAppArticle = async (req: Request, res: Response) => {
	if (!requireAdmin(req, res)) return;
	const parsed = articleSchema.safeParse(req.body);
	if (!parsed.success) {
		res.status(400).json({ error: "Datos de artículo inválidos" });
		return;
	}
	try {
		const article = await createAppArticle(String(req.params.id), parsed.data);
		res.status(201).json({ article });
	} catch (error) {
		res.status(400).json({ error: toError(error, "No se pudo crear el artículo") });
	}
};

export const updateAdminAppArticle = async (req: Request, res: Response) => {
	if (!requireAdmin(req, res)) return;
	const parsed = articleSchema.safeParse(req.body);
	if (!parsed.success) {
		res.status(400).json({ error: "Datos de artículo inválidos" });
		return;
	}
	try {
		const article = await updateAppArticle(String(req.params.articleId), parsed.data);
		if (!article) {
			res.status(404).json({ error: "Artículo no encontrado" });
			return;
		}
		res.json({ article });
	} catch (error) {
		res.status(400).json({ error: toError(error, "No se pudo actualizar el artículo") });
	}
};

export const deleteAdminAppArticle = async (req: Request, res: Response) => {
	if (!requireAdmin(req, res)) return;
	try {
		await deleteAppArticle(String(req.params.articleId));
		res.json({ ok: true });
	} catch (error) {
		res.status(500).json({ error: "Error al borrar artículo" });
	}
};

export const getAdminAppReviews = async (req: Request, res: Response) => {
	const adminId = requireAdmin(req, res);
	if (!adminId) return;
	if (!checkSlug(res, req.params.slug)) return;
	try {
		const appId = await getAppIdBySlugOrThrow(req.params.slug);
		res.json({ reviews: await listAppReviews(appId) });
	} catch (error) {
		res.status(400).json({ error: toError(error, "Error al listar reseñas") });
	}
};

export const deleteAdminAppReview = async (req: Request, res: Response) => {
	if (!requireAdmin(req, res)) return;
	try {
		await deleteAppReview(String(req.params.reviewId));
		res.json({ ok: true });
	} catch (error) {
		res.status(500).json({ error: "Error al borrar reseña" });
	}
};

export const getPublicAppReviews = async (req: Request, res: Response) => {
	if (!checkSlug(res, req.params.slug)) return;
	try {
		const appId = await getAppIdBySlugOrThrow(req.params.slug);
		res.json({ reviews: await listAppReviews(appId) });
	} catch (error) {
		res.status(400).json({ error: toError(error, "Error al listar reseñas") });
	}
};
