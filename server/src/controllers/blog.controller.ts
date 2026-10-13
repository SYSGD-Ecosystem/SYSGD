import type { Request, Response } from "express";
import { z } from "zod";
import { getCurrentUserData } from "./users";
import {
	createPost,
	deletePost,
	getPostBySlug,
	listAllPosts,
	listPublishedPosts,
	updatePost,
} from "../services/blog.service";

const postSchema = z.object({
	slug: z
		.string()
		.min(1)
		.max(80)
		.regex(/^[a-z0-9-]+$/)
		.optional(),
	title: z.string().min(1).max(200),
	category: z.string().max(80).optional(),
	coverUrl: z.string().url().max(2000).or(z.literal("")).optional(),
	body: z.string().max(200000).optional(),
	isPublished: z.boolean().optional(),
});

const SLUG_RE = /^[a-z0-9-]{1,80}$/;

const requireAdmin = (req: Request, res: Response): boolean => {
	const user = getCurrentUserData(req);
	if (!user || user.privileges !== "admin") {
		res.status(403).json({ error: "No autorizado" });
		return false;
	}
	return true;
};

const toError = (error: unknown, fallback: string): string =>
	error instanceof Error ? error.message : fallback;

export const getPublicPosts = async (_req: Request, res: Response) => {
	try {
		res.json({ posts: await listPublishedPosts() });
	} catch (error) {
		console.error("Error al listar blog:", error);
		res.status(500).json({ error: "Error al listar publicaciones" });
	}
};

export const getPublicPost = async (req: Request, res: Response) => {
	const slug = req.params.slug;
	if (typeof slug !== "string" || !SLUG_RE.test(slug)) {
		res.status(400).json({ error: "Slug inválido" });
		return;
	}
	try {
		const post = await getPostBySlug(slug, true);
		if (!post) {
			res.status(404).json({ error: "Publicación no encontrada" });
			return;
		}
		res.json({ post });
	} catch (error) {
		console.error("Error al obtener publicación:", error);
		res.status(500).json({ error: "Error al obtener publicación" });
	}
};

export const getAdminPosts = async (req: Request, res: Response) => {
	if (!requireAdmin(req, res)) return;
	try {
		res.json({ posts: await listAllPosts() });
	} catch (error) {
		res.status(500).json({ error: "Error al listar publicaciones" });
	}
};

export const createAdminPost = async (req: Request, res: Response) => {
	if (!requireAdmin(req, res)) return;
	const parsed = postSchema.safeParse(req.body);
	if (!parsed.success) {
		res.status(400).json({ error: "Datos inválidos" });
		return;
	}
	try {
		const post = await createPost(parsed.data);
		res.status(201).json({ post });
	} catch (error) {
		res.status(400).json({ error: toError(error, "No se pudo crear") });
	}
};

export const updateAdminPost = async (req: Request, res: Response) => {
	if (!requireAdmin(req, res)) return;
	const parsed = postSchema.safeParse(req.body);
	if (!parsed.success) {
		res.status(400).json({ error: "Datos inválidos" });
		return;
	}
	try {
		const post = await updatePost(String(req.params.id), parsed.data);
		if (!post) {
			res.status(404).json({ error: "Publicación no encontrada" });
			return;
		}
		res.json({ post });
	} catch (error) {
		res.status(400).json({ error: toError(error, "No se pudo actualizar") });
	}
};

export const deleteAdminPost = async (req: Request, res: Response) => {
	if (!requireAdmin(req, res)) return;
	try {
		await deletePost(String(req.params.id));
		res.json({ ok: true });
	} catch (error) {
		res.status(500).json({ error: "Error al borrar" });
	}
};
