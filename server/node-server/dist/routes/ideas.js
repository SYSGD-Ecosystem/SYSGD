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
const db_1 = require("../db");
const auth_jwt_1 = require("../middlewares/auth-jwt");
const users_1 = require("../controllers/users");
const router = (0, express_1.Router)();
router.post("/:projectId", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId } = req.params;
    const { title, description, category, priority, implementability, impact } = req.body;
    const user = (0, users_1.getCurrentUserData)(req);
    const userId = user === null || user === void 0 ? void 0 : user.id;
    if (!title ||
        !projectId ||
        !description ||
        !category ||
        !priority ||
        !implementability ||
        !impact) {
        res.status(400).json({ error: "Missing required fields" });
        return;
    }
    const numberRes = yield db_1.pool.query("SELECT COALESCE(MAX(idea_number), 0) + 1 AS next FROM ideas WHERE project_id = $1", [projectId]);
    const ideaNumber = numberRes.rows[0].next;
    const result = yield db_1.pool.query(`
    INSERT INTO ideas (
      title, description, category, priority, implementability, impact,
      project_id, user_id, idea_number
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *;
  `, [
        title,
        description,
        category,
        priority,
        implementability,
        impact,
        projectId,
        userId,
        ideaNumber,
    ]);
    res.status(201).json(result.rows[0]);
}));
router.get("/:projectId", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId } = req.params;
    const result = yield db_1.pool.query(`
		SELECT
			ideas.*,
			users.name AS user_name
		FROM ideas
		LEFT JOIN users ON ideas.user_id = users.id
		WHERE ideas.project_id = $1
		ORDER BY ideas.created_at DESC
		`, [projectId]);
    res.json(result.rows);
}));
// --- MODIFICAR ---
router.put("/:ideaId", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { ideaId } = req.params;
    const { title, description, category, priority, implementability, impact } = req.body;
    if (!title) {
        res.status(400).json({ error: "El título es obligatorio" });
        return;
    }
    const client = yield db_1.pool.connect();
    try {
        yield client.query("BEGIN");
        // 1. Actualizar los datos principales de la tarea
        const updateTaskQuery = `
            UPDATE ideas
            SET title = $1, description = $2, category = $3, priority = $4, implementability = $5, impact = $6
            WHERE id = $7
            RETURNING *;
        `;
        const updatedTaskResult = yield client.query(updateTaskQuery, [
            title,
            description,
            category,
            priority,
            implementability,
            impact,
            ideaId,
        ]);
        if (updatedTaskResult.rowCount === 0) {
            yield client.query("ROLLBACK");
            res.status(404).json({ error: "Tarea no encontrada" });
            return;
        }
        yield client.query("COMMIT");
        res.status(200).json(updatedTaskResult.rows[0]);
    }
    catch (err) {
        yield client.query("ROLLBACK");
        console.error("Error updating task:", err);
        res.status(500).json({ error: "Error al actualizar la tarea" });
    }
    finally {
        client.release();
    }
}));
router.delete("/:ideaId", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { ideaId } = req.params;
    // TODO: Aqui no hay nada que verifique si el usuario tiene permiso de eliminar el recurso seleccionado
    // Alto riego de hack por acceso lateral
    // Implementar una tabla de asignacion de recuros para los usuarios, solo usuarios con acceso a este recurso pueden eliminarlo o modificarlo.
    try {
        // Gracias a "ON DELETE CASCADE" en la tabla task_assignees,
        // al eliminar una tarea, sus asignaciones también se eliminarán automáticamente.
        const result = yield db_1.pool.query("DELETE FROM ideas WHERE id = $1", [
            ideaId,
        ]);
        if (result.rowCount === 0) {
            res.status(404).json({ error: "Idea no encontrada" });
            return;
        }
        res.status(200).json({ message: "Idea eliminada correctamente" });
    }
    catch (err) {
        console.error("Error deleting idea:", err);
        res.status(500).json({ error: "Error al eliminar idea" });
    }
}));
exports.default = router;
