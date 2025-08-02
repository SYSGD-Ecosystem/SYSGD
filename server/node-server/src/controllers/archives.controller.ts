import type { Request, Response } from "express";
import { pool } from "../db";

export interface User {
	id: number;
	username: string;
	privileges: string;
	// otras propiedades
}

export const getArchives = async (req: Request, res: Response) => {
	console.log("la funcion de ontener archivos se esta ejecutando");
	const user: User = req.user as User;
	console.log(user);
	if (!user || !user.id || !user.username || !user.privileges) {
		res.status(401).json({ error: "Usuario no autenticado" });
		return;
	}
	const user_id = user.id;
	const privileges = user.privileges;

	try {
		const baseQuery = `
        SELECT
          d.id,
          d.code,
          d.company,
          d.name,
          d.created_at,
          u.name AS creator_name
        FROM document_management_file d
        JOIN users u ON d.user_id = u.id
      `;

		const result =
			privileges === "admin"
				? await pool.query(baseQuery)
				: await pool.query(`${baseQuery} WHERE d.user_id = $1`, [user_id]);

		res.json(result.rows);
	} catch (err) {
		console.error("Error al obtener archivos:", err);
		res.status(500).json({ error: "Error al obtener los datos" });
	}
};
