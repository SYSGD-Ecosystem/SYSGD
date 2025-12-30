/**
 * @deprecated
 * Estas viendo la primera version de la api, este archivo debe ser refactorizado
 */

import { Router, type Request, type Response } from "express";
import { pool } from "../db";
import bcrypt from "bcrypt";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { login, logout } from "../controllers/auth";
import { getCurrentUser } from "../controllers/auth";
import { getCurrentUserData } from "../controllers/users";
import { getArchives } from "../controllers/archives.controller";
import { isAdmin } from "../middlewares/auth";

const router = Router();

router.get("/archives", isAuthenticated, getArchives);

/**
 * DELETE /api/archives/:id
 * Elimina un expediente (archivo de gestión) por id.
 * Solo el propietario o admin puede eliminarlo.
 */
router.delete(
	"/archives/:id",
	isAuthenticated,
	async (req: Request, res: Response) => {
		const { id } = req.params;
		const user = getCurrentUserData(req);
		const user_id = user?.id;
		const privileges = user?.privileges;

		try {
			const result = await pool.query(
				"SELECT user_id FROM document_management_file WHERE id = $1",
				[id],
			);

			if (
				result.rows.length === 0 ||
				(privileges !== "admin" && result.rows[0].user_id !== user_id)
			) {
				res
					.status(403)
					.json({ error: "No tienes permisos para eliminar este expediente." });
				return;
			}

			await pool.query("DELETE FROM document_management_file WHERE id = $1", [
				id,
			]);
			res.json({ message: "Expediente eliminado correctamente" });
		} catch (err) {
			res.status(500).json({ error: "Error al eliminar el expediente" });
		}
	},
);

/**
 * PUT /api/archives/:id
 * Modifica los datos principales de un expediente (code, company, name).
 * Solo el propietario o admin puede modificarlo.
 */
router.put(
	"/archives/:id",
	isAuthenticated,
	async (req: Request, res: Response) => {
		const { id } = req.params;
		const { code, company, name } = req.body;
		const user = getCurrentUserData(req);
		const user_id = user?.id;
		const privileges = user?.privileges;

		if (!code && !company && !name) {
			res.status(400).json({ error: "No hay datos para actualizar" });
			return;
		}

		try {
			const result = await pool.query(
				"SELECT user_id FROM document_management_file WHERE id = $1",
				[id],
			);

			if (
				result.rows.length === 0 ||
				(privileges !== "admin" && result.rows[0].user_id !== user_id)
			) {
				res.status(403).json({
					error: "No tienes permisos para modificar este expediente.",
				});
				return;
			}

			const fields = [];
			const values = [];
			let idx = 1;
			if (code) {
				fields.push(`code = $${idx++}`);
				values.push(code);
			}
			if (company) {
				fields.push(`company = $${idx++}`);
				values.push(company);
			}
			if (name) {
				fields.push(`name = $${idx++}`);
				values.push(name);
			}
			values.push(id);

			await pool.query(
				`UPDATE document_management_file SET ${fields.join(
					", ",
				)} WHERE id = $${idx}`,
				values,
			);

			res.json({ message: "Expediente actualizado correctamente" });
		} catch (err) {
			res.status(500).json({ error: "Error al actualizar el expediente" });
		}
	},
);

// GET /api/get_data?id=ABC123
router.get(
	"/get_data",
	isAuthenticated,
	async (req: Request, res: Response) => {
		const { id } = req.query;
		if (typeof id !== "string") {
			res.status(400).json({ error: "Id inválido" });
			return;
		}
		const user = getCurrentUserData(req);
		const user_id = user?.id;

		try {
			const result = await pool.query(
				"SELECT classification_chart FROM document_management_file WHERE id = $1 AND user_id = $2",
				[id, user_id],
			);
			res.json(result.rows);
		} catch (err) {
			res.status(500).json({ error: "Error al obtener los datos" });
		}
	},
);

