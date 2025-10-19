import { Router } from "express";
import { pool } from "../db";

export const chatRouter = Router();

// ✅ Obtener conversaciones de un usuario
chatRouter.get("/conversations/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(`
      SELECT c.id, c.title, c.type,
             m.content AS last_message,
             m.created_at AS last_message_at
      FROM conversations c
      LEFT JOIN LATERAL (
        SELECT * FROM messages
        WHERE conversation_id = c.id
        ORDER BY created_at DESC
        LIMIT 1
      ) m ON true
      INNER JOIN conversation_read_status crs
        ON crs.conversation_id = c.id
      WHERE crs.user_id = $1
      ORDER BY m.created_at DESC NULLS LAST
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener conversaciones" });
  }
});

// ✅ Obtener mensajes de una conversación
chatRouter.get("/messages/:conversationId", async (req, res) => {
  const { conversationId } = req.params;
  try {
    const result = await pool.query(`
      SELECT *
      FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
    `, [conversationId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener mensajes" });
  }
});

// ✅ Enviar mensaje
chatRouter.post("/messages/send", async (req, res) => {
  const { conversation_id, sender_id, content, attachment_type, attachment_url, reply_to } = req.body;

  try {
    const result = await pool.query(`
      INSERT INTO messages
      (conversation_id, sender_id, content, attachment_type, attachment_url, reply_to)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
    `, [conversation_id, sender_id, content, attachment_type || null, attachment_url || null, reply_to || null]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al enviar mensaje" });
  }
});
