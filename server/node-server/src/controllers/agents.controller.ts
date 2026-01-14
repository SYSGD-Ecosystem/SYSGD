import { Request, Response } from 'express';
import { pool } from '../db';
import { CreateAgentRequest, UpdateAgentRequest } from '../types/Agent';

export const createAgent = async (req: Request, res: Response) => {
  try {
    const { name, url, support, description, systemPrompt } = req.body as CreateAgentRequest;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    if (!name || !url || !support || support.length === 0) {
      res.status(400).json({ error: 'Faltan campos requeridos' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO agents (name, url, support, description, system_prompt, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [name, url, support, description || null, systemPrompt || null, userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getAgents = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const result = await pool.query(
      `SELECT * FROM agents 
       WHERE created_by = $1 AND is_active = true 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getAgentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const result = await pool.query(
      `SELECT * FROM agents 
       WHERE id = $1 AND created_by = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Agente no encontrado' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching agent:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateAgent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body as UpdateAgentRequest;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    // Verificar que el agente existe y pertenece al usuario
    const existingAgent = await pool.query(
      `SELECT * FROM agents WHERE id = $1 AND created_by = $2`,
      [id, userId]
    );

    if (existingAgent.rows.length === 0) {
      return res.status(404).json({ error: 'Agente no encontrado' });
    }

    // Construir la consulta dinámicamente
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.url !== undefined) {
      updateFields.push(`url = $${paramCount++}`);
      values.push(updates.url);
    }
    if (updates.support !== undefined) {
      updateFields.push(`support = $${paramCount++}`);
      values.push(updates.support);
    }
    if (updates.description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }
    
    if (updates.systemPrompt !== undefined) {
      updateFields.push(`system_prompt = $${paramCount++}`);
      values.push(updates.systemPrompt);
    }

    if (updates.is_active !== undefined) {
      updateFields.push(`is_active = $${paramCount++}`);
      values.push(updates.is_active);
    }

    if (updateFields.length === 0) {
      res.status(400).json({ error: 'No hay campos para actualizar' });
      return;
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE agents SET ${updateFields.join(', ')} 
       WHERE id = $${paramCount} AND created_by = $${paramCount + 1}
       RETURNING *`,
      [...values, userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating agent:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteAgent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const result = await pool.query(
      `DELETE FROM agents 
       WHERE id = $1 AND created_by = $2 
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Agente no encontrado' });
      return;
    }

    res.json({ message: 'Agente eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting agent:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const sendMessageToAgent = async (req: Request, res: Response) => {
  try {
    const { agent_id, conversation_id, content, attachment_type, attachment_url, agent_response } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    if (!agent_id || !conversation_id || !content) {
      res.status(400).json({ error: 'Faltan campos requeridos' });
      return;
    }

    // Verificar que el usuario tiene acceso a la conversación
    const conversationResult = await pool.query(
      `SELECT cm.* FROM conversation_members cm 
       WHERE cm.conversation_id = $1 AND cm.user_id = $2`,
      [conversation_id, userId]
    );

    if (conversationResult.rows.length === 0) {
      res.status(403).json({ error: 'No tienes acceso a esta conversación' });
      return;
    }

    // Crear el mensaje del usuario en la base de datos
    const messageResult = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, content, attachment_type, attachment_url) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [conversation_id, userId, content, attachment_type || null, attachment_url || null]
    );

    const userMessage = messageResult.rows[0];

    // Si se proporciona la respuesta del agente, guardarla también
    let agentMessage = null;
    if (agent_response) {
      const agentMessageResult = await pool.query(
        `INSERT INTO messages (conversation_id, sender_id, content) 
         VALUES ($1, NULL, $2) 
         RETURNING *`,
        [conversation_id, agent_response]
      );
      agentMessage = agentMessageResult.rows[0];
    }

    res.json({
      userMessage,
      agentMessage,
      success: true
    });

  } catch (error) {
    console.error('Error saving agent messages:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
