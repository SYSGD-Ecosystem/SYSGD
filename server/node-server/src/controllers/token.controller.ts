// src/controllers/token.controller.ts
import { Request, Response } from 'express';
import { pool } from '../db';
import { TokenService } from '../services/token.service';

export class TokenController {
  public static async getTokens(req: Request, res: Response) {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    try {
      const result = await pool.query(
        'SELECT id, token_type, created_at, updated_at FROM user_tokens WHERE user_id = $1',
        [userId]
      );
      
      res.json(result.rows);
    } catch (error) {
      console.error('Error al obtener tokens:', error);
      res.status(500).json({ error: 'Error al obtener tokens' });
    }
  }

  public static async saveToken(req: Request, res: Response) {
    const userId = (req as any).user?.id;
    const { token, tokenType } = req.body;

    if (!userId || !token || !tokenType) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    if (!['github', 'gemini', 'replicate'].includes(tokenType)) {
      return res.status(400).json({ error: 'Tipo de token no soportado' });
    }

    try {
      const { encrypted, iv } = await TokenService.encryptToken(token, tokenType);
      
      await pool.query(
        `INSERT INTO user_tokens (user_id, token_type, encrypted_token, iv)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, token_type) 
         DO UPDATE SET 
           encrypted_token = EXCLUDED.encrypted_token,
           iv = EXCLUDED.iv,
           updated_at = NOW()
         RETURNING id, token_type, created_at, updated_at`,
        [userId, tokenType, encrypted, iv]
      );

      res.json({ message: 'Token guardado exitosamente' });
    } catch (error) {
      console.error('Error al guardar token:', error);
      res.status(500).json({ error: 'Error al guardar el token' });
    }
  }

  public static async deleteToken(req: Request, res: Response) {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    if (!userId || !id) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    try {
      const result = await pool.query(
        'DELETE FROM user_tokens WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Token no encontrado' });
      }

      res.json({ message: 'Token eliminado exitosamente' });
    } catch (error) {
      console.error('Error al eliminar token:', error);
      res.status(500).json({ error: 'Error al eliminar el token' });
    }
  }
}