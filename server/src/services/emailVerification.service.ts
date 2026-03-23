import crypto from "crypto";
import { pool } from "../db";
import { EmailService } from "./emailService";

interface VerificationUser {
  id: string;
  email: string;
  name: string;
  email_verified: boolean;
}

let schemaEnsured = false;

const ensureVerificationSchema = async () => {
  if (schemaEnsured) return;

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      token TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      used BOOLEAN NOT NULL DEFAULT false,
      used_at TIMESTAMP,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_lookup
    ON email_verification_tokens (token, type, used);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_type
    ON email_verification_tokens (user_id, type, created_at DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      recipient_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      error_message TEXT,
      sent_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_email_notifications_user_created
    ON email_notifications (user_id, created_at DESC);
  `);

  schemaEnsured = true;
};

export class EmailVerificationService {
  static async ensureSchema() {
    await ensureVerificationSchema();
  }

  static async getVerificationStatus(userId: string) {
    await ensureVerificationSchema();

    const { rows } = await pool.query<{
      email_verified: boolean;
      email_verified_at: string | null;
    }>(
      `SELECT email_verified, email_verified_at
       FROM users
       WHERE id = $1`,
      [userId],
    );

    if (rows.length === 0) {
      return null;
    }

    return {
      verified: Boolean(rows[0].email_verified),
      verifiedAt: rows[0].email_verified_at,
    };
  }

  static async issueVerificationEmail(userId: string) {
    await ensureVerificationSchema();

    const { rows } = await pool.query<VerificationUser>(
      `SELECT id, name, email, email_verified
       FROM users
       WHERE id = $1`,
      [userId],
    );

    if (rows.length === 0) {
      return { ok: false as const, reason: "not_found" as const };
    }

    const user = rows[0];

    if (user.email_verified) {
      return { ok: false as const, reason: "already_verified" as const };
    }

    const existingTokenResult = await pool.query<{ token: string }>(
      `SELECT token
       FROM email_verification_tokens
       WHERE user_id = $1
         AND type = 'verification'
         AND used = false
         AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [user.id],
    );

    let token = existingTokenResult.rows[0]?.token;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    if (!token) {
      token = crypto.randomBytes(32).toString("hex");
      await pool.query(
        `INSERT INTO email_verification_tokens (user_id, token, type, expires_at)
         VALUES ($1, $2, 'verification', $3)`,
        [user.id, token, expiresAt],
      );
    }

    const sent = await EmailService.sendVerificationEmail(
      user.email,
      user.name || "Usuario",
      token,
    );

    await pool.query(
      `INSERT INTO email_notifications (user_id, recipient_email, subject, type, status, sent_at)
       VALUES ($1, $2, $3, 'verification', $4, $5)`,
      [
        user.id,
        user.email,
        "Verificación de email",
        sent ? "sent" : "failed",
        sent ? new Date() : null,
      ],
    );

    if (!sent) {
      return { ok: false as const, reason: "send_failed" as const };
    }

    return {
      ok: true as const,
      expiresAt: expiresAt.toISOString(),
    };
  }

  static async verifyEmailByToken(token: string) {
    await ensureVerificationSchema();

    await pool.query("BEGIN");

    try {
      const tokenResult = await pool.query<{
        id: string;
        user_id: string;
        expires_at: string;
        used: boolean;
      }>(
        `SELECT id, user_id, expires_at, used
         FROM email_verification_tokens
         WHERE token = $1
           AND type = 'verification'
         LIMIT 1`,
        [token],
      );

      if (tokenResult.rows.length === 0) {
        await pool.query("ROLLBACK");
        return { ok: false as const, reason: "invalid_token" as const };
      }

      const tokenData = tokenResult.rows[0];

      if (tokenData.used) {
        const status = await this.getVerificationStatus(tokenData.user_id);
        await pool.query("ROLLBACK");
        if (status?.verified) {
          return { ok: true as const, alreadyVerified: true };
        }
        return { ok: false as const, reason: "already_used" as const };
      }

      if (new Date(tokenData.expires_at) < new Date()) {
        await pool.query("ROLLBACK");
        return { ok: false as const, reason: "expired" as const };
      }

      await pool.query(
        `UPDATE users
         SET email_verified = true,
             email_verified_at = NOW()
         WHERE id = $1`,
        [tokenData.user_id],
      );

      await pool.query(
        `UPDATE email_verification_tokens
         SET used = true,
             used_at = NOW()
         WHERE id = $1`,
        [tokenData.id],
      );

      await pool.query("COMMIT");

      const userResult = await pool.query<{ name: string; email: string }>(
        `SELECT name, email
         FROM users
         WHERE id = $1`,
        [tokenData.user_id],
      );

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        EmailService.sendWelcomeEmail(user.email, user.name || "Usuario").catch(
          console.error,
        );
      }

      return { ok: true as const, alreadyVerified: false };
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  }
}
