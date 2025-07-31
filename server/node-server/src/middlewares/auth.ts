import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
	if (req.session.user) {
		next();
	} else {
		res.status(401).json({ error: "No estás logeado" });
	}
}

export function isAdmin(req: Request, res: Response, next: NextFunction) {
	if (req.session.user?.privileges !== "admin") {
		return res.status(403).json({ error: "Solo para admins" });
	}
	next();
}

if (!process.env.JWT_SECRET) {
	throw new Error("Falta definir JWT_SECRET en variables de entorno");
}

const JWT_SECRET = process.env.JWT_SECRET;


// Middleware para verificar el JWT
export const isAuthenticateJWT = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const authHeader = req.headers.authorization;
	if (!authHeader) {
		return res.status(401).json({ message: "Token no proporcionado" });
	}

	const token = authHeader.split(" ")[1];
	jwt.verify(token, JWT_SECRET, (err, decoded) => {
		if (err) {
			return res.status(403).json({ message: "Token inválido" });
		}

		req.user = decoded as {
			userId: number;
			username: string;
			privileges: string;
		};
		next();
	});
};

