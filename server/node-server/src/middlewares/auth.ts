import type { Request, Response, NextFunction } from "express";

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
	if (req.session.user) {
		next(); // ✅ Usuario logeado, que pase
	} else {
		res.status(401).json({ error: "No estás logeado" });
	}
}