// POST /api/create_new_classification_box
router.post("/create", isAuthenticated, async (req: Request, res: Response) => {
	const { company, code, name } = req.body;
	if (!company || !code || !name) {
		res.status(400).send("400");
		return;
	}

	const user = getCurrentUserData(req);
	const user_id = user?.id;

	try {
		await pool.query(
			"INSERT INTO document_management_file (code, company, name, user_id) VALUES ($1, $2, $3, $4)",
			[code, company, name, user_id],
		);
		res.status(201).send("201");
	} catch (err) {
		res.status(500).send("500");
	}
});

// POST /api/add_classification_data
router.post(
	"/add_classification_data",
	isAuthenticated,
	async (req: Request, res: Response) => {
		const { id, data } = req.body;
		if (!id || !data) {
			res.status(400).send("400");
			return;
		}

		try {
			await pool.query(
				"UPDATE document_management_file SET classification_chart = $1 WHERE id = $2",
				[data, id],
			);
			res.status(201).send("201");
		} catch (err) {
			res.status(500).send("500");
		}
	},
);

router.post("/add-document-entry", isAuthenticated, async (req, res) => {
	const { id, data } = req.body;

	if (!id || !data) {
		res.status(400).json({ error: "Faltan campos obligatorios." });
		return;
	}

	const user = getCurrentUserData(req);
	const user_id = user?.id;

	if (!user_id) {
		res.status(401).json({ error: "No estás autorizado." });
		return;
	}

	const result = await pool.query(
		"SELECT user_id FROM document_management_file WHERE id = $1",
		[id],
	);

	if (
		result.rows.length === 0 ||
		(user.privileges !== "admin" && result.rows[0].user_id !== user_id)
	) {
		res
			.status(403)
			.json({ error: "No tienes permisos para modificar este expediente." });
		return;
	}

	try {
		await pool.query(
			"UPDATE document_management_file SET entry_register = $1 WHERE id = $2",
			[data, id],
		);
		res.status(201).send("201");
	} catch (err) {
		res.status(500).send("500");
	}
});

// GET /api/get-document-entry?id=123
router.get(
	"/get-document-entry",
	isAuthenticated,
	async (req: Request, res: Response) => {
		const { id } = req.query;
		if (typeof id !== "string") {
			res.status(400).json({ error: "Id inválido" });
			return;
		}
		const user = getCurrentUserData(req);
		const user_id = user?.id;

		try {
			const result = await pool.query(
				"SELECT entry_register FROM document_management_file WHERE id = $1 AND user_id = $2",
				[id, user_id],
			);
			res.json(result.rows);
		} catch (err) {
			res.status(500).json({ error: "Error al obtener los datos" });
		}
	},
);

router.post("/add-document-exit", isAuthenticated, async (req, res) => {
	const { id, data } = req.body;

	if (!id || !data) {
		res.status(400).json({ error: "Faltan campos obligatorios." });
		return;
	}

	const user = getCurrentUserData(req);
	const user_id = user?.id;
	const privileges = user?.privileges;

	if (!user_id) {
		res.status(401).json({ error: "No estás autorizado." });
		return;
	}

	const result = await pool.query(
		"SELECT user_id FROM document_management_file WHERE id = $1",
		[id],
	);

	if (
		result.rows.length === 0 ||
		(privileges !== "admin" && result.rows[0].user_id !== user_id)
	) {
		res
			.status(403)
			.json({ error: "No tienes permisos para modificar este expediente." });
		return;
	}

	try {
		await pool.query(
			"UPDATE document_management_file SET exit_register = $1 WHERE id = $2",
			[data, id],
		);
		res.status(201).send("201");
	} catch (err) {
		res.status(500).send("500");
	}
});

// GET /api/users - lista usuarios (solo admin)
router.get("/users", isAuthenticated, async (req, res) => {
	const user = getCurrentUserData(req);
	const privileges = user?.privileges;

	if (privileges !== "admin") {
		res.status(403).json({ error: "No autorizado" });
		return;
	}
	try {
		const result = await pool.query(
			"SELECT id, name, email, privileges FROM users ORDER BY id",
		);
		res.json(result.rows);
	} catch {
		res.status(500).json({ error: "Error al obtener usuarios" });
	}
});

