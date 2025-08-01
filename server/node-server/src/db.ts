import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
export const pool = DATABASE_URL
	? new Pool({
			connectionString: process.env.DATABASE_URL,
			ssl:
				process.env.NODE_ENV === "production"
					? { rejectUnauthorized: false }
					: undefined, // No fuerza SSL en local
		})
	: new Pool({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_NAME,
			port: Number(process.env.DB_PORT),
		});
