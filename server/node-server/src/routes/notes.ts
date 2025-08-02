import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { pool } from "../index";
import { isAuthenticated, hasProjectAccess } from "../middlewares/auth";

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
					u.username as author_username
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
		const userId = req.session.user?.id;

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
					u.username as author_username
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
		}
	}
);

// PUT /notes/:id - Actualizar una nota existente
router.put(
	"/notes/:id", 
	isAuthenticated, 
	async (req: Request, res: Response) => {
		const noteId = req.params.id;
		const userId = req.session.user?.id;

		try {
			// Validar datos de entrada
			const validatedData = updateNoteSchema.parse(req.body);

			// Verificar que la nota existe y pertenece al usuario (o es admin)
			const noteCheck = await pool.query(`
				SELECT n.*, p.id as project_id 
				FROM project_notes n
				JOIN projects p ON n.project_id = p.id
				WHERE n.id = $1
			`, [noteId]);

			if (noteCheck.rows.length === 0) {
				res.status(404).json({ error: "Nota no encontrada" });
				return;
			}

			const note = noteCheck.rows[0];

			// Verificar permisos: solo el autor o admin pueden editar
			if (note.user_id !== userId && req.session.user?.privileges !== "admin") {
				res.status(403).json({ error: "No tienes permisos para editar esta nota" });
				return;
			}

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

			updates.push(`updated_at = NOW()`);
			values.push(noteId);

			const updateQuery = `
				UPDATE project_notes 
				SET ${updates.join(", ")}
				WHERE id = $${paramIndex}
				RETURNING *
			`;

			const result = await pool.query(updateQuery, values);

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
					u.username as author_username
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
		}
	}
);

// DELETE /notes/:id - Eliminar una nota
router.delete(
	"/notes/:id", 
	isAuthenticated, 
	async (req: Request, res: Response) => {
		const noteId = req.params.id;
		const userId = req.session.user?.id;

		try {
			// Verificar que la nota existe y obtener información del proyecto
			const noteCheck = await pool.query(`
				SELECT n.*, p.id as project_id 
				FROM project_notes n
				JOIN projects p ON n.project_id = p.id
				WHERE n.id = $1
			`, [noteId]);

			if (noteCheck.rows.length === 0) {
				res.status(404).json({ error: "Nota no encontrada" });
				return;
			}

			const note = noteCheck.rows[0];

			// Verificar permisos: solo el autor o admin pueden eliminar
			if (note.user_id !== userId && req.session.user?.privileges !== "admin") {
				res.status(403).json({ error: "No tienes permisos para eliminar esta nota" });
				return;
			}

			// Eliminar la nota
			await pool.query("DELETE FROM project_notes WHERE id = $1", [noteId]);

			res.json({ 
				success: true,
				message: "Nota eliminada exitosamente" 
			});
		} catch (error) {
			console.error("Error al eliminar nota:", error);
			res.status(500).json({ error: "Error al eliminar la nota" });
		}
	}
);

export default router;