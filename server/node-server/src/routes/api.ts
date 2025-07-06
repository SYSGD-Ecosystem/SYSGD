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
	console.log(req.body);
	console.log(data);

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
	console.log(req.body);
	console.log(data);

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
		(req.session.user?.privileges !== "admin" && result.rows[0].user_id !== user_id)
	) {
		res.status(403).json({ error: "No tienes permisos para modificar este expediente." });
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
		(req.session.user?.privileges !== "admin" && result.rows[0].user_id !== user_id)
	) {
		res.status(403).json({ error: "No tienes permisos para modificar este expediente." });
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
	console.log(req.body);
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
	console.log("Autenticando...", req.body);
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

export default router;
