import type { Request, Response, NextFunction } from "express";

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
