// src/controllers/invitationControler.ts
/** biome-ignore-all lint/complexity/noStaticOnlyClass: <explanation> */
import { Request, Response } from 'express';
import { pool } from '../db';
import crypto from 'crypto';
import { EmailService } from '../services/emailService';
import { getCurrentUserData } from './users';

export class InvitationController {
  /**
   * Envía invitación a un proyecto
   */
  static async sendProjectInvitation(req: Request, res: Response) {
    const { projectId } = req.params;
    const { email, role } = req.body;
    const user = getCurrentUserData(req);
    const senderId = user?.id;

    if (!senderId || !projectId || !email) {
      res.status(400).json({ error: 'Faltan datos requeridos' });
      return;
    }

    try {
      // Verificar que el proyecto existe y el usuario tiene permisos
      const { rows: projectRows } = await pool.query(
        `SELECT p.name, u.name as creator_name
         FROM projects p
         JOIN users u ON u.id = p.created_by
         WHERE p.id = $1 AND (p.created_by = $2 OR EXISTS (
           SELECT 1 FROM resource_access 
           WHERE user_id = $2 AND resource_id = $1 
           AND resource_type = 'project' AND role IN ('owner', 'admin')
         ))`,
        [projectId, senderId]
      );

      if (projectRows.length === 0) {
        res.status(403).json({ error: 'No tienes permisos para invitar a este proyecto' });
        return;
      }

      const project = projectRows[0];

      // Buscar si el usuario existe por email
      const { rows: recipientRows } = await pool.query(
        'SELECT id, name FROM users WHERE email = $1',
        [email]
      );

      // Obtener datos del remitente
      const { rows: senderRows } = await pool.query(
        'SELECT name FROM users WHERE id = $1',
        [senderId]
      );

      const senderName = senderRows[0].name;

      // Generar token de invitación
      const invitationToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

      // Buscar la invitación recién creada
      const { rows: invitationRows } = await pool.query(
        `SELECT id FROM invitations 
         WHERE receiver_email = $1 
         AND resource_type = 'project' 
         AND resource_id = $2 
         AND status = 'pending'
         ORDER BY created_at DESC
         LIMIT 1`,
        [email, projectId]
      );

      if (invitationRows.length === 0) {
        res.status(500).json({ error: 'Error al crear invitación' });
        return;
      }

      const invitationId = invitationRows[0].id;

      // Guardar token de invitación
      await pool.query(
        `INSERT INTO email_verification_tokens (
          user_id,
          token,
          type,
          expires_at
        )
        VALUES ($1, $2, 'invitation', $3)`,
        [
          recipientRows.length > 0 ? recipientRows[0].id : null,
          invitationToken,
          expiresAt
        ]
      );

      // Enviar email de invitación
      const emailSent = await EmailService.sendProjectInvitation(
        email,
        senderName,
        project.name,
        invitationToken,
        recipientRows.length > 0 ? recipientRows[0].name : undefined
      );

      if (!emailSent) {
        console.error('Error sending invitation email');
      }

      // Registrar en log de notificaciones
      await pool.query(
        `INSERT INTO email_notifications (
          user_id,
          recipient_email,
          subject,
          type,
          status,
          sent_at
        )
        VALUES ($1, $2, $3, 'project_invitation', $4, NOW())`,
        [
          recipientRows.length > 0 ? recipientRows[0].id : null,
          email,
          `Invitación a proyecto: ${project.name}`,
          emailSent ? 'sent' : 'failed'
        ]
      );

      res.status(201).json({
        message: 'Invitación enviada correctamente',
        invitationId,
        emailSent,
        userCreated: recipientRows.length === 0
      });
    } catch (error) {
      console.error('Error sending invitation:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error al enviar invitación' });
      }
    }
  }

  // ... resto de los métodos sin cambios
}