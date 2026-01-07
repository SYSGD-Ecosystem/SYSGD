// src/controllers/verification.controller.ts
/** biome-ignore-all lint/complexity/noStaticOnlyClass: <explanation> */
import { Request, Response } from 'express';
import { pool } from '../db';
import { EmailService } from '../services/emailService';
import crypto from 'crypto';

export class VerificationController {
  /**
   * Envía email de verificación al usuario
   */
  static async sendVerificationEmail(req: Request, res: Response) {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    try {
      // Obtener datos del usuario
      const { rows: userRows } = await pool.query(
        'SELECT id, name, email, email_verified FROM users WHERE id = $1',
        [userId]
      );

      if (userRows.length === 0) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      const user = userRows[0];

      // Verificar si ya está verificado
      if (user.email_verified) {
        res.status(400).json({ error: 'El email ya está verificado' });
        return;
      }

      // Verificar si ya tiene un token válido pendiente
      const { rows: existingTokens } = await pool.query(
        `SELECT id FROM email_verification_tokens 
         WHERE user_id = $1 
         AND type = 'verification' 
         AND used = false 
         AND expires_at > NOW()`,
        [userId]
      );

      if (existingTokens.length > 0) {
        res.status(400).json({ 
          error: 'Ya se envió un email de verificación. Por favor, revisa tu bandeja de entrada.' 
        });
        return;
      }

      // Generar token de verificación
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

      // Guardar token en la base de datos
      await pool.query(
        `INSERT INTO email_verification_tokens (user_id, token, type, expires_at)
         VALUES ($1, $2, 'verification', $3)`,
        [userId, token, expiresAt]
      );

      // Enviar email
      const emailSent = await EmailService.sendVerificationEmail(
        user.email,
        user.name,
        token
      );

      if (!emailSent) {
        res.status(500).json({ error: 'Error al enviar el email' });
        return;
      }

      // Registrar en log de notificaciones
      await pool.query(
        `INSERT INTO email_notifications (user_id, recipient_email, subject, type, status, sent_at)
         VALUES ($1, $2, $3, 'verification', 'sent', NOW())`,
        [userId, user.email, 'Verificación de email']
      );

      res.json({ 
        message: 'Email de verificación enviado correctamente',
        expiresAt: expiresAt.toISOString()
      });
    } catch (error) {
      console.error('Error sending verification email:', error);
      res.status(500).json({ error: 'Error al enviar email de verificación' });
    }
  }

  /**
   * Verifica el email usando el token
   */
  static async verifyEmail(req: Request, res: Response) {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Token requerido' });
      return;
    }

