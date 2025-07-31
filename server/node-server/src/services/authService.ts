import { pool } from '../db';

export const findUserByUsername = async (username: string) => {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    return result.rows[0] || null;
};

export const logUserLogin = async (userId: number, ip: string, userAgent: string) => {
    await pool.query(
        "INSERT INTO users_logins (user_id, ip_address, user_agent) VALUES ($1, $2, $3)",
        [userId, ip, userAgent]
    );
};