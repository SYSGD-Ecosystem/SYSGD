import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { findUserByemail, logUserLogin } from "../services/authService";
import { pool } from "../db";
import { createDefaultUserData } from "../utils/billing";
import { request } from "node:http";
import { getClientIp, isIpFromCuba } from "../utils/ip";

dotenv.config();

if (!process.env.JWT_SECRET) {
	throw new Error("Falta definir JWT_SECRET en variables de entorno");
}

const JWT_SECRET = process.env.JWT_SECRET;

interface UserPayload {
	id: string;
	email: string;
	name: string;
	privileges: string;
}

export function generateJWT(user: {
	id: string;
	email: string;
	name: string;
	privileges: string;
}) {
	const expiresIn = user.privileges === "admin" ? "30m" : "7d";
	
	return jwt.sign(
		{
			id: user.id,
			email: user.email,
			name: user.name,
			privileges: user.privileges,
		},
		JWT_SECRET as string, 
		{ expiresIn },
	);
}

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

		// Verificar si es un usuario invitado sin contraseña
		if (user.status === "invited" && !user.password) {
			res.status(202).json({
				message: "Usuario invitado detectado",
				status: "invited",
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
					status: user.status,
				},
			});
			return;
		}

		const match = await bcrypt.compare(password, user.password);

		if (!match) {
			res.status(402).json({ message: "Contraseña incorrecta" });
			return;
		}

		if (user.privileges === "admin") {
			const clientIp = getClientIp(req);
			if (!isIpFromCuba(clientIp)) {
				res.status(403).json({ 
					message: "Acceso denegado. El administrador solo puede iniciar sesión desde Cuba.",
					ip: clientIp 
				});
				return;
			}
		}

		// Generamos el token usando el helper
		const token = generateJWT({
			id: user.id,
			email: user.email,
			name: user.name,
			privileges: user.privileges,
		});

		// Opcional: registrar el login
		await logUserLogin(
			user.id,
			req.ip || "0.0.0.0",
			req.headers["user-agent"] || "",
		);

		// 1. Establecemos Cookie (Respaldo / Compatibilidad Web)
		res.cookie("token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
			maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días para coincidir con el token
		});

		// 2. Enviamos Token en JSON (Para Axios, Mobile, Electron)
		res.status(201).json({
			message: "Login correcto",
			token: token, 
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				privileges: user.privileges,
			},
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Error interno del servidor" });
	}
};

// Verificación por email para flujo en 2 pasos
export const checkUser = async (req: Request, res: Response) => {
	const { email } = req.body;
	if (!email) {
		res.status(400).json({ message: "Falta email" });
		return;
	}

	try {
		const user = await findUserByemail(email);
		if (!user) {
			res.status(404).json({ exists: false });
			return;
		}
		res.status(200).json({
			exists: true,
			id: user.id,
			status: user.status,
			hasPassword: !!user.password,
			privileges: user.privileges,
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Error interno del servidor" });
	}
};

export const getCurrentUser = async (req: Request, res: Response) => {
	// 1. Estrategia Híbrida: Header 'Authorization' O Cookie 'token'
	const authHeader = req.headers.authorization;
	const tokenFromHeader = authHeader?.startsWith("Bearer ")
		? authHeader.split(" ")[1]
		: null;

	const token = tokenFromHeader || req.cookies?.token;

	if (!token) {
		console.log("No token found");
		res.status(401).json({ message: "No autorizado" });
		return;
	}

	try {
		// Verificación síncrona sin callback (más limpio y type-safe)
		const decoded = jwt.verify(token, JWT_SECRET as string) as UserPayload;

		res.json({
			id: decoded.id,
			name: decoded.name,
			email: decoded.email,
			privileges: decoded.privileges,
		});
		console.log("User decoded:", decoded);
	} catch (err) {
		console.error("JWT verification error:", err);
		// Token inválido o expirado
		res.status(401).json({ message: "Sesión inválida o expirada" });
	}
};

export const completeInvitedUserRegistration = async (
	req: Request,
	res: Response,
) => {
	const { userId, name, password } = req.body;

	if (!userId || !name || !password) {
		res.status(400).json({ message: "Faltan datos requeridos" });
		return;
	}

	try {
		const defaultUserData = createDefaultUserData();
		// Verificar que el usuario existe y está en estado 'invited'
		const userCheck = await findUserByemail(req.body.email);
		if (!userCheck || userCheck.status !== "invited") {
			res
				.status(400)
				.json({ message: "Usuario no válido o ya completó registro" });
			return;
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		await pool.query(
			`UPDATE users 
				 SET name = $1, password = $2, status = 'active', user_data = COALESCE(user_data, $4::jsonb) 
				 WHERE id = $3 AND status = 'invited'`,
			[name, hashedPassword, userId, JSON.stringify(defaultUserData)],
		);

		// Generar token
		const token = generateJWT({
			id: userId,
			email: req.body.email,
			name: name,
			privileges: userCheck.privileges,
		});

		// Cookie de respaldo
		res.cookie("token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
			maxAge: 1000 * 60 * 60 * 24 * 7,
		});

		// Respuesta JSON con Token
		res.status(201).json({
			message: "Registro completado exitosamente",
			token: token, // <--- Importante devolverlo aquí también
			user: {
				id: userId,
				email: req.body.email,
				name: name,
				status: "active",
			},
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Error interno del servidor" });
	}
};

export const issueExternalToken = async (req: Request, res: Response) => {
	const user = req.user as UserPayload | undefined;

	if (!user) {
		res.status(401).json({ message: "No autorizado" });
		return;
	}

	const token = generateJWT({
		id: user.id,
		email: user.email,
		name: user.name,
		privileges: user.privileges,
	});

	res.status(200).json({
		message: "Token generado para acceso externo",
		token,
		tokenType: "Bearer",
		expiresIn: "7d",
	});
};

export const logout = async (req: Request, res: Response) => {
	// Limpiamos la cookie del servidor
	res.clearCookie("token", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
	});

	// El frontend se encargará de borrar el localStorage al recibir esta respuesta
	res.status(200).json({ message: "Sesión cerrada" });
};
