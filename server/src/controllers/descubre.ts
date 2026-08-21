// controllers/descubre.ts
import type { Request, Response } from "express";
import { getCurrentUserData } from "./users";
import {
	createDescubrePost,
	deleteDescubrePost,
	listAllDescubrePostsForAdmin,
	listDescubrePosts,
	getWelcomePosts,
} from "../services/descubre-posts.service";

export const listDescubrePostsController = async (req: Request, res: Response) => {
	const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
	try {
		const posts = await listDescubrePosts(30, cursor);
		res.json(posts);
	} catch (err) {
		console.error("Error listando descubre posts:", err);
		res.json(getWelcomePosts());
	}
};

export const createDescubrePostController = async (req: Request, res: Response) => {
	const user = getCurrentUserData(req);
	if (!user?.id) {
		res.status(401).json({ message: "Usuario no autenticado" });
		return;
	}

	const { title, description, category, precio, moneda, province, contactNumber, imageUrls } = req.body;
	if (!title?.trim() || !description?.trim() || !contactNumber?.trim()) {
		res.status(400).json({ message: "title, description y contactNumber son obligatorios" });
		return;
	}

	let result;
	try {
		result = await createDescubrePost(user.id, {
			title, description, category, precio, moneda, province, contactNumber, imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
		});
	} catch (err) {
		console.error("Error creando descubre post:", err);
		res.status(500).json({ message: "Error al crear publicación" });
		return;
	}

	if (!result.ok) {
		if (result.reason === "forbidden") {
			res.status(403).json({ message: "Publicar en Descubre requiere plan Pro o VIP" });
			return;
		}
		res.status(402).json({
			message: "Créditos insuficientes para publicar",
			credits: { available: result.remainingCredits },
		});
		return;
	}

	res.status(201).json({ post: result.post, remainingCredits: result.remainingCredits });
};

export const listAllDescubrePostsAdminController = async (req: Request, res: Response) => {
	const limitParam = typeof req.query.limit === "string" ? Number(req.query.limit) : NaN;
	const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 500) : 100;
	try {
		const posts = await listAllDescubrePostsForAdmin(limit);
		res.json(posts);
	} catch (err) {
		console.error("Error listando descubre posts (admin):", err);
		res.status(500).json({ message: "Error al obtener las publicaciones" });
	}
};

export const deleteDescubrePostAdminController = async (req: Request, res: Response) => {
	const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
	if (!id) {
		res.status(400).json({ message: "Falta el id de la publicación" });
		return;
	}

	try {
		const deleted = await deleteDescubrePost(id);
		if (!deleted) {
			res.status(404).json({ message: "Publicación no encontrada" });
			return;
		}
		res.json({ message: "Publicación eliminada", id });
	} catch (err) {
		console.error("Error eliminando descubre post:", err);
		res.status(500).json({ message: "Error al eliminar la publicación" });
	}
};