// POST /api/users - crear usuario (solo admin)
router.post("/users", isAuthenticated, async (req, res) => {
	const user = getCurrentUserData(req);

	if (user?.privileges !== "admin") {
		res.status(403).json({ error: "No autorizado" });
		return;
	}
	const { name, email, password, privileges } = req.body;
	if (!name || !email || !password || !privileges) {
		res.status(400).json({ error: "Faltan datos" });
		return;
	}
	try {
		await pool.query(
			"INSERT INTO users (name, email, password, privileges) VALUES ($1,$2,crypt($3, gen_salt('bf')),$4)",
			[name, email, password, privileges],
		);
		res.status(201).send("201");
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	} catch (e: any) {
		if (e.code === "23505")
			res.status(409).json({ error: "Usuario ya existe" });
		else res.status(500).json({ error: "Error servidor" });
	}
});
router.get("/admin/users", isAuthenticated, async (req, res) => {
	const user = getCurrentUserData(req);
	const privileges = user?.privileges;

	if (privileges !== "admin") {
		res.status(403).json({ error: "Acceso denegado" });
		return;
	}
	try {
		const result = await pool.query(
			"SELECT id, name, email, privileges FROM users ORDER BY id",
		);
		res.json(result.rows);
	} catch {
		res.status(500).json({ error: "Error al obtener usuarios" });
	}
});

// POST /api/admin/users
router.post("/admin/users", isAuthenticated, async (req, res) => {
	const user = getCurrentUserData(req);
	if (!user) return;

	if (user.privileges !== "admin") {
		res.status(403).json({ error: "Acceso denegado" });
		return;
	}
	const { name, email, password, privileges } = req.body;
	if (!name || !email || !password || !privileges) {
		res.status(400).json({ error: "Faltan datos obligatorios." });
		return;
	}
	try {
		await pool.query(
			"INSERT INTO users (name, email, password, privileges) VALUES ($1,$2,crypt($3, gen_salt('bf')),$4)",
			[name, email, password, privileges],
		);
		res.status(201).send("201");
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	} catch (e: any) {
		if (e.code === "23505") res.status(409).json({ error: "Usuario existe" });
		else res.status(500).json({ error: "Error al crear usuario" });
	}
});

// PUT /api/admin/users/:id
router.put("/admin/users/:id", isAuthenticated, isAdmin, async (req, res) => {
	const { id } = req.params;
	const { name, email, password, privileges } = req.body;
	if (!id) {
		res.status(400).json({ error: "Id requerido" });
		return;
	}
	try {
		await pool.query(
			"UPDATE users SET name = COALESCE($1,name), email = COALESCE($2,email), password = COALESCE(crypt($3, gen_salt('bf')),password), privileges = COALESCE($4,privileges) WHERE id = $5",
			[name, email, password || null, privileges, id],
		);
		res.sendStatus(204);
	} catch {
		res.status(500).json({ error: "Error al actualizar" });
	}
});

// DELETE /api/admin/users/:id
router.delete(
	"/admin/users/:id",
	isAuthenticated,
	isAdmin,
	async (req, res) => {
		const { id } = req.params;
		try {
			await pool.query("DELETE FROM users WHERE id = $1", [id]);
			res.sendStatus(204);
		} catch {
			res.status(500).json({ error: "Error al eliminar" });
		}
	},
);

// GET /api/get-organization-chart?id=FILEID
router.get("/get-organization-chart", isAuthenticated, async (req, res) => {
	const { id } = req.query;
	if (!id) {
		res.status(400).json({ error: "Falta id" });
		return;
	}
	try {
		const result = await pool.query(
			"SELECT data FROM organization_chart WHERE file_id = $1",
			[id],
		);
		if (result.rows.length === 0) {
			res.json(null);
			return;
		}
		res.json(result.rows[0].data);
	} catch (error) {
		res.status(500).json({ error: "Error al obtener organigrama" });
	}
});

