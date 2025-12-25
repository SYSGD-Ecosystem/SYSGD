import type {  Request, Response } from "express";
import { pool } from "../db";
import bcrypt from "bcrypt";


export const register = async (req: Request, res: Response) => {
    //TODO: Implementar verificación de email
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        res.status(400).send("400");
        return;
    }

    let privileges = "user";
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
            "INSERT INTO users (name, email, password, privileges) VALUES ($1, $2, $3, $4)",
            [name, email, hashedPassword, privileges],
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
