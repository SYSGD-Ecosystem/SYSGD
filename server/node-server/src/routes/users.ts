import { Router, type Request, type Response } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db";
import { isAuthenticated } from "../middlewares/auth";

const router = Router();

// ---- Public / Auth related ----
router.get("/status", (_req, res) => {
	res.json({ status: "ok", message: "Servidor activo y listo" });
});

// Current user data
router.get("/me", isAuthenticated, (req, res) => {
	res.json(req.session.user);
});

// Register new user (first becomes admin)
router.post("/register", async (req: Request, res: Response) => {
	const { name, username, password } = req.body;
	if (!name || !username || !password) {
		res.status(400).send("Faltan datos obligatorios");
		return;
	}
	try {
		const { rows: existing } = await pool.query(
			"SELECT id FROM users WHERE username = $1",
			[username],
		);
		if (existing.length) {
			res.status(409).send("Usuario ya existe");
			return;
		}

		const { rows: all } = await pool.query("SELECT id FROM users");
		const privileges = all.length === 0 ? "admin" : "user";

		await pool.query(
			"INSERT INTO users (name, username, password, privileges) VALUES ($1,$2,crypt($3, gen_salt('bf')),$4)",
			[name, username, password, privileges],
		);
		res.status(201).send("201");
	} catch {
		res.status(500).send("Error servidor");
	}
});

// ---- Admin only CRUD ----
router.use(isAuthenticated);
router.use((req, res, next) => {
	if (req.session.user?.privileges !== "admin") {
		res.status(403).json({ error: "No autorizado" });
		return;
	}
	next();
});

// List users
router.get("/", async (_req, res) => {
	try {
		const { rows } = await pool.query(
			"SELECT id, name, username, privileges FROM users ORDER BY id",
		);
		res.json(rows);
	} catch {
		res.status(500).json({ error: "Error al obtener usuarios" });
	}
});

// Create user
router.post("/", async (req, res) => {
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

// Update basic data
router.put("/:id", async (req, res) => {
	const userId = Number.parseInt(req.params.id, 10);
	const { name, username } = req.body;
	if (Number.isNaN(userId) || (!name && !username)) {
		res.status(400).json({ error: "Datos inválidos" });
		return;
	}
	try {
		const fields: string[] = [];
		const values: (string | number)[] = [];
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
	} catch {
		res.status(500).json({ error: "Error al actualizar" });
	}
});

// Update password
router.put("/:id/password", async (req, res) => {
	const userId = Number.parseInt(req.params.id, 10);
	const { password } = req.body;
	if (Number.isNaN(userId) || !password) {
		res.status(400).json({ error: "Datos inválidos" });
		return;
	}
	try {
		const hashed = await bcrypt.hash(password, 10);
		const result = await pool.query(
			"UPDATE users SET password = $1 WHERE id = $2 RETURNING id",
			[hashed, userId],
		);
		if (result.rowCount === 0) {
			res.status(404).json({ error: "Usuario no encontrado" });
			return;
		}
		res.json({ message: "Contraseña actualizada" });
	} catch {
		res.status(500).json({ error: "Error" });
	}
});

// Delete user (and their files)
router.delete("/:id", async (req, res) => {
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
	} catch {
		res.status(500).json({ error: "Error al eliminar" });
	}
});

export default router;
