import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import { pool } from "../db";
import {
	ACCESS_TOKEN_MINUTES,
	RefreshInvalidoError,
	crearSesion,
	generarRefreshToken,
	listarSesionesActivas,
	revocarOtrasSesiones,
	revocarPorRefresh,
	revocarSesion,
	rotarRefreshToken,
	SesionNoEncontradaError,
} from "../services/sessions.service";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
	throw new Error("Falta definir JWT_SECRET en variables de entorno");
}

/**
 * El header con el que la app nueva opta al flujo de sesiones.
 *
 * Sin este header el login se comporta EXACTAMENTE como antes: mismo token de
 * 7/30 dias, sin sesion, sin refresh. Asi la app actual de los 470 usuarios no
 * se ve afectada en absoluto. La app nueva lo envia y entra al flujo corto.
 */
export const HEADER_SESIONES = "x-session-flow";

interface UserPayload {
	id: string;
	email: string;
	name: string;
	privileges: string;
}

/** Access token corto. Si se filtra, el dano maximo es 15 minutos. */
export const generateAccessToken = (user: UserPayload) =>
	jwt.sign(
		{
			sub: user.id,
		},
		JWT_SECRET as string,
		{ expiresIn: `${ACCESS_TOKEN_MINUTES}m` },
	);

/** Trae el usuario del access token verificado por isAuthenticated. */
const usuarioDeRequest = (req: Request): UserPayload => {
	const u = req.user as unknown as UserPayload;
	return { id: u.id, email: u.email, name: u.name, privileges: u.privileges };
};

export const refresh = async (req: Request, res: Response) => {
	const refreshToken = req.body?.refreshToken;

	if (!refreshToken) {
		res.status(400).json({ message: "Falta el refreshToken" });
		return;
	}

	try {
		const rotado = await rotarRefreshToken(
			refreshToken,
			req.ip || null,
			req.headers["user-agent"] || null,
		);

		const { rows } = await pool.query(
			`SELECT id, email, name, privileges FROM users WHERE id = $1`,
			[rotado.userId],
		);

		if (rows.length === 0) {
			res.status(401).json({ message: "El usuario ya no existe" });
			return;
		}

		const user: UserPayload = rows[0];

		res.status(200).json({
			message: "Sesión renovada",
			token: generateAccessToken(user),
			refreshToken: rotado.nuevoRefreshToken,
			sessionId: rotado.sessionId,
			user,
		});
	} catch (err) {
		if (err instanceof RefreshInvalidoError) {
			res.status(401).json({ message: err.message });
			return;
		}
		console.error("Error en refresh:", err);
		res.status(500).json({ message: "Error interno del servidor" });
	}
};

/**
 * Logout que SI revoca.
 *
 * Idempotente y sin exigir access token valido, porque la app vieja llama a
 * esto sin mandar refreshToken y no debe romperse. Sin refresh simply no hay
 * sesion que revocar: el comportamiento es el de antes, solo que ahora cuando
 * si hay, la sesion muere de verdad.
 */
export const logout = async (req: Request, res: Response) => {
	const refreshToken = req.body?.refreshToken;

	if (refreshToken) {
		try {
			await revocarPorRefresh(refreshToken, "logout");
		} catch (err) {
			// Nunca fallar el logout por un error de revocacion: el usuario
			// siempre tiene que poder salir.
			console.error("Error revocando sesion en logout:", err);
		}
	}

	res.clearCookie("token", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
	});

	res.status(200).json({ message: "Sesión cerrada" });
};

/** Dispositivos con sesion activa. Permite al usuario ver y cerrar accesos. */
export const listarDispositivos = async (req: Request, res: Response) => {
	try {
		const user = usuarioDeRequest(req);
		const sesiones = await listarSesionesActivas(user.id);

		res.status(200).json({
			message: "Sesiones activas",
			sessions: sesiones.map((s) => ({
				id: s.id,
				deviceNombre: s.device_nombre,
				ip: s.ip,
				createdAt: s.created_at,
				lastSeenAt: s.last_seen_at,
				expiresAt: s.expires_at,
			})),
		});
	} catch (err) {
		console.error("Error listando sesiones:", err);
		res.status(500).json({ message: "Error interno del servidor" });
	}
};

/** Cierra una sesion puntual del propio usuario. */
export const cerrarSesion = async (req: Request, res: Response) => {
	try {
		const user = usuarioDeRequest(req);
		await revocarSesion(user.id, String(req.params.id));
		res.status(200).json({ message: "Sesión cerrada" });
	} catch (err) {
		if (err instanceof SesionNoEncontradaError) {
			res.status(404).json({ message: err.message });
			return;
		}
		console.error("Error cerrando sesion:", err);
		res.status(500).json({ message: "Error interno del servidor" });
	}
};

/** Cierra todas menos la actual. Util si uno duda de donde se conecto. */
export const cerrarOtrasSesiones = async (req: Request, res: Response) => {
	try {
		const user = usuarioDeRequest(req);
		const sessionId = req.body?.sessionId;

		if (!sessionId) {
			res.status(400).json({ message: "Falta el sessionId actual" });
			return;
		}

		const cerradas = await revocarOtrasSesiones(user.id, sessionId);
		res.status(200).json({
			message: `Se cerraron ${cerradas} sesión(es)`,
			cerradas,
		});
	} catch (err) {
		console.error("Error cerrando otras sesiones:", err);
		res.status(500).json({ message: "Error interno del servidor" });
	}
};

/** Reexportado para que auth.ts lo use al crear la sesion del login. */
export { crearSesion, generarRefreshToken };