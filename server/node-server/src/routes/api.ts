import { Router, type Request, type Response } from "express";
import { pool } from "../index";
import bcrypt from "bcrypt";
import { isAuthenticated } from "../middlewares/auth";
//import session from "express-session";

const router = Router();

// GET /api/archives
router.get("/archives",isAuthenticated, async (_req: Request, res: Response) => {
	try {
		const result = await pool.query(
			"SELECT code, company, name FROM classification_box",
		);
		res.json(result.rows);
	} catch (err) {
		res.status(500).json({ error: "Error al obtener los datos" });
	}
});

// GET /api/get_data?code=ABC123
router.get("/get_data",isAuthenticated, async (req: Request, res: Response) => {
	const { code } = req.query;
	if (typeof code !== "string") {
		res.status(400).json({ error: "Código inválido" });
		return;
	}

	try {
		const result = await pool.query(
			"SELECT datos FROM classification_box WHERE code = $1",
			[code],
		);
		res.json(result.rows);
	} catch (err) {
		res.status(500).json({ error: "Error al obtener los datos" });
	}
});

// POST /api/create_new_classification_box
router.post(
	"/create_new_classification_box",isAuthenticated,
	async (req: Request, res: Response) => {
		const { company, code, name } = req.body;
		if (!company || !code || !name) {
			res.status(400).send("400");
			return;
		}

		try {
			await pool.query(
				"INSERT INTO classification_box (company, code, name) VALUES ($1, $2, $3)",
				[company, code, name],
			);
			res.status(201).send("201");
		} catch (err) {
			res.status(500).send("500");
		}
	},
);

// POST /api/add_classification_data
router.post("/add_classification_data",isAuthenticated, async (req: Request, res: Response) => {
	const { code, data } = req.body;
	if (!code || !data) {
		res.status(400).send("400");
		return;
	}

	try {
		await pool.query(
			"UPDATE classification_box SET datos = $1 WHERE code = $2",
			[data, code],
		);
		res.status(201).send("201");
	} catch (err) {
		res.status(500).send("500");
	}
});

router.get("/status", async (_req: Request, res: Response) => {
	res.json({ status: "ok", message: "Servidor activo y listo" });
});

router.get("/me", async (req: Request, res: Response) => {
	if (!req.session.user) {
		res.status(401).send("No estás logeado");
	}
	res.json(req.session.user);
});

router.post("/register", async (req: Request, res: Response) => {
	console.log(req.body);
	const { name, username, password } = req.body;
	if (!name || !username || !password) {
		res.status(400).send("400");
		return;
	}

	try {
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
			"INSERT INTO users (name, username, password) VALUES ($1, $2, $3)",
			[name, username, hashedPassword],
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
	console.log(req.body);
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
		console.log(result);
		const math = await bcrypt.compare(password, user.password);
		if (!math) {
			res.status(402).send("Incorrect Password");
			return;
		}

		req.session.user = {
			id: user.id,
			name: user.name,
			username: user.username,
			privileges: user.privileges,
		};

		res.status(201).send("Login correcto");
	} catch (err) {
		console.error(err);
		res.status(500).send("Error interno del servidor");
	}
});

export default router;
