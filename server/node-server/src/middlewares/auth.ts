import type { Request, Response, NextFunction } from "express";

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
	if (req.session.user) {
		console.log("Usuario autenticado, continuando con la solicitud");
		next(); // ✅ Usuario logeado, que pase
	} else {
		console.log("Usuario no autenticado, redirigiendo a /login");
		res.status(401).json({ error: "No estás logeado" });
	}
}
