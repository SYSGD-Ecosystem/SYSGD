import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { findUserByUsername, logUserLogin } from "../services/authService";

dotenv.config();

if (!process.env.JWT_SECRET) {
	throw new Error("Falta definir JWT_SECRET en variables de entorno");
}

const JWT_SECRET = process.env.JWT_SECRET;

export const login = async (req: Request, res: Response) => {
	const { username, password } = req.body;
	if (!username || !password) {
		res.status(400).json({ message: "Faltan credenciales" });
		return;
	}

	try {
		const user = await findUserByUsername(username);

		if (user === null) {
			res.status(401).json({ message: "Usuario no encontrado" });
			return;
		}

		const match = await bcrypt.compare(password, user.password);

		if (!match) {
			res.status(402).json({ message: "Contraseña incorrecta" });
			return;
		}

		// Genera el token JWT
		const token = jwt.sign(
			{
				userId: user.id,
				username: user.username,
				privileges: user.privileges,
			},
			JWT_SECRET,
			{ expiresIn: "2h" },
		);

		// Opcional: registrar el login
		await logUserLogin(
			user.id,
			req.ip || "0.0.0.0",
			req.headers["user-agent"] || "",
		);

		res.json({ token });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Error interno del servidor" });
	}
};

