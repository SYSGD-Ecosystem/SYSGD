import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { findUserByemail, logUserLogin } from "../services/authService";

dotenv.config();

if (!process.env.JWT_SECRET) {
	throw new Error("Falta definir JWT_SECRET en variables de entorno");
}

const JWT_SECRET = process.env.JWT_SECRET;

export const login = async (req: Request, res: Response) => {
	const { email, password } = req.body;
	if (!email || !password) {
		res.status(400).json({ message: "Faltan credenciales" });
		return;
	}

	try {
		const user = await findUserByemail(email);

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
				id: user.id,
				email: user.email,
				name: user.name,
				privileges: user.privileges,
			},
			JWT_SECRET,
			{ expiresIn: "24h" },
		);

		// Opcional: registrar el login
		await logUserLogin(
			user.id,
			req.ip || "0.0.0.0",
			req.headers["user-agent"] || "",
		);

		res.cookie("token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
			maxAge: 1000 * 60 * 60 * 24,
		});

		res.status(201).send("Login correcto");
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Error interno del servidor" });
	}
};

export const getCurrentUser = async (req: Request, res: Response) => {
	const token = req.cookies.token;

	if (!token) {
		res.status(401).json({ message: "No autorizado" });
		return;
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
		if (err) {
			res.status(401).json({ message: "No autorizado" });
			return;
		}

		const user = decoded;
		res.json(user);
	});
};

export function generateJWT(user: {
	id: number;
	email: string;
	name: string;
	privileges: string;
}) {
	return jwt.sign(
		{
			id: user.id,
			email: user.email,
			name: user.name,
			privileges: user.privileges,
		},
		JWT_SECRET,
		{ expiresIn: "7d" },
	);
}

export const logout = async (req: Request, res: Response) => {
	res.clearCookie("token", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
	});
	res.status(200).json({ message: "Sesión cerrada" });
};
