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
exports.getProjectById = exports.getProjects = exports.createProject = void 0;
const db_1 = require("../db");
const createProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, description, visibility } = req.body;
    const user = req.user;
    if (!user || !user.id || !user.username || !user.privileges) {
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
    }
    const created_by = user.id;
    if (!name || !description) {
        res.status(400).json({ error: "Faltan campos obligatorios" });
        return;
    }
    try {
        const result = yield db_1.pool.query(`INSERT INTO projects (name, description, created_by, visibility)
       VALUES ($1, $2, $3, $4) RETURNING *`, [name, description, created_by, visibility || "privado"]);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error("Error al crear proyecto:", err);
        res.status(500).json({ error: "Error al crear proyecto" });
    }
});
exports.createProject = createProject;
// Obtener todos los proyectos del usuario (creados y a los que tiene acceso)
const getProjects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if (!user || !user.id || !user.username || !user.privileges) {
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
    }
    const user_id = user.id;
    const isAdmin = user.privileges === "admin";
    try {
        // La consulta SQL es la clave aquí.
        // Para administradores, obtenemos todo. Para usuarios normales, una consulta más compleja.
        const query = isAdmin
            ? `
                SELECT
                    p.*,
                    (SELECT COUNT(*) FROM resource_access WHERE resource_id = p.id AND resource_type = 'project') as members_count,
                    (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
                    (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'Completado') as completed_tasks
                FROM projects p
                ORDER BY p.created_at DESC
            `
            : `
                SELECT
                    p.id, p.name, p.description, p.created_by, p.created_at, p.status, p.visibility,
                    -- Subconsulta para contar miembros con acceso al proyecto
                    (SELECT COUNT(*) FROM resource_access ra WHERE ra.resource_id = p.id AND ra.resource_type = 'project') as members_count,
                    -- Subconsulta para contar el total de tareas del proyecto
                    (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as total_tasks,
                    -- Subconsulta para contar solo las tareas completadas
                    (SELECT COUNT(*) FROM tasks t_comp WHERE t_comp.project_id = p.id AND t_comp.status = 'completed') as completed_tasks
                FROM projects p
                -- Usamos LEFT JOIN para encontrar los proyectos a los que el usuario tiene acceso
                LEFT JOIN resource_access ra ON p.id = ra.resource_id AND ra.resource_type = 'project'
                -- La condición WHERE ahora busca proyectos creados por el usuario O donde tiene acceso
                WHERE p.created_by = $1 OR ra.user_id = $1
                -- Agrupamos para evitar duplicados si un usuario es creador y también tiene acceso explícito
                GROUP BY p.id
                ORDER BY p.created_at DESC
            `;
        const result = yield db_1.pool.query(query, isAdmin ? [] : [user_id]);
        res.json(result.rows);
    }
    catch (err) {
        console.error("Error al obtener proyectos:", err);
        res.status(500).json({ error: "Error al obtener proyectos" });
    }
});
exports.getProjects = getProjects;
const getProjectById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const user = req.user;
    if (!user || !user.id || !user.username || !user.privileges) {
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
    }
    const user_id = user.id;
    if (!id) {
        res.status(400).json({ error: "Falta id" });
        return;
    }
    try {
        const result = yield db_1.pool.query("SELECT * FROM projects WHERE id = $1 AND created_by = $2", [id, user_id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: "Proyecto no encontrado" });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error("Error al obtener proyecto:", err);
        res.status(500).json({ error: "Error al obtener proyecto" });
    }
});
exports.getProjectById = getProjectById;