// POST /api/save-organization-chart {id, data}
router.post("/save-organization-chart", isAuthenticated, async (req, res) => {
	const { id, data } = req.body;
	if (!id || !data) {
		res.status(400).json({ error: "Faltan datos" });
		return;
	}

	const user = getCurrentUserData(req);
	const userId = user?.id;

	if (!userId) {
		res.status(401).json({ error: "No autorizado" });
		return;
	}
	try {
		// check ownership or admin
		const ownerCheck = await pool.query(
			"SELECT user_id FROM document_management_file WHERE id = $1",
			[id],
		);
		if (ownerCheck.rows.length === 0) {
			res.status(404).json({ error: "Archivo no encontrado" });
			return;
		}
		if (ownerCheck.rows[0].user_id !== userId && user?.privileges !== "admin") {
			res.status(403).json({ error: "Sin permisos" });
			return;
		}
		await pool.query(
			"INSERT INTO organization_chart(file_id,data) VALUES ($1,$2) ON CONFLICT (file_id) DO UPDATE SET data = EXCLUDED.data",
			[id, data],
		);
		res.status(201).send("201");
	} catch (error) {
		res.status(500).json({ error: "Error al guardar organigrama" });
	}
});

// POST /api/add-retention-schedule
router.post("/add-retention-schedule", isAuthenticated, async (req, res) => {
	const { id, data } = req.body;
	if (!id || !data) {
		res.status(400).json({ error: "Faltan campos obligatorios." });
		return;
	}
	const user = getCurrentUserData(req);
	const user_id = user?.id;
	if (!user_id) {
		res.status(401).json({ error: "No estás autorizado." });
		return;
	}
	const result = await pool.query(
		"SELECT user_id FROM document_management_file WHERE id = $1",
		[id],
	);
	if (
		result.rows.length === 0 ||
		(user?.privileges !== "admin" && result.rows[0].user_id !== user_id)
	) {
		res
			.status(403)
			.json({ error: "No tienes permisos para modificar este expediente." });
		return;
	}
	try {
		await pool.query(
			"UPDATE document_management_file SET retention_schedule = $1 WHERE id = $2",
			[data, id],
		);
		res.status(201).send("201");
	} catch {
		res.status(500).send("500");
	}
});

// POST /api/add-document-topographic
router.post("/add-document-topographic", isAuthenticated, async (req, res) => {
	const { id, data } = req.body;

	if (!id || !data) {
		res.status(400).json({ error: "Faltan campos obligatorios." });
		return;
	}
	const user = getCurrentUserData(req);
	const user_id = user?.id;
	if (!user_id) {
		res.status(401).json({ error: "No estás autorizado." });
		return;
	}

	const result = await pool.query(
		"SELECT user_id FROM document_management_file WHERE id = $1",
		[id],
	);

	if (
		result.rows.length === 0 ||
		(user?.privileges !== "admin" && result.rows[0].user_id !== user_id)
	) {
		res
			.status(403)
			.json({ error: "No tienes permisos para modificar este expediente." });
		return;
	}

	try {
		await pool.query(
			"UPDATE document_management_file SET topographic_register = $1 WHERE id = $2",
			[data, id],
		);
		res.status(201).send("201");
	} catch {
		res.status(500).send("500");
	}
});

// POST /api/add-document-loan
router.post("/add-document-loan", isAuthenticated, async (req, res) => {
	const { id, data } = req.body;

	if (!id || !data) {
		res.status(400).json({ error: "Faltan campos obligatorios." });
		return;
	}
	const user = getCurrentUserData(req);
	const user_id = user?.id;
	if (!user_id) {
		res.status(401).json({ error: "No estás autorizado." });
		return;
	}

	const result = await pool.query(
		"SELECT user_id FROM document_management_file WHERE id = $1",
		[id],
	);

	if (
		result.rows.length === 0 ||
		(user?.privileges !== "admin" && result.rows[0].user_id !== user_id)
	) {
		res
			.status(403)
			.json({ error: "No tienes permisos para modificar este expediente." });
		return;
	}

	try {
		await pool.query(
			"UPDATE document_management_file SET loan_register = $1 WHERE id = $2",
			[data, id],
		);
		res.status(201).send("201");
	} catch {
		res.status(500).send("500");
	}
});

