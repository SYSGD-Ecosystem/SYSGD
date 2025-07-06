import { Router, type Request, type Response } from "express";
import { pool } from "../index";
import bcrypt from "bcrypt";
import { isAuthenticated } from "../middlewares/auth";

const router = Router();

router.get(
	"/archives",
	isAuthenticated,
	async (req: Request, res: Response) => {
		const user_id = req.session.user?.id;

		try {
			if (req.session.user?.privileges === "admin") {
				const result = await pool.query(
					"SELECT id, code, company, name FROM document_management_file",
				);
				res.json(result.rows);
			} else {
				const result = await pool.query(
					"SELECT id, code, company, name FROM document_management_file WHERE user_id = $1",
					[user_id],
				);
				res.json(result.rows);
			}
		} catch (err) {
			res.status(500).json({ error: "Error al obtener los datos" });
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
		const user_id = req.session.user?.id;
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

	const user_id = req.session.user?.id;

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
		console.log(req.body);
		console.log(data);
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

	const user_id = req.session.user?.id;

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
		(req.session.user?.privileges !== "admin" &&
			result.rows[0].user_id !== user_id)
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
		const user_id = req.session.user?.id;
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

	const user_id = req.session.user?.id;

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
		(req.session.user?.privileges !== "admin" &&
			result.rows[0].user_id !== user_id)
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
	if (req.session.user?.privileges !== "admin") {
		res.status(403).json({ error: "No autorizado" });
		return;
	}
	try {
		const result = await pool.query(
			"SELECT id, name, username, privileges FROM users ORDER BY id",
		);
		res.json(result.rows);
	} catch {
		res.status(500).json({ error: "Error al obtener usuarios" });
	}
});

// POST /api/users - crear usuario (solo admin)
router.post("/users", isAuthenticated, async (req, res) => {
	if (req.session.user?.privileges !== "admin") {
		res.status(403).json({ error: "No autorizado" });
		return;
	}
	const { name, username, password, privileges } = req.body;
	if (!name || !username || !password || !privileges) {
		res.status(400).json({ error: "Faltan datos" });
		return;
	}
	try {
		await pool.query(
			"INSERT INTO users (name, username, password, privileges) VALUES ($1,$2,crypt($3, gen_salt('bf')),$4)",
			[name, username, password, privileges],
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
	if (req.session.user?.privileges !== "admin") {
		res.status(403).json({ error: "Acceso denegado" });
		return;
	}
	try {
		const result = await pool.query(
			"SELECT id, name, username, privileges FROM users ORDER BY id",
		);
		res.json(result.rows);
	} catch {
		res.status(500).json({ error: "Error al obtener usuarios" });
	}
});

// POST /api/admin/users
router.post("/admin/users", isAuthenticated, async (req, res) => {
	if (req.session.user?.privileges !== "admin") {
		res.status(403).json({ error: "Acceso denegado" });
		return;
	}
	const { name, username, password, privileges } = req.body;
	if (!name || !username || !password || !privileges) {
		res.status(400).json({ error: "Faltan datos obligatorios." });
		return;
	}
	try {
		await pool.query(
			"INSERT INTO users (name, username, password, privileges) VALUES ($1,$2,crypt($3, gen_salt('bf')),$4)",
			[name, username, password, privileges],
		);
		res.status(201).send("201");
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	} catch (e: any) {
		if (e.code === "23505") res.status(409).json({ error: "Usuario existe" });
		else res.status(500).json({ error: "Error al crear usuario" });
	}
});

// PUT /api/admin/users/:id
router.put("/admin/users/:id", isAuthenticated, async (req, res) => {
	if (req.session.user?.privileges !== "admin") {
		res.status(403).json({ error: "Acceso denegado" });
		return;
	}
	const { id } = req.params;
	const { name, username, password, privileges } = req.body;
	if (!id) {
		res.status(400).json({ error: "Id requerido" });
		return;
	}
	try {
		await pool.query(
			"UPDATE users SET name = COALESCE($1,name), username = COALESCE($2,username), password = COALESCE(crypt($3, gen_salt('bf')),password), privileges = COALESCE($4,privileges) WHERE id = $5",
			[name, username, password || null, privileges, id],
		);
		res.sendStatus(204);
	} catch {
		res.status(500).json({ error: "Error al actualizar" });
	}
});

// DELETE /api/admin/users/:id
router.delete("/admin/users/:id", isAuthenticated, async (req, res) => {
	if (req.session.user?.privileges !== "admin") {
		res.status(403).json({ error: "Acceso denegado" });
		return;
	}
	const { id } = req.params;
	try {
		await pool.query("DELETE FROM users WHERE id = $1", [id]);
		res.sendStatus(204);
	} catch {
		res.status(500).json({ error: "Error al eliminar" });
	}
});

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
	const userId = req.session.user?.id;
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
		if (
			ownerCheck.rows[0].user_id !== userId &&
			req.session.user?.privileges !== "admin"
		) {
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
	const user_id = req.session.user?.id;
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
		(req.session.user?.privileges !== "admin" &&
			result.rows[0].user_id !== user_id)
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

	const user_id = req.session.user?.id;
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
		(req.session.user?.privileges !== "admin" &&
			result.rows[0].user_id !== user_id)
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

	const user_id = req.session.user?.id;
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
		(req.session.user?.privileges !== "admin" &&
			result.rows[0].user_id !== user_id)
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
		const user_id = req.session.user?.id;
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
		const user_id = req.session.user?.id;
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
		const user_id = req.session.user?.id;
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
		const user_id = req.session.user?.id;
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

router.get("/me", isAuthenticated, async (req: Request, res: Response) => {
	res.json(req.session.user);
});

router.post("/register", async (req: Request, res: Response) => {
	//TODO: Implementar verificación de email
	const { name, username, password } = req.body;
	if (!name || !username || !password) {
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
			"SELECT id FROM users WHERE username = $1",
			[username],
		);
		if (userExists.rows.length > 0) {
			res.status(409).send("Usuario ya existe");
			return;
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		await pool.query(
			"INSERT INTO users (name, username, password, privileges) VALUES ($1, $2, $3, $4)",
			[name, username, hashedPassword, privileges],
		);

		res.status(201).send("Usuario registrado");
	} catch (err) {
		console.error(err);
		res.status(500).send("Error interno del servidor");
	}
});

declare module "express-session" {
	interface SessionData {
		user?: {
			id: number;
			username: string;
			name: string;
			privileges: string;
		};
	}
}

router.post("/login", async (req: Request, res: Response) => {
	const { username, password } = req.body;
	if (!username || !password) {
		res.status(400).send("400");
		return;
	}

	try {
		const result = await pool.query("SELECT * FROM users WHERE username = $1", [
			username,
		]);

		if (result.rows.length === 0) {
			res.status(401).send("Usuario no encontrado");
			return;
		}

		const user = result.rows[0];
		const math = await bcrypt.compare(password, user.password);
		if (!math) {
			res.status(402).send("Incorrect Password");
			return;
		}
		console.log("Usuario autenticado:", user);

		req.session.user = {
			id: user.id,
			name: user.name,
			username: user.username,
			privileges: user.privileges,
		};
		console.log(req.session.user);
		res.status(201).send("Login correcto");
	} catch (err) {
		console.error(err);
		res.status(500).send("Error interno del servidor");
	}
});

router.get("/logout", (req, res) => {
	//req.logout?.(() => {}); // Por si usas passport
	req.session.destroy((err) => {
		if (err) console.error(err);
		res.clearCookie("connect.sid");
		res.send("Sesión cerrada");
	});
});

// GET /api/users - Devuelve todos los usuarios (solo admin)
router.get("/users", isAuthenticated, async (req: Request, res: Response) => {
	if (req.session.user?.privileges !== "admin") {
		res.status(403).json({ error: "No autorizado" });
		return;
	}
	try {
		const result = await pool.query(
			"SELECT id, name, username, privileges FROM users",
		);
		res.json(result.rows);
	} catch (err) {
		res.status(500).json({ error: "Error al obtener los usuarios" });
	}
});

// DELETE /api/users/:id - Elimina usuario y sus documentos (solo admin)
router.delete(
	"/users/:id",
	isAuthenticated,
	async (req: Request, res: Response) => {
		if (req.session.user?.privileges !== "admin") {
			res.status(403).json({ error: "No autorizado" });
			return;
		}
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
	async (req: Request, res: Response) => {
		if (req.session.user?.privileges !== "admin") {
			res.status(403).json({ error: "No autorizado" });
			return;
		}
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
	async (req: Request, res: Response) => {
		if (req.session.user?.privileges !== "admin") {
			res.status(403).json({ error: "No autorizado" });
			return;
		}
		const userId = Number.parseInt(req.params.id, 10);
		const { name, username } = req.body;
		if (Number.isNaN(userId) || (!name && !username)) {
			res.status(400).json({ error: "Datos inválidos" });
			return;
		}
		try {
			if (username) {
				const exists = await pool.query(
					"SELECT id FROM users WHERE username = $1 AND id <> $2",
					[username, userId],
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
			if (username) {
				fields.push(`username = $${idx++}`);
				values.push(username);
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

export default router;
