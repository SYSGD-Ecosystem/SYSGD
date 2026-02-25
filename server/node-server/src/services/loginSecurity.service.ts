import { pool } from "../db";

const MAX_FAILED_ATTEMPTS = Number(process.env.LOGIN_MAX_FAILED_ATTEMPTS || "3");
const LOCK_MINUTES = Number(process.env.LOGIN_LOCK_MINUTES || "5");

export type LockStatus = {
	isLocked: boolean;
	retryAfterSeconds: number;
	lockedUntil?: Date;
};

const clampInt = (value: number, fallback: number) =>
	Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;

const safeMaxAttempts = clampInt(MAX_FAILED_ATTEMPTS, 3);
const safeLockMinutes = clampInt(LOCK_MINUTES, 5);

export class LoginSecurityService {
	static async ensureSchema(): Promise<void> {
		await pool.query(`
			ALTER TABLE users
			ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0;
		`);
		await pool.query(`
			ALTER TABLE users
			ADD COLUMN IF NOT EXISTS lockout_until TIMESTAMP;
		`);
	}

	static getLockStatus(lockoutUntil?: string | Date | null): LockStatus {
		if (!lockoutUntil) {
			return { isLocked: false, retryAfterSeconds: 0 };
		}

		const lockDate = new Date(lockoutUntil);
		const now = Date.now();
		const lockTime = lockDate.getTime();
		if (Number.isNaN(lockTime) || lockTime <= now) {
			return { isLocked: false, retryAfterSeconds: 0 };
		}

		const retryAfterSeconds = Math.ceil((lockTime - now) / 1000);
		return {
			isLocked: true,
			retryAfterSeconds,
			lockedUntil: lockDate,
		};
	}

	static async clearFailedAttempts(userId: string): Promise<void> {
		await this.ensureSchema();
		await pool.query(
			`UPDATE users
			 SET failed_login_attempts = 0,
				 lockout_until = NULL
			 WHERE id = $1`,
			[userId],
		);
	}

	static async registerFailedAttempt(userId: string): Promise<{
		locked: boolean;
		retryAfterSeconds?: number;
		attemptsLeft: number;
	}> {
		await this.ensureSchema();

		const { rows } = await pool.query<{
			failed_login_attempts: number;
			lockout_until: string | null;
		}>(
			`UPDATE users
			 SET failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1
			 WHERE id = $1
			 RETURNING failed_login_attempts, lockout_until`,
			[userId],
		);

		const attempts = rows[0]?.failed_login_attempts || 0;
		const attemptsLeft = Math.max(safeMaxAttempts - attempts, 0);

		if (attempts < safeMaxAttempts) {
			return {
				locked: false,
				attemptsLeft,
			};
		}

		const lockUntil = new Date(Date.now() + safeLockMinutes * 60_000);
		await pool.query(
			`UPDATE users
			 SET lockout_until = $2
			 WHERE id = $1`,
			[userId, lockUntil],
		);

		return {
			locked: true,
			retryAfterSeconds: safeLockMinutes * 60,
			attemptsLeft: 0,
		};
	}
}
