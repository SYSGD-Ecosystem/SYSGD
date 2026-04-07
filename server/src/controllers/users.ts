import type {  Request, Response } from "express";
import { pool } from "../db";
import bcrypt from "bcrypt";
import { normalizeClientSource } from "../utils/client-source";
import { UserService } from "../services/userService";
import type { UpdatePlanData, UpdateUserData } from "../types/user";


export const register = async (req: Request, res: Response) => {
    //TODO: Implementar verificación de email
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        res.status(400).send("400");
        return;
    }

    let privileges = "user";
    const registrationSource = normalizeClientSource(req.headers["x-app-source"], "unknown");
    try {
        const usercount = await pool.query("SELECT id FROM users");

        if (usercount.rows.length === 0) {
            privileges = "admin";
        }

        const userExists = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email],
        );
        if (userExists.rows.length > 0) {
            res.status(409).send("Usuario ya existe");
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            `INSERT INTO users (name, email, password, privileges, registration_source, registration_meta)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                name,
                email,
                hashedPassword,
                privileges,
                registrationSource,
                JSON.stringify({ rawHeader: req.headers["x-app-source"] ?? null }),
            ],
        );

        res.status(201).send("Usuario registrado");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error interno del servidor");
    }
};

type UserCurrentDataType = {
    id:string,
    email:string,
    privileges: "admin" | "user" | "moderator"
    name:string,
    user_data?: {
        billing?: {
            tier?: string;
            ai_task_credits?: number;
        };
    }
}

export const getCurrentUserData = (req: Request):UserCurrentDataType|null =>{
    const user = req.user
    if (!user) {
            return null;
        }

        return user as UserCurrentDataType
}

/**
 * @admin_only
 * @security_critical
 * Devuelve todos los usuarios, asegurarte de establecer un middleware de administración antes de invocar esta función
 */
export const getUsers = async (req: Request, res: Response) => {
    try {
        const { rows } = await pool.query(
            "SELECT id, name, email, privileges FROM users ORDER BY id",
        );
        res.json(rows);
    } catch {
        res.status(500).json({ error: "Error al obtener usuarios" });
    }
};

const userService = new UserService();

export const updateAdminUser = async (req: Request, res: Response) => {
    const userIdParam = req.params.id;
    const { name, email, password, privileges, status, user_data } = req.body as UpdateUserData;

    const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;

    if (!userId) {
        res.status(400).json({ error: "ID inválido" });
        return;
    }

    const payload: UpdateUserData = {};

    if (name !== undefined) {
        payload.name = name;
    }

    if (email !== undefined) {
        payload.email = email;
    }

    if (password !== undefined) {
        payload.password = password;
    }

    if (privileges !== undefined) {
        payload.privileges = privileges;
    }

    if (status !== undefined) {
        payload.status = status;
    }

    if (user_data !== undefined) {
        payload.user_data = user_data;
    }

    if (Object.keys(payload).length === 0) {
        res.status(400).json({ error: "No hay datos para actualizar" });
        return;
    }

    try {
        const updatedUser = await userService.updateUser(userId, payload);
        res.json(updatedUser);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Error al actualizar usuario";

        if (message === "Usuario no encontrado") {
            res.status(404).json({ error: message });
            return;
        }

        if (message === "No hay datos para actualizar") {
            res.status(400).json({ error: message });
            return;
        }

        console.error("Error al actualizar usuario:", error);
        res.status(500).json({ error: "Error al actualizar usuario" });
    }
};

export const updateAdminUserPlan = async (req: Request, res: Response) => {
    const userIdParam = req.params.id;
    const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
    const body = req.body as UpdatePlanData;

    if (!userId) {
        res.status(400).json({ error: "ID inválido" });
        return;
    }

    if (
        body.tier !== undefined &&
        body.tier !== "free" &&
        body.tier !== "pro" &&
        body.tier !== "vip"
    ) {
        res.status(400).json({ error: "Tier inválido" });
        return;
    }

    if (
        body.durationMonths !== undefined &&
        body.durationMonths !== 1 &&
        body.durationMonths !== 3 &&
        body.durationMonths !== 12
    ) {
        res.status(400).json({ error: "Duración inválida" });
        return;
    }

    if (body.tier && body.tier !== "free" && body.durationMonths === undefined) {
        res.status(400).json({ error: "La duración del plan es requerida" });
        return;
    }

    try {
        const billing = await userService.updatePlan(userId, body);
        res.json({
            message: "Plan actualizado correctamente",
            billing,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Error al actualizar el plan";

        if (message === "Usuario no encontrado") {
            res.status(404).json({ error: message });
            return;
        }

        console.error("Error al actualizar el plan:", error);
        res.status(500).json({ error: "Error al actualizar el plan" });
    }
};
