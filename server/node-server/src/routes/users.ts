import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { getUsers, register } from "../controllers/users";
import { getCurrentUser } from "../controllers/auth";

const router = Router();

export interface User {
	id: number;
	username: string;
	privileges: string;
	// otras propiedades
}

// Current user data
router.get("/me", getCurrentUser);

// Register new user (first becomes admin)
router.post("/register", register);

// ---- Admin only CRUD ----
router.use(isAuthenticated);
router.use((req, res, next) => {
	const user = getCurrentUser(req, res) as unknown as User;
	if (user.privileges !== "admin") {
		res.status(403).json({ error: "No autorizado" });
		return;
	}
	next();
});

// List users
router.get("/", getUsers);

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
