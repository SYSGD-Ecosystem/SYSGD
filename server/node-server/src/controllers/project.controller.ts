import type { Request, Response } from "express";
import { pool } from "../db";

export interface User {
    id: string;
    email: string;
    privileges: string;
    // otras propiedades
}

export interface ProjectConfig {
id: string;
project_id: string;
created_by: string;
crated_at: string;
task_config: string;
}


export const createProject = async (req: Request, res: Response) => {
    const { name, description, visibility } = req.body;
    const user: User = req.user as User;
    if (!user || !user.id || !user.email || !user.privileges) {
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

        console.log("Project result",{result},result.rows[0])

        const project_id = result.rows[0].id

        const project_config = await pool.query(
            `INSERT INTO projects_config (project_id, created_by) VALUES ($1, $2) RETURNING *`, [project_id, created_by]
        );

        console.log("Project result config",project_config.rows[0])


        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error al crear proyecto:", err);
        res.status(500).json({ error: "Error al crear proyecto" });
    }
}


// Obtener todos los proyectos del usuario (creados y a los que tiene acceso)
export const getProjects = async (req: Request, res: Response) => {

    const user: User = req.user as User;
    if (!user || !user.id || !user.email || !user.privileges) {
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
    if (!user || !user.id || !user.email || !user.privileges) {
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

export const updateProject = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, visibility, status } = req.body;

    const user: User = req.user as User;
    if (!user || !user.id || !user.email || !user.privileges) {
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
    }

    if (!id) {
        res.status(400).json({ error: "Falta id" });
        return;
    }

    if (!name || !description) {
        res.status(400).json({ error: "Nombre y descripción son obligatorios" });
        return;
    }

    try {
        const result = await pool.query(
            `UPDATE projects
             SET name = $1, description = $2, visibility = COALESCE($3, visibility), status = COALESCE($4, status)
             WHERE id = $5 AND (created_by = $6 OR $7 = 'admin')
             RETURNING *`,
            [name, description, visibility || null, status || null, id, user.id, user.privileges]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: "Proyecto no encontrado o sin permisos" });
            return;
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error al actualizar proyecto:", err);
        res.status(500).json({ error: "Error al actualizar proyecto" });
    }
}

export const deleteProject = async (req: Request, res: Response) => {
    const { id } = req.params;

    const user: User = req.user as User;
    if (!user || !user.id || !user.email || !user.privileges) {
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
    }

    if (!id) {
        res.status(400).json({ error: "Falta id" });
        return;
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const projectResult = await client.query(
            "SELECT id FROM projects WHERE id = $1 AND (created_by = $2 OR $3 = 'admin')",
            [id, user.id, user.privileges],
        );

        if (projectResult.rows.length === 0) {
            await client.query("ROLLBACK");
            res.status(404).json({ error: "Proyecto no encontrado o sin permisos" });
            return;
        }

        await client.query("DELETE FROM resource_access WHERE resource_type = 'project' AND resource_id = $1", [id]);
        await client.query("DELETE FROM invitations WHERE resource_type = 'project' AND resource_id = $1", [id]);
        await client.query("DELETE FROM task_assignees WHERE task_id IN (SELECT id FROM tasks WHERE project_id = $1)", [id]);
        await client.query("DELETE FROM tasks WHERE project_id = $1", [id]);
        await client.query("DELETE FROM projects_config WHERE project_id = $1", [id]);
        await client.query("DELETE FROM projects WHERE id = $1", [id]);

        await client.query("COMMIT");

        res.json({ message: "Proyecto eliminado correctamente" });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error al eliminar proyecto:", err);
        res.status(500).json({ error: "Error al eliminar proyecto" });
    } finally {
        client.release();
    }
}