// GET /api/get-document-exit?id=123
router.get(
	"/get-document-exit",
	isAuthenticated,
	async (req: Request, res: Response) => {
		const { id } = req.query;
		if (typeof id !== "string") {
			res.status(400).json({ error: "Id inválido" });
			return;
		}
		const user = getCurrentUserData(req);
		const user_id = user?.id;
		try {
			const result = await pool.query(
				"SELECT exit_register FROM document_management_file WHERE id = $1 AND user_id = $2",
				[id, user_id],
			);
			res.json(result.rows);
		} catch (err) {
			res.status(500).json({ error: "Error al obtener los datos" });
		}
	},
);

// GET /api/get-retention-schedule?id=123
router.get(
	"/get-retention-schedule",
	isAuthenticated,
	async (req: Request, res: Response) => {
		const { id } = req.query;
		if (typeof id !== "string") {
			res.status(400).json({ error: "Id inválido" });
			return;
		}
		const user = getCurrentUserData(req);
		const user_id = user?.id;
		try {
			const result = await pool.query(
				"SELECT retention_schedule FROM document_management_file WHERE id = $1 AND user_id = $2",
				[id, user_id],
			);
			res.json(result.rows);
		} catch {
			res.status(500).json({ error: "Error al obtener los datos" });
		}
	},
);

// GET /api/get-document-topographic?id=123
router.get(
	"/get-document-topographic",
	isAuthenticated,
	async (req: Request, res: Response) => {
		const { id } = req.query;
		if (typeof id !== "string") {
			res.status(400).json({ error: "Id inválido" });
			return;
		}
		const user = getCurrentUserData(req);
		const user_id = user?.id;
		try {
			const result = await pool.query(
				"SELECT topographic_register FROM document_management_file WHERE id = $1 AND user_id = $2",
				[id, user_id],
			);
			res.json(result.rows);
		} catch {
			res.status(500).json({ error: "Error al obtener los datos" });
		}
	},
);

// GET /api/get-document-loan?id=123
router.get(
	"/get-document-loan",
	isAuthenticated,
	async (req: Request, res: Response) => {
		const { id } = req.query;
		if (typeof id !== "string") {
			res.status(400).json({ error: "Id inválido" });
			return;
		}
		const user = getCurrentUserData(req);
		const user_id = user?.id;
		try {
			const result = await pool.query(
				"SELECT loan_register FROM document_management_file WHERE id = $1 AND user_id = $2",
				[id, user_id],
			);
			res.json(result.rows);
		} catch {
			res.status(500).json({ error: "Error al obtener los datos" });
		}
	},
);

/**
 * @swagger
 * /api/status:
 *   get:
 *     summary: Verifica el estado del servidor
 *     tags: [Sistema]
 *     responses:
 *       200:
 *         description: Servidor activo
 */
router.get("/status", async (_req: Request, res: Response) => {
	res.json({ status: "ok", message: "Servidor activo y listo" });
});

router.get("/me", getCurrentUser);

