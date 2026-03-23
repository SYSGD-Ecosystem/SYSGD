import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { pool } from "../db";
import { hasProjectAccess, hasProjectAccessFromNote } from "../middlewares/auth";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { getCurrentUserData } from "../controllers/users";

const router = Router();

// Validation schemas with Zod
const createNoteSchema = z.object({
	title: z.string().min(1, "El título es requerido").max(255, "El título no puede exceder 255 caracteres"),
	content: z.string().optional().default(""),
});

const updateNoteSchema = z.object({
	title: z.string().min(1, "El título es requerido").max(255, "El título no puede exceder 255 caracteres").optional(),
	content: z.string().optional(),
});

// GET /projects/:id/notes - Obtener todas las notas de un proyecto
router.get(
	"/projects/:id/notes", 
	isAuthenticated, 
	hasProjectAccess, 
	async (req: Request, res: Response) => {
		const projectId = req.params.id;

		try {
			const result = await pool.query(`
				SELECT 
					n.id,
					n.title,
					n.content,
					n.created_at,
					n.updated_at,
					n.user_id,
					u.name as author_name,
					u.email as author_email
				FROM project_notes n
				JOIN users u ON n.user_id = u.id
				WHERE n.project_id = $1
				ORDER BY n.updated_at DESC
			`, [projectId]);

			res.json({
				success: true,
				data: result.rows,
				message: "Notas obtenidas exitosamente"
			});
		} catch (error) {
			console.error("Error al obtener notas:", error);
			res.status(500).json({ error: "Error al obtener las notas" });
			return;
		}
	}
);

// POST /projects/:id/notes - Crear una nueva nota
router.post(
	"/projects/:id/notes",
	isAuthenticated,
	hasProjectAccess,
	async (req: Request, res: Response) => {
		const projectId = req.params.id;
		const user = getCurrentUserData(req)
		const userId = user?.id;

		if (!userId) {
			res.status(401).json({ error: "Usuario no autenticado" });
			return;
		}

		try {
			// Validar datos de entrada
			const validatedData = createNoteSchema.parse(req.body);

			const result = await pool.query(`
				INSERT INTO project_notes (project_id, user_id, title, content, created_at, updated_at)
				VALUES ($1, $2, $3, $4, NOW(), NOW())
				RETURNING *
			`, [projectId, userId, validatedData.title, validatedData.content]);

			// Obtener la nota con información del autor
			const noteWithAuthor = await pool.query(`
				SELECT 
					n.id,
					n.title,
					n.content,
					n.created_at,
					n.updated_at,
					n.user_id,
					u.name as author_name,
					u.email as author_email
				FROM project_notes n
				JOIN users u ON n.user_id = u.id
				WHERE n.id = $1
			`, [result.rows[0].id]);

			res.status(201).json({
				success: true,
				data: noteWithAuthor.rows[0],
				message: "Nota creada exitosamente"
			});
		} catch (error) {
			if (error instanceof z.ZodError) {
				res.status(400).json({ 
					error: "Datos inválidos", 
					details: error.issues 
				});
				return;
			}
			console.error("Error al crear nota:", error);
			res.status(500).json({ error: "Error al crear la nota" });
			return;
		}
	}
);

// PUT /notes/:id - Actualizar una nota existente
router.put(
	"/notes/:id", 
	isAuthenticated,
	hasProjectAccessFromNote,
	async (req: Request, res: Response) => {
		const noteId = req.params.id;
		const user = getCurrentUserData(req)
		const userId = user?.id;

		if (!userId) {
			res.status(401).json({ error: "Usuario no autenticado" });
			return;
		}

		try {
			// Validar datos de entrada
			const validatedData = updateNoteSchema.parse(req.body);

			// Construir query de actualización dinámicamente
			const updates: string[] = [];
			const values: unknown[] = [];
			let paramIndex = 1;

			if (validatedData.title !== undefined) {
				updates.push(`title = $${paramIndex}`);
				values.push(validatedData.title);
				paramIndex++;
			}

			if (validatedData.content !== undefined) {
				updates.push(`content = $${paramIndex}`);
				values.push(validatedData.content);
				paramIndex++;
			}

			if (updates.length === 0) {
				res.status(400).json({ error: "No hay campos para actualizar" });
				return;
			}

			updates.push("updated_at = NOW()");
			values.push(noteId);
			const whereParamIndex = paramIndex;
			
			const updateQuery = `
				UPDATE project_notes 
				SET ${updates.join(", ")}
				WHERE id = $${whereParamIndex}
				RETURNING *
			`;
			
			const result = await pool.query(updateQuery, values);

			if (result.rows.length === 0) {
				res.status(404).json({ error: "Nota no encontrada" });
				return;
			}

			// Obtener la nota actualizada con información del autor
			const updatedNoteWithAuthor = await pool.query(`
				SELECT 
					n.id,
					n.title,
					n.content,
					n.created_at,
					n.updated_at,
					n.user_id,
					u.name as author_name,
					u.email as author_email
				FROM project_notes n
				JOIN users u ON n.user_id = u.id
				WHERE n.id = $1
			`, [result.rows[0].id]);

			res.json({
				success: true,
				data: updatedNoteWithAuthor.rows[0],
				message: "Nota actualizada exitosamente"
			});
		} catch (error) {
			if (error instanceof z.ZodError) {
				res.status(400).json({ 
					error: "Datos inválidos", 
					details: error.issues 
				});
				return;
			}
			console.error("Error al actualizar nota:", error);
			res.status(500).json({ error: "Error al actualizar la nota" });
			return;
		}
	}
);

// DELETE /notes/:id - Eliminar una nota
router.delete(
	"/notes/:id", 
	isAuthenticated,
	hasProjectAccessFromNote,
	async (req: Request, res: Response) => {
		const noteId = req.params.id;
		const user = getCurrentUserData(req)
		const userId = user?.id;

		if (!userId) {
			res.status(401).json({ error: "Usuario no autenticado" });
			return;
		}

		try {
			// Eliminar la nota directamente - el middleware ya verificó permisos
			const deleteResult = await pool.query(`
				DELETE FROM project_notes 
				WHERE id = $1
			`, [noteId]);

			if (deleteResult.rowCount === 0) {
				res.status(404).json({ error: "Nota no encontrada" });
				return;
			}

			res.json({
				success: true,
				message: "Nota eliminada exitosamente"
			});
		} catch (error) {
			console.error("Error al eliminar nota:", error);
			res.status(500).json({ error: "Error al eliminar la nota" });
			return;
		}
	}
);

export default router;