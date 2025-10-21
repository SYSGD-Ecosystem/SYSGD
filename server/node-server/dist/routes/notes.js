"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middlewares/auth");
const auth_jwt_1 = require("../middlewares/auth-jwt");
const users_1 = require("../controllers/users");
const router = (0, express_1.Router)();
// Validation schemas with Zod
const createNoteSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "El título es requerido").max(255, "El título no puede exceder 255 caracteres"),
    content: zod_1.z.string().optional().default(""),
});
const updateNoteSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "El título es requerido").max(255, "El título no puede exceder 255 caracteres").optional(),
    content: zod_1.z.string().optional(),
});
// GET /projects/:id/notes - Obtener todas las notas de un proyecto
router.get("/projects/:id/notes", auth_jwt_1.isAuthenticated, auth_1.hasProjectAccess, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const projectId = req.params.id;
    try {
        const result = yield db_1.pool.query(`
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
    }
    catch (error) {
        console.error("Error al obtener notas:", error);
        res.status(500).json({ error: "Error al obtener las notas" });
        return;
    }
}));
// POST /projects/:id/notes - Crear una nueva nota
router.post("/projects/:id/notes", auth_jwt_1.isAuthenticated, auth_1.hasProjectAccess, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const projectId = req.params.id;
    const user = (0, users_1.getCurrentUserData)(req);
    const userId = user === null || user === void 0 ? void 0 : user.id;
    if (!userId) {
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
    }
    try {
        // Validar datos de entrada
        const validatedData = createNoteSchema.parse(req.body);
        const result = yield db_1.pool.query(`
				INSERT INTO project_notes (project_id, user_id, title, content, created_at, updated_at)
				VALUES ($1, $2, $3, $4, NOW(), NOW())
				RETURNING *
			`, [projectId, userId, validatedData.title, validatedData.content]);
        // Obtener la nota con información del autor
        const noteWithAuthor = yield db_1.pool.query(`
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
}));
// PUT /notes/:id - Actualizar una nota existente
router.put("/notes/:id", auth_jwt_1.isAuthenticated, auth_1.hasProjectAccessFromNote, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const noteId = req.params.id;
    const user = (0, users_1.getCurrentUserData)(req);
    const userId = user === null || user === void 0 ? void 0 : user.id;
    if (!userId) {
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
    }
    try {
        // Validar datos de entrada
        const validatedData = updateNoteSchema.parse(req.body);
        // Construir query de actualización dinámicamente
        const updates = [];
        const values = [];
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
        const result = yield db_1.pool.query(updateQuery, values);
        if (result.rows.length === 0) {
            res.status(404).json({ error: "Nota no encontrada" });
            return;
        }
        // Obtener la nota actualizada con información del autor
        const updatedNoteWithAuthor = yield db_1.pool.query(`
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
}));
// DELETE /notes/:id - Eliminar una nota
router.delete("/notes/:id", auth_jwt_1.isAuthenticated, auth_1.hasProjectAccessFromNote, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const noteId = req.params.id;
    const user = (0, users_1.getCurrentUserData)(req);
    const userId = user === null || user === void 0 ? void 0 : user.id;
    if (!userId) {
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
    }
    try {
        // Eliminar la nota directamente - el middleware ya verificó permisos
        const deleteResult = yield db_1.pool.query(`
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
    }
    catch (error) {
        console.error("Error al eliminar nota:", error);
        res.status(500).json({ error: "Error al eliminar la nota" });
        return;
    }
}));
exports.default = router;
