import bcrypt from "bcrypt";
import { pool } from "../db";
import { EmailService } from "./emailService";

interface AdminIdentity {
	id: string;
	email: string;
	name: string;
}

const CODE_LENGTH = 6;
const CODE_TTL_MINUTES = Number(process.env.ADMIN_2FA_CODE_TTL_MINUTES || "10");
const MAX_ATTEMPTS = Number(process.env.ADMIN_2FA_MAX_ATTEMPTS || "5");
const RESEND_COOLDOWN_SECONDS = Number(
	process.env.ADMIN_2FA_RESEND_COOLDOWN_SECONDS || "60",
);

let schemaEnsured = false;

const ensureSchema = async () => {
	if (schemaEnsured) return;

	await pool.query(`
		CREATE TABLE IF NOT EXISTS admin_login_2fa_codes (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			code_hash TEXT NOT NULL,
			expires_at TIMESTAMP NOT NULL,
			attempts INTEGER NOT NULL DEFAULT 0,
			used BOOLEAN NOT NULL DEFAULT false,
			used_at TIMESTAMP,
			created_at TIMESTAMP NOT NULL DEFAULT NOW()
		);
	`);

	await pool.query(`
		CREATE INDEX IF NOT EXISTS idx_admin_login_2fa_user_created
		ON admin_login_2fa_codes(user_id, created_at DESC);
	`);

	schemaEnsured = true;
};

const normalizeCode = (code: string) => code.trim();

const generateCode = (): string =>
	Math.floor(Math.random() * 10 ** CODE_LENGTH)
		.toString()
		.padStart(CODE_LENGTH, "0");

const markPreviousCodesAsUsed = async (userId: string) => {
	await pool.query(
		`UPDATE admin_login_2fa_codes
		 SET used = true, used_at = NOW()
		 WHERE user_id = $1 AND used = false`,
		[userId],
	);
};

export class AdminTwoFactorService {
	static isRequiredForAdmins(): boolean {
		return process.env.ENFORCE_ADMIN_2FA === "true";
	}

	static getPendingTokenTtlMinutes(): number {
		return Number(process.env.ADMIN_2FA_PENDING_TOKEN_TTL_MINUTES || "15");
	}

	static async issueCode(admin: AdminIdentity): Promise<{
		success: boolean;
		error?: string;
		secondsRemaining?: number;
	}> {
		await ensureSchema();

		const { rows: latestRows } = await pool.query<{
			created_at: string;
			used: boolean;
			expires_at: string;
		}>(
			`SELECT created_at, used, expires_at
			 FROM admin_login_2fa_codes
			 WHERE user_id = $1
			 ORDER BY created_at DESC
			 LIMIT 1`,
			[admin.id],
		);

		if (latestRows.length > 0) {
			const latest = latestRows[0];
			const ageMs = Date.now() - new Date(latest.created_at).getTime();
			const cooldownMs = RESEND_COOLDOWN_SECONDS * 1000;

			if (!latest.used && new Date(latest.expires_at) > new Date() && ageMs < cooldownMs) {
				return {
					success: false,
					error: "Debes esperar antes de solicitar un nuevo codigo",
					secondsRemaining: Math.ceil((cooldownMs - ageMs) / 1000),
				};
			}
		}

		await markPreviousCodesAsUsed(admin.id);

		const plainCode = generateCode();
		const codeHash = await bcrypt.hash(plainCode, 10);
		const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

		const insertResult = await pool.query<{ id: string }>(
			`INSERT INTO admin_login_2fa_codes (user_id, code_hash, expires_at)
			 VALUES ($1, $2, $3)
			 RETURNING id`,
			[admin.id, codeHash, expiresAt],
		);

		const codeId = insertResult.rows[0]?.id;
		const sent = await EmailService.sendLoginTwoFactorCode(
			admin.email,
			admin.name || "Administrador",
			plainCode,
			CODE_TTL_MINUTES,
		);

		if (!sent) {
			if (codeId) {
				await pool.query("DELETE FROM admin_login_2fa_codes WHERE id = $1", [codeId]);
			}
			return {
				success: false,
				error: "No se pudo enviar el codigo de verificacion",
			};
		}

		return { success: true };
	}

	static async verifyCode(userId: string, code: string): Promise<{
		success: boolean;
		error?: string;
		attemptsLeft?: number;
	}> {
		await ensureSchema();

		const sanitizedCode = normalizeCode(code);
		if (!/^\d{6}$/.test(sanitizedCode)) {
			return { success: false, error: "Codigo invalido" };
		}

		const { rows } = await pool.query<{
			id: string;
			code_hash: string;
			expires_at: string;
			attempts: number;
		}>(
			`SELECT id, code_hash, expires_at, attempts
			 FROM admin_login_2fa_codes
			 WHERE user_id = $1 AND used = false
			 ORDER BY created_at DESC
			 LIMIT 1`,
			[userId],
		);

		if (rows.length === 0) {
			return { success: false, error: "No hay codigo pendiente o ha expirado" };
		}

		const latestCode = rows[0];
		if (new Date(latestCode.expires_at) < new Date()) {
			await pool.query(
				`UPDATE admin_login_2fa_codes
				 SET used = true, used_at = NOW()
				 WHERE id = $1`,
				[latestCode.id],
			);
			return { success: false, error: "El codigo ha expirado" };
		}

		if (latestCode.attempts >= MAX_ATTEMPTS) {
			await pool.query(
				`UPDATE admin_login_2fa_codes
				 SET used = true, used_at = NOW()
				 WHERE id = $1`,
				[latestCode.id],
			);
			return { success: false, error: "Maximo de intentos excedido" };
		}

		const isValid = await bcrypt.compare(sanitizedCode, latestCode.code_hash);
		if (!isValid) {
			const nextAttempts = latestCode.attempts + 1;
			const shouldInvalidate = nextAttempts >= MAX_ATTEMPTS;

			await pool.query(
				`UPDATE admin_login_2fa_codes
				 SET attempts = $2,
					 used = CASE WHEN $3 THEN true ELSE used END,
					 used_at = CASE WHEN $3 THEN NOW() ELSE used_at END
				 WHERE id = $1`,
				[latestCode.id, nextAttempts, shouldInvalidate],
			);

			return {
				success: false,
				error: "Codigo incorrecto",
				attemptsLeft: Math.max(MAX_ATTEMPTS - nextAttempts, 0),
			};
		}

		await pool.query(
			`UPDATE admin_login_2fa_codes
			 SET used = true, used_at = NOW()
			 WHERE id = $1`,
			[latestCode.id],
		);

		return { success: true };
	}
}
