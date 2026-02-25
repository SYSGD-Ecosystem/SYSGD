import { pool } from "../db";
import { createDefaultUserData } from "../utils/billing";
import type { ClientSource } from "../utils/client-source";

export const createUser = async (
	name: string,
	email: string,
	password: string,
	privileges: string,
	registrationSource: ClientSource = "unknown",
) => {
	try {
		const defaultUserData = createDefaultUserData();
		const result = await pool.query(
			"INSERT INTO users (name, email, password, privileges, user_data, registration_source) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
			[name, email, password, privileges, JSON.stringify(defaultUserData), registrationSource],
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

export const findUserByemail = async (email: string) => {
	const result = await pool.query("SELECT * FROM users WHERE email = $1", [
		email,
	]);
	return result.rows[0] || null;
};

export const logUserLogin = async (
	userId: string,
	ip: string,
	userAgent: string,
	loginSource: ClientSource = "unknown",
) => {
	await pool.query(
		"INSERT INTO users_logins (user_id, ip_address, user_agent, login_source) VALUES ($1, $2, $3, $4)",
		[userId, ip, userAgent, loginSource],
	);
};
