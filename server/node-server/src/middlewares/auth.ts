import type { Request, Response, NextFunction } from "express";
import { pool } from "../db";
import jwt from "jsonwebtoken";
import { getCurrentUserData } from "../controllers/users";

if (!process.env.JWT_SECRET) {
	throw new Error("Falta definir JWT_SECRET en variables de entorno");
}

const JWT_SECRET = process.env.JWT_SECRET;

export function isAdmin(req: Request, res: Response, next: NextFunction) {
	const user = getCurrentUserData(req);
	if (!user) {
		res.status(400).json({ error: "user not found" });
		return;
	}

	if (user.privileges !== "admin") {
		res.status(403).json({ error: "Solo para admins" });
		return;
	}
	next();
}

export async function hasProjectAccess(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	const projectId = req.params.id || req.params.projectId;
	const user = getCurrentUserData(req);
	const userId = user?.id;

	if (!projectId) {
		res.status(400).json({ error: "ID de proyecto requerido" });
		return;
	}

	if (!userId) {
		res.status(401).json({ error: "Usuario no autenticado" });
		return;
	}

	try {
		// Verificar si el usuario es admin
		if (user?.privileges === "admin") {
			next();
			return;
		}

		// Verificar si el usuario es el creador del proyecto o tiene acceso a través de resource_access
		const result = await pool.query(
			`
			SELECT 1 FROM projects p
			LEFT JOIN resource_access ra ON p.id = ra.resource_id 
				AND ra.resource_type = 'project' 
				AND ra.user_id = $2
			WHERE p.id = $1 
				AND (p.created_by = $2 OR ra.user_id IS NOT NULL)
		`,
			[projectId, userId],
		);

		if (result.rows.length === 0) {
			res.status(403).json({ error: "No tienes acceso a este proyecto" });
			return;
		}

		next();
	} catch (error) {
		console.error("Error verificando acceso al proyecto:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
}

export async function hasProjectAccessFromNote(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	const noteId = req.params.id;
	const user = getCurrentUserData(req);
	const userId = user?.id;

	if (!noteId) {
		res.status(400).json({ error: "ID de nota requerido" });
		return;
	}

	if (!userId) {
		res.status(401).json({ error: "Usuario no autenticado" });
		return;
	}

	try {
		// Verificar si el usuario es admin
		if (user?.privileges === "admin") {
			next();
			return;
		}

		// Verificar que el usuario tenga acceso al proyecto de la nota
		const result = await pool.query(
			`
			SELECT n.user_id, p.id as project_id FROM project_notes n
			JOIN projects p ON n.project_id = p.id
			LEFT JOIN resource_access ra ON p.id = ra.resource_id 
				AND ra.resource_type = 'project' 
				AND ra.user_id = $2
			WHERE n.id = $1 
				AND (p.created_by = $2 OR ra.user_id IS NOT NULL)
		`,
			[noteId, userId],
		);

		if (result.rows.length === 0) {
			res
				.status(403)
				.json({
					error: "No tienes permisos para acceder a esta nota o no existe",
				});
			return;
		}

		next();
	} catch (error) {
		console.error("Error verificando acceso a la nota:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
}

// Middleware para verificar el JWT
export const isAuthenticate = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const authHeader = req.headers.authorization;
	if (!authHeader) {
		return res.status(401).json({ message: "Token no proporcionado" });
	}

	const token = authHeader.split(" ")[1];
	jwt.verify(token, JWT_SECRET, (err, decoded) => {
		if (err) {
			return res.status(403).json({ message: "Token inválido" });
		}

		req.user = decoded as {
			id: string;
			email: string;
			privileges: string;
		};
		next();
	});
};
