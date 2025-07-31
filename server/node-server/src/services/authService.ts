import { pool } from "../db";

export const createUser = async (
	name: string,
	username: string,
	password: string,
	privileges: string,
) => {
	try {
		const result = await pool.query(
			"INSERT INTO users (name, username, password, privileges) VALUES ($1, $2, $3, $4) RETURNING *",
			[name, username, password, privileges],
		);

		return {
			success: true,
			user: result.rows[0],
		};
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	} catch (error: any) {
		if (error.code === "23505") {
			// Código de error PostgreSQL para violación de restricción única
			return {
				success: false,
				message: "El nombre de usuario ya está en uso",
			};
		}

		console.error("Error al crear usuario:", error);

		return {
			success: false,
			message: "Error interno del servidor",
		};
	}
};

export const findUserByUsername = async (username: string) => {
	const result = await pool.query("SELECT * FROM users WHERE username = $1", [
		username,
	]);
	return result.rows[0] || null;
};

export const logUserLogin = async (
	userId: number,
	ip: string,
	userAgent: string,
) => {
	await pool.query(
		"INSERT INTO users_logins (user_id, ip_address, user_agent) VALUES ($1, $2, $3)",
		[userId, ip, userAgent],
	);
};
