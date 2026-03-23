import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

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

export const isAuthenticated = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	// const token = req.cookies?.token;
	const authHeader = req.headers.authorization;
	
	const tokenFromHeader = authHeader?.startsWith("Bearer ")
		? authHeader.split(" ")[1]
		: null;

	const token = tokenFromHeader || req.cookies?.token;

	if (!token) {
		res.status(401).json({ message: "Token no proporcionado" });
		return;
	}

	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		// Guardamos info del usuario en la request para accederla después
		req.user = decoded;
		next();
	} catch (err) {
		console.error(err);
		res.status(403).json({ message: "Token inválido o expirado" });
	}
};