    try {
      await pool.query('BEGIN');

      // Buscar token
      const { rows: tokenRows } = await pool.query(
        `SELECT id, user_id, expires_at, used 
         FROM email_verification_tokens 
         WHERE token = $1 AND type = 'verification'`,
        [token]
      );

      if (tokenRows.length === 0) {
        await pool.query('ROLLBACK');
        res.status(400).json({ error: 'Token inválido' });
        return;
      }

      const tokenData = tokenRows[0];

      // Verificar si ya fue usado
      if (tokenData.used) {
        await pool.query('ROLLBACK');
        res.status(400).json({ error: 'Este token ya fue usado' });
        return;
      }

      // Verificar si expiró
      if (new Date(tokenData.expires_at) < new Date()) {
        await pool.query('ROLLBACK');
        res.status(400).json({ error: 'El token ha expirado' });
        return;
      }

      // Marcar email como verificado
      await pool.query(
        `UPDATE users 
         SET email_verified = true, email_verified_at = NOW()
         WHERE id = $1`,
        [tokenData.user_id]
      );

      // Marcar token como usado
      await pool.query(
        `UPDATE email_verification_tokens 
         SET used = true, used_at = NOW()
         WHERE id = $1`,
        [tokenData.id]
      );

      await pool.query('COMMIT');

      // Obtener usuario para enviar email de bienvenida
      const { rows: userRows } = await pool.query(
        'SELECT name, email FROM users WHERE id = $1',
        [tokenData.user_id]
      );

      if (userRows.length > 0) {
        const user = userRows[0];
        // Enviar email de bienvenida (sin esperar)
        EmailService.sendWelcomeEmail(user.email, user.name).catch(console.error);
      }

      res.json({ 
        message: 'Email verificado correctamente',
        verified: true 
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Error verifying email:', error);
      res.status(500).json({ error: 'Error al verificar email' });
    }
  }

  /**
   * Solicita un token de recuperación de contraseña
   */
  static async requestPasswordReset(req: Request, res: Response) {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email requerido' });
      return;
    }

    try {
      // Buscar usuario
      const { rows: userRows } = await pool.query(
        'SELECT id, name, email FROM users WHERE email = $1',
        [email]
      );

      // Por seguridad, siempre responder lo mismo incluso si el usuario no existe
      if (userRows.length === 0) {
        res.json({ 
          message: 'Si el email existe, recibirás un enlace de recuperación' 
        });
        return;
      }

      const user = userRows[0];

      // Invalidar tokens previos
      await pool.query(
        `UPDATE email_verification_tokens 
         SET used = true 
         WHERE user_id = $1 AND type = 'password_reset' AND used = false`,
        [user.id]
      );

      // Generar nuevo token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      // Guardar token
      await pool.query(
        `INSERT INTO email_verification_tokens (user_id, token, type, expires_at)
         VALUES ($1, $2, 'password_reset', $3)`,
        [user.id, token, expiresAt]
      );

      // Enviar email
      await EmailService.sendPasswordResetEmail(
        user.email,
        user.name,
        token
      );

      // Registrar en log
      await pool.query(
        `INSERT INTO email_notifications (user_id, recipient_email, subject, type, status, sent_at)
         VALUES ($1, $2, $3, 'password_reset', 'sent', NOW())`,
        [user.id, user.email, 'Recuperación de contraseña']
      );

      res.json({ 
        message: 'Si el email existe, recibirás un enlace de recuperación' 
      });
    } catch (error) {
      console.error('Error requesting password reset:', error);
      res.status(500).json({ error: 'Error al solicitar recuperación' });
    }
  }

  /**
   * Restablece la contraseña usando el token
   */
  static async resetPassword(req: Request, res: Response) {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ error: 'Token y contraseña requeridos' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    try {
      await pool.query('BEGIN');

      // Buscar token
      const { rows: tokenRows } = await pool.query(
        `SELECT id, user_id, expires_at, used 
         FROM email_verification_tokens 
         WHERE token = $1 AND type = 'password_reset'`,
        [token]
      );

      if (tokenRows.length === 0) {
        await pool.query('ROLLBACK');
        res.status(400).json({ error: 'Token inválido' });
        return;
      }

      const tokenData = tokenRows[0];

      if (tokenData.used) {
        await pool.query('ROLLBACK');
        res.status(400).json({ error: 'Este token ya fue usado' });
        return;
      }

      if (new Date(tokenData.expires_at) < new Date()) {
        await pool.query('ROLLBACK');
        res.status(400).json({ error: 'El token ha expirado' });
        return;
      }

      // Actualizar contraseña (usando bcrypt - asume que ya está configurado)
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await pool.query(
        `UPDATE users SET password = $1 WHERE id = $2`,
        [hashedPassword, tokenData.user_id]
      );

      // Marcar token como usado
      await pool.query(
        `UPDATE email_verification_tokens 
         SET used = true, used_at = NOW()
         WHERE id = $1`,
        [tokenData.id]
      );

      await pool.query('COMMIT');

      res.json({ 
        message: 'Contraseña actualizada correctamente' 
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Error resetting password:', error);
      res.status(500).json({ error: 'Error al restablecer contraseña' });
    }
  }

  /**
   * Obtiene el estado de verificación del usuario
   */
  static async getVerificationStatus(req: Request, res: Response) {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    try {
      const { rows } = await pool.query(
        `SELECT email_verified, email_verified_at 
         FROM users 
         WHERE id = $1`,
        [userId]
      );

      if (rows.length === 0) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      res.json({
        verified: rows[0].email_verified,
        verifiedAt: rows[0].email_verified_at
      });
    } catch (error) {
      console.error('Error getting verification status:', error);
      res.status(500).json({ error: 'Error al obtener estado' });
    }
  }
}