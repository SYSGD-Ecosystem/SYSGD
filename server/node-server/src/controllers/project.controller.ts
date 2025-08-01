import type { Request, Response } from "express";
import { pool } from "../db";

export interface User {
    id: number;
    username: string;
    privileges: string;
    // otras propiedades
}


export const createProject = async (req: Request, res: Response) => {
    const { name, description, visibility } = req.body;
    const user: User = req.user as User;
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
        const result = await pool.query(
            `INSERT INTO projects (name, description, created_by, visibility)
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [name, description, created_by, visibility || "privado"]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error al crear proyecto:", err);
        res.status(500).json({ error: "Error al crear proyecto" });
    }
}


// Obtener todos los proyectos del usuario (creados y a los que tiene acceso)
export const getProjects = async (req: Request, res: Response) => {

    const user: User = req.user as User;
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

        const result = await pool.query(query, isAdmin ? [] : [user_id]);
        res.json(result.rows);
    } catch (err) {
        console.error("Error al obtener proyectos:", err);
        res.status(500).json({ error: "Error al obtener proyectos" });
    }
}


export const getProjectById = async (req: Request, res: Response) => {
    const { id } = req.params;

    const user: User = req.user as User;
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
        const result = await pool.query(
            "SELECT * FROM projects WHERE id = $1 AND created_by = $2",
            [id, user_id]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: "Proyecto no encontrado" });
            return;
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error al obtener proyecto:", err);
        res.status(500).json({ error: "Error al obtener proyecto" });
    }
}