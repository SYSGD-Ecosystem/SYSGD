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
//import { isAuthenticated } from "../middlewares/authjwt";
const router = (0, express_1.Router)();
router.get("/:project_id", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { project_id } = req.params;
    if (!project_id) {
        res.status(400).json({ error: "Missing project_id" });
        return;
    }
    try {
        const query = `
            SELECT
                t.*,
                COALESCE(
                    (
                        SELECT json_agg(json_build_object('id', u.id, 'name', u.name, 'username', u.username))
                        FROM task_assignees ta
                        JOIN users u ON ta.user_id = u.id
                        WHERE ta.task_id = t.id
                    ),
                    '[]'::json
                ) AS assignees
            FROM tasks t
            WHERE t.project_id = $1
            ORDER BY t.project_task_number ASC;
        `;
        const result = yield db_1.pool.query(query, [project_id]);
        res.status(200).json(result.rows);
    }
    catch (err) {
        console.error("Error getting tasks:", err);
        res.status(500).json({ error: "Error getting tasks" });
    }
}));
// crea tareas
router.post("/", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, project_id, description, priority, type, assignees = [], status, } = req.body;
    const user = (0, users_1.getCurrentUserData)(req);
    const created_by = user === null || user === void 0 ? void 0 : user.id;
    if (!title || !project_id || !created_by) {
        res.status(400).json({ error: "Missing required fields" });
        return;
    }
    const client = yield db_1.pool.connect();
    try {
        yield client.query("BEGIN");
        // Obtener el siguiente número de tarea dentro del proyecto
        const nextNumberResult = yield client.query(`SELECT COALESCE(MAX(project_task_number), 0) + 1 AS next_number
       FROM tasks
       WHERE project_id = $1`, [project_id]);
        const nextTaskNumber = nextNumberResult.rows[0].next_number;
        // Insertar la tarea con el número asignado
        const insertTaskQuery = `
      INSERT INTO tasks (title, project_id, description, priority, type, created_by, status, project_task_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
        const taskResult = yield client.query(insertTaskQuery, [
            title,
            project_id,
            description,
            priority,
            type,
            created_by,
            status || "active",
            nextTaskNumber,
        ]);
        const newTask = taskResult.rows[0];
        // Asignar usuarios (si los hay)
        for (const userId of assignees) {
            yield client.query("INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2)", [newTask.id, userId]);
        }
        yield client.query("COMMIT");
        res.status(201).json(newTask);
    }
    catch (err) {
        yield client.query("ROLLBACK");
        console.error("Error creating task:", err);
        res.status(500).json({ error: "Error creating task" });
    }
    finally {
        client.release();
    }
}));
// optiene las tareas de un proyecto
// router.get("/:project_id", isAuthenticated, async (req: Request, res: Response) => {
//   const { project_id } = req.params;
//   if (!project_id) {
//     res.status(400).json({ error: "Missing project_id" });
//     return;
//   }
//   try {
//     const result = await pool.query(
//       "SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at",
//       [project_id]
//     );
//     res.status(200).json(result.rows);
//   } catch (err) {
//     console.error("Error getting tasks:", err);
//     res.status(500).json({ error: "Error getting tasks" });
//   }
// });
// --- NUEVO: MODIFICAR UNA TAREA ---
router.put("/:taskId", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    const { title, description, priority, type, status, assignees = [], } = req.body;
    if (!title) {
        res.status(400).json({ error: "El título es obligatorio" });
        return;
    }
    const client = yield db_1.pool.connect();
    try {
        yield client.query("BEGIN");
        // 1. Actualizar los datos principales de la tarea
        const updateTaskQuery = `
            UPDATE tasks
            SET title = $1, description = $2, priority = $3, type = $4, status = $5
            WHERE id = $6
            RETURNING *;
        `;
        const updatedTaskResult = yield client.query(updateTaskQuery, [
            title,
            description,
            priority,
            type,
            status,
            taskId,
        ]);
        if (updatedTaskResult.rowCount === 0) {
            yield client.query("ROLLBACK");
            res.status(404).json({ error: "Tarea no encontrada" });
            return;
        }
        // 2. Actualizar los asignados: eliminamos los antiguos y añadimos los nuevos
        yield client.query("DELETE FROM task_assignees WHERE task_id = $1", [
            taskId,
        ]);
        for (const userId of assignees) {
            yield client.query("INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2)", [taskId, userId.id]);
        }
        yield client.query("COMMIT");
        // Devolvemos la tarea actualizada (podríamos volver a consultarla para tener los 'assignees' pero por ahora esto es suficiente)
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
// --- ELIMINAR UNA TAREA ---
router.delete("/:taskId", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    // TODO: Aqui no hay nada que verifique si el usuario tiene permiso de eliminar el recurso seleccionado
    // Alto riego de hack por acceso lateral
    // Implementar una tabla de asignacion de recuros para los usuarios, solo usuarios con acceso a este recurso pueden eliminarlo o modificarlo.
    try {
        // Gracias a "ON DELETE CASCADE" en la tabla task_assignees,
        // al eliminar una tarea, sus asignaciones también se eliminarán automáticamente.
        const result = yield db_1.pool.query("DELETE FROM tasks WHERE id = $1", [
            taskId,
        ]);
        if (result.rowCount === 0) {
            res.status(404).json({ error: "Tarea no encontrada" });
            return;
        }
        res.status(200).json({ message: "Tarea eliminada correctamente" });
    }
    catch (err) {
        console.error("Error deleting task:", err);
        res.status(500).json({ error: "Error al eliminar la tarea" });
    }
}));
exports.default = router;