router.post("/register", async (req: Request, res: Response) => {
	//TODO: Implementar verificación de email
	const { name, email, password } = req.body;
	if (!name || !email || !password) {
		res.status(400).send("400");
		return;
	}

	let privileges = "user";
	try {
		const usercount = await pool.query("SELECT id FROM users");

		if (usercount.rows.length === 0) {
			privileges = "admin";
		}

		const userExists = await pool.query(
			"SELECT id FROM users WHERE email = $1",
			[email],
		);
		if (userExists.rows.length > 0) {
			res.status(409).send("Usuario ya existe");
			return;
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		await pool.query(
			"INSERT INTO users (name, email, password, privileges) VALUES ($1, $2, $3, $4)",
			[name, email, hashedPassword, privileges],
		);

		res.status(201).send("Usuario registrado");
	} catch (err) {
		console.error(err);
		res.status(500).send("Error interno del servidor");
	}
});


// GET /api/users - Devuelve todos los usuarios (solo admin)
router.get(
	"/users",
	isAuthenticated,
	isAdmin,
	async (req: Request, res: Response) => {
		try {
			const result = await pool.query(
				"SELECT id, name, email, privileges FROM users",
			);
			res.json(result.rows);
		} catch (err) {
			res.status(500).json({ error: "Error al obtener los usuarios" });
		}
	},
);

// DELETE /api/users/:id - Elimina usuario y sus documentos (solo admin)
router.delete(
	"/users/:id",
	isAuthenticated,
	isAdmin,
	async (req: Request, res: Response) => {
		const userId = Number.parseInt(req.params.id, 10);
		if (Number.isNaN(userId)) {
			res.status(400).json({ error: "ID inválido" });
			return;
		}
		try {
			await pool.query(
				"DELETE FROM document_management_file WHERE user_id = $1",
				[userId],
			);
			const result = await pool.query(
				"DELETE FROM users WHERE id = $1 RETURNING id",
				[userId],
			);
			if (result.rowCount === 0) {
				res.status(404).json({ error: "Usuario no encontrado" });
				return;
			}
			res.json({ message: "Usuario y documentos eliminados" });
		} catch (err) {
			res.status(500).json({ error: "Error al eliminar el usuario" });
		}
	},
);

// PUT /api/users/:id/password - Actualiza la contraseña (solo admin)
router.put(
	"/users/:id/password",
	isAuthenticated,
	isAdmin,
	async (req: Request, res: Response) => {
		const userId = Number.parseInt(req.params.id, 10);
		const { password } = req.body;
		if (Number.isNaN(userId) || !password) {
			res.status(400).json({ error: "Datos inválidos" });
			return;
		}
		try {
			const hashedPassword = await bcrypt.hash(password, 10);
			const result = await pool.query(
				"UPDATE users SET password = $1 WHERE id = $2 RETURNING id",
				[hashedPassword, userId],
			);
			if (result.rowCount === 0) {
				res.status(404).json({ error: "Usuario no encontrado" });
				return;
			}
			res.json({ message: "Contraseña actualizada" });
		} catch (err) {
			res.status(500).json({ error: "Error al actualizar la contraseña" });
		}
	},
);

// PUT /api/users/:id - Actualiza nombre y nombre de usuario (solo admin)
router.put(
	"/users/:id",
	isAuthenticated,
	isAdmin,
	async (req: Request, res: Response) => {
		const userId = Number.parseInt(req.params.id, 10);
		const { name, email } = req.body;
		if (Number.isNaN(userId) || (!name && !email)) {
			res.status(400).json({ error: "Datos inválidos" });
			return;
		}
		try {
			if (email) {
				const exists = await pool.query(
					"SELECT id FROM users WHERE email = $1 AND id <> $2",
					[email, userId],
				);
				if (exists.rows.length > 0) {
					res.status(409).json({ error: "El nombre de usuario ya existe" });
					return;
				}
			}
			const fields = [];
			const values = [];
			let idx = 1;
			if (name) {
				fields.push(`name = $${idx++}`);
				values.push(name);
			}
			if (email) {
				fields.push(`email = $${idx++}`);
				values.push(email);
			}
			values.push(userId);
			const result = await pool.query(
				`UPDATE users SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id`,
				values,
			);
			if (result.rowCount === 0) {
				res.status(404).json({ error: "Usuario no encontrado" });
				return;
			}
			res.json({ message: "Usuario actualizado" });
		} catch (err) {
			res.status(500).json({ error: "Error al actualizar el usuario" });
		}
	},
);

router.get("/user-count", async (_req: Request, res: Response) => {
	try {
		const result = await pool.query(
			"SELECT COUNT(*) FROM users WHERE privileges <> 'admin'",
		);
		res.json({ count: Number(result.rows[0].count) });
	} catch {
		res.status(500).json({ error: "Error al obtener la cantidad de usuarios" });
	}
});

export default router;
