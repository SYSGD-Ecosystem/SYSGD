import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { findAuthUserById, type AuthUser } from "../services/authService";

dotenv.config();

if (!process.env.JWT_SECRET) {
	throw new Error("Falta definir JWT_SECRET en variables de entorno");
}

const JWT_SECRET = process.env.JWT_SECRET;

export function verifyToken(token: string) {
	try {
		return jwt.verify(token, JWT_SECRET);
	} catch (err) {
		console.error("Token verification error:", err);
		return null;
	}
}

/**
 * Extrae el user id de un payload verificado.
 * Formato actual: { sub } (nada de PII en el token).
 * Formato legado: { id, email, name, privileges } — los tokens emitidos
 * antes de la migración siguen siendo válidos hasta que expiren.
 */
export function getAuthSubject(decoded: unknown): string | null {
	if (!decoded || typeof decoded !== "object") return null;
	const payload = decoded as { sub?: unknown; id?: unknown };
	if (typeof payload.sub === "string" && payload.sub.length > 0) {
		return payload.sub;
	}
	if (typeof payload.id === "string" && payload.id.length > 0) {
		return payload.id;
	}
	return null;
}

const getTokenFromRequest = (req: Request): string | null => {
	const authHeader = req.headers.authorization;
	const tokenFromHeader = authHeader?.startsWith("Bearer ")
		? authHeader.split(" ")[1]
		: null;
	return tokenFromHeader || req.cookies?.token || null;
};

/**
 * Verifica la firma del token y hidrata el usuario desde la base de datos.
 * El token solo identifica; los datos del usuario viven en la DB para que
 * privilegios/estado estén siempre frescos y borrar invalide el acceso.
 */
export const isAuthenticated = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const token = getTokenFromRequest(req);

	if (!token) {
		res.status(401).json({ message: "Token no proporcionado" });
		return;
	}

	let decoded: unknown;
	try {
		decoded = jwt.verify(token, JWT_SECRET);
	} catch (err) {
		console.error(err);
		res.status(403).json({ message: "Token inválido o expirado" });
		return;
	}

	const subject = getAuthSubject(decoded);
	if (!subject) {
		res.status(403).json({ message: "Token inválido o expirado" });
		return;
	}

	let user: AuthUser | null;
	try {
		user = await findAuthUserById(subject);
	} catch (err) {
		console.error("Error hidratando usuario desde el token:", err);
		res.status(500).json({ message: "Error interno de autenticación" });
		return;
	}

	if (!user) {
		res.status(401).json({ message: "La cuenta asociada al token ya no existe" });
		return;
	}

	req.user = user;
	next();
};

/**
 * Igual que isAuthenticated pero no falla si no hay token:
 * decodifica e hidrata el usuario si el token es válido y continúa siempre.
 * Útil para endpoints públicos que enriquecen la respuesta para usuarios logueados.
 */
export const optionalAuth = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const token = getTokenFromRequest(req);

	if (!token) {
		next();
		return;
	}

	let decoded: unknown;
	try {
		decoded = jwt.verify(token, JWT_SECRET);
	} catch {
		// Token inválido o expirado: se trata como anónimo
		next();
		return;
	}

	const subject = getAuthSubject(decoded);
	if (!subject) {
		next();
		return;
	}

	try {
		const user = await findAuthUserById(subject);
		if (user) {
			req.user = user;
		}
	} catch (err) {
		console.error("Error hidratando usuario (optionalAuth):", err);
	}
	next();
};
