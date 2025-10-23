import { Router, Request, Response } from "express";
import { pool } from "../db";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { getCurrentUserData } from "../controllers/users";

const router = Router();

/**
 * Rutas más específicas primero para evitar que rutas genéricas las piensen como params.
 * - /conversations                 -> conversaciones del usuario autenticado
 * - /conversations/user/:userId    -> compatibilidad (obtener conversaciones de otro userId)
 * - /conversations/create          -> crear conversación
 * - /conversations/invite          -> enviar invitación por email
 * - /conversations/invitations     -> listar invitaciones dirigidas al email del usuario
 * - /conversations/invite/accept   -> aceptar invitación
 * - /conversations/:conversationId/read -> marcar como leído
 * - /conversations/:conversationId (DELETE) -> eliminar conversación (solo creador)
 *
 * Mensajes:
 * - /messages/:conversationId      -> obtener mensajes (solo miembros)
 * - /messages/send                 -> enviar mensaje (solo miembros)
 */

/* -----------------------
   Obtener conversaciones (autenticado)
   ----------------------- */
router.get("/conversations", isAuthenticated, async (req: Request, res: Response) => {
  const currentUser = getCurrentUserData(req);
  const authUserId = currentUser?.id;

  if (!authUserId) {
    res.status(401).json({ error: "Usuario no autenticado" });
    return;
  }

  try {
    const result = await pool.query(
      `
      SELECT
        c.id,
        c.title,
        c.type,
        c.created_by,
        c.created_at,
        (
          SELECT json_agg(json_build_object('id', u.id, 'username', u.username, 'name', u.name, 'role', cm.role))
          FROM conversation_members cm
          JOIN users u ON u.id = cm.user_id
          WHERE cm.conversation_id = c.id
        ) AS members,
        (
          SELECT json_build_object('id', m.id, 'content', m.content, 'sender_id', m.sender_id, 'created_at', m.created_at)
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) AS last_message,
        (
          SELECT last_read_message_id FROM message_reads mr
          WHERE mr.conversation_id = c.id AND mr.user_id = $1
        ) AS last_read_message_id
      FROM conversations c
      INNER JOIN conversation_members cm_user
        ON cm_user.conversation_id = c.id
      WHERE cm_user.user_id = $1
      ORDER BY COALESCE(
        (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1),
        c.created_at
      ) DESC;
    `,
      [authUserId]
    );

    res.json(result.rows);
    return;
  } catch (err) {
    console.error("Error obtener conversaciones:", err);
    res.status(500).json({ error: "Error al obtener conversaciones" });
    return;
  }
});

/* -----------------------
   Compatibilidad: obtener conversaciones para userId dado
   Ruta explícita para evitar colisiones con /conversations/invitations
   ----------------------- */
router.get("/conversations/user/:userId", isAuthenticated, async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (!userId) {
    res.status(400).json({ error: "userId requerido" });
    return;
  }

  try {
    const result = await pool.query(
      `
      SELECT
        c.id,
        c.title,
        c.type,
        c.created_by,
        c.created_at,
        (
          SELECT json_agg(json_build_object('id', u.id, 'username', u.username, 'name', u.name, 'role', cm.role))
          FROM conversation_members cm
          JOIN users u ON u.id = cm.user_id
          WHERE cm.conversation_id = c.id
        ) AS members,
        (
          SELECT json_build_object('id', m.id, 'content', m.content, 'sender_id', m.sender_id, 'created_at', m.created_at)
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) AS last_message
      FROM conversations c
      INNER JOIN conversation_members cm_user
        ON cm_user.conversation_id = c.id
      WHERE cm_user.user_id = $1
      ORDER BY COALESCE(
        (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1),
        c.created_at
      ) DESC;
    `,
      [userId]
    );

    res.json(result.rows);
    return;
  } catch (err) {
    console.error("Error obtener conversaciones por userId:", err);
    res.status(500).json({ error: "Error al obtener conversaciones" });
    return;
  }
});

/* -----------------------
   Mensajes
   ----------------------- */
router.get("/messages/:conversationId", isAuthenticated, async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const currentUser = getCurrentUserData(req);
  const authUserId = currentUser?.id;

  if (!authUserId) {
    res.status(401).json({ error: "Usuario no autenticado" });
    return;
  }

  if (!conversationId) {
    res.status(400).json({ error: "conversationId requerido" });
    return;
  }

  try {
    const membership = await pool.query(
      `SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, authUserId]
    );
    if (membership.rowCount === 0) {
      res.status(403).json({ error: "No es miembro de la conversación" });
      return;
    }
console.log("Hola mundo")
    const result = await pool.query(
      `
      SELECT
        m.*,
        u.username AS sender_username,
        u.name AS sender_name
      FROM messages m
      LEFT JOIN users u ON u.id = m.sender_id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at ASC
    `,
      [conversationId]
    );

    res.json(result.rows);
    return;
  } catch (err) {
    console.error("Error obtener mensajes:", err);
    res.status(500).json({ error: "Error al obtener mensajes" });
    return;
  }
});

router.post("/messages/send", isAuthenticated, async (req: Request, res: Response) => {
  const {
    conversation_id,
    content,
    attachment_type,
    attachment_url,
    reply_to,
  } = req.body;
  const currentUser = getCurrentUserData(req);
  const sender_id = currentUser?.id;

  if (!sender_id) {
    res.status(401).json({ error: "Usuario no autenticado" });
    return;
  }

  if (!conversation_id || (!content && !attachment_url)) {
    res.status(400).json({ error: "conversation_id y contenido o attachment_url son requeridos" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const membership = await client.query(
      `SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2`,
      [conversation_id, sender_id]
    );
    if (membership.rowCount === 0) {
      await client.query("ROLLBACK");
      res.status(403).json({ error: "No es miembro de la conversación" });
      return;
    }

    const insertRes = await client.query(
      `
      INSERT INTO messages
        (conversation_id, sender_id, content, attachment_type, attachment_url, reply_to, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,NOW())
      RETURNING *;
    `,
      [conversation_id, sender_id, content || null, attachment_type || null, attachment_url || null, reply_to || null]
    );

    const newMessage = insertRes.rows[0];

    await client.query(
      `
      INSERT INTO message_reads (conversation_id, user_id, last_read_message_id, unread_count)
      VALUES ($1, $2, $3, 0)
      ON CONFLICT (conversation_id, user_id)
      DO UPDATE SET last_read_message_id = EXCLUDED.last_read_message_id, unread_count = 0;
    `,
      [conversation_id, sender_id, newMessage.id]
    );

    await client.query("COMMIT");
    res.status(201).json(newMessage);
    return;
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error enviar mensaje:", err);
    res.status(500).json({ error: "Error al enviar mensaje" });
    return;
  } finally {
    client.release();
  }
});

/* -----------------------
   Crear conversación
   ----------------------- */
router.post("/conversations/create", isAuthenticated, async (req: Request, res: Response) => {
  const currentUser = getCurrentUserData(req);
  const authUserId = currentUser?.id;

  if (!authUserId) {
    res.status(401).json({ error: "Usuario no autenticado" });
    return;
  }

  const { contactUsername, members, title, type } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let memberIds: number[] = [];

    if (Array.isArray(members) && members.length > 0) {
      // members: array of usernames
      const placeholders = members.map((_, i) => `$${i + 1}`).join(",");
      const usersRes = await client.query(
        `SELECT id, username FROM users WHERE username IN (${placeholders})`,
        members
      );
      if (usersRes.rowCount !== members.length) {
        throw new Error("Alguno de los miembros no existe");
      }
      memberIds = usersRes.rows.map((r) => r.id);
    } else if (contactUsername) {
      const ures = await client.query(`SELECT id FROM users WHERE username = $1`, [contactUsername]);
      if (ures.rowCount === 0) {
        throw new Error("Usuario de contacto no existe");
      }
      memberIds = [ures.rows[0].id];
    } else {
      throw new Error("Se requiere contactUsername o members");
    }

    // asegurar que el creador esté en la lista
    if (!memberIds.includes(authUserId)) memberIds.push(authUserId);

    // Si es conversación privada (2 miembros), verificar si ya existe conversación con exactamente esos 2 miembros
    if ((type === "private" || memberIds.length === 2) && memberIds.length === 2) {
      const existing = await client.query(
        `
        SELECT c.id
        FROM conversations c
        JOIN conversation_members cm ON cm.conversation_id = c.id
        WHERE cm.user_id = ANY($1)
        GROUP BY c.id
        HAVING COUNT(*) = 2
          AND BOOL_AND(cm.user_id = ANY($1))
        LIMIT 1;
      `,
        [memberIds]
      );

      if (existing.rowCount > 0) {
        await client.query("COMMIT");
        const conv = await client.query(`SELECT * FROM conversations WHERE id = $1`, [existing.rows[0].id]);
        res.status(200).json(conv.rows[0]);
        return;
      }
    }

    // Crear conversación
    const convRes = await client.query(
      `INSERT INTO conversations (title, type, created_by, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *;`,
      [title || null, type || (memberIds.length === 2 ? "private" : "group"), authUserId]
    );
    const conversationId = convRes.rows[0].id;

    // Insertar miembros
    for (const uid of memberIds) {
      await client.query(
        `INSERT INTO conversation_members (conversation_id, user_id, role, joined_at) VALUES ($1, $2, 'member', NOW()) ON CONFLICT DO NOTHING;`,
        [conversationId, uid]
      );
    }

    await client.query("COMMIT");

    const fullConv = await pool.query(
      `SELECT c.*, (SELECT json_agg(json_build_object('id', u.id, 'username', u.username, 'name', u.name, 'role', cm.role)) FROM conversation_members cm JOIN users u ON u.id = cm.user_id WHERE cm.conversation_id = c.id) AS members FROM conversations c WHERE c.id = $1`,
      [conversationId]
    );

    res.status(201).json(fullConv.rows[0]);
    return;
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Error crear conversación:", err);
    res.status(400).json({ error: err.message || "Error al crear conversación" });
    return;
  } finally {
    client.release();
  }
});

/* -----------------------
   Invitaciones
   ----------------------- */
router.post("/conversations/invite", isAuthenticated, async (req: Request, res: Response) => {
  const currentUser = getCurrentUserData(req);
  const authUserId = currentUser?.id;

  if (!authUserId) {
    res.status(401).json({ error: "Usuario no autenticado" });
    return;
  }

  const { conversation_id, receiver_email } = req.body;
  if (!conversation_id || !receiver_email) {
    res.status(400).json({ error: "conversation_id y receiver_email requeridos" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const isMember = await client.query(
      `SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2`,
      [conversation_id, authUserId]
    );
    if (isMember.rowCount === 0) {
      await client.query("ROLLBACK");
      res.status(403).json({ error: "No tienes permiso para invitar a esta conversación" });
      return;
    }

    const insertInv = await client.query(
      `
      INSERT INTO conversation_invitations
        (conversation_id, sender_id, receiver_email, status, created_at)
      VALUES ($1, $2, $3, 'pending', NOW())
      RETURNING *;
    `,
      [conversation_id, authUserId, receiver_email]
    );

    await client.query("COMMIT");
    // idealmente enviar un email con el enlace que incluya la id de invitación o token
    res.status(201).json(insertInv.rows[0]);
    return;
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error crear invitación:", err);
    res.status(500).json({ error: "Error al crear invitación" });
    return;
  } finally {
    client.release();
  }
});

router.get("/conversations/invitations", isAuthenticated, async (req: Request, res: Response) => {
  const currentUser = getCurrentUserData(req);
  const authUserId = currentUser?.id;

  if (!authUserId) {
    res.status(401).json({ error: "Usuario no autenticado" });
    return;
  }

  try {
    const userEmailRes = await pool.query(`SELECT email FROM users WHERE id = $1`, [authUserId]);
    if (userEmailRes.rowCount === 0) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    const email = userEmailRes.rows[0].email;
    if (!email) {
      res.status(400).json({ error: "Usuario no tiene email registrado" });
      return;
    }

    const invites = await pool.query(
      `SELECT ci.*, c.title, c.type, u.username as sender_username FROM conversation_invitations ci LEFT JOIN conversations c ON c.id = ci.conversation_id LEFT JOIN users u ON u.id = ci.sender_id WHERE ci.receiver_email = $1 AND ci.status = 'pending' ORDER BY ci.created_at DESC;`,
      [email]
    );

    res.json(invites.rows);
    return;
  } catch (err) {
    console.error("Error obtener invitaciones:", err);
    res.status(500).json({ error: "Error al obtener invitaciones" });
    return;
  }
});

router.post("/conversations/invite/accept", isAuthenticated, async (req: Request, res: Response) => {
  const currentUser = getCurrentUserData(req);
  const authUserId = currentUser?.id;

  if (!authUserId) {
    res.status(401).json({ error: "Usuario no autenticado" });
    return;
  }

  const { invitation_id } = req.body;
  if (!invitation_id) {
    res.status(400).json({ error: "invitation_id requerido" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const invRes = await client.query(`SELECT * FROM conversation_invitations WHERE id = $1 FOR UPDATE;`, [invitation_id]);
    if (invRes.rowCount === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Invitación no encontrada" });
      return;
    }
    const invite = invRes.rows[0];

    if (invite.status !== "pending") {
      await client.query("ROLLBACK");
      res.status(400).json({ error: "Invitación no está en estado pending" });
      return;
    }

    const userRes = await client.query(`SELECT email FROM users WHERE id = $1`, [authUserId]);
    if (userRes.rowCount === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }
    const email = userRes.rows[0].email;
    if (!email || email.toLowerCase() !== invite.receiver_email.toLowerCase()) {
      await client.query("ROLLBACK");
      res.status(403).json({ error: "La invitación no está dirigida al email de este usuario" });
      return;
    }

    await client.query(
      `INSERT INTO conversation_members (conversation_id, user_id, role, joined_at) VALUES ($1, $2, 'member', NOW()) ON CONFLICT DO NOTHING;`,
      [invite.conversation_id, authUserId]
    );

    await client.query(
      `UPDATE conversation_invitations SET status = 'accepted' WHERE id = $1`,
      [invitation_id]
    );

    await client.query("COMMIT");
    res.json({ success: true });
    return;
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error aceptar invitación:", err);
    res.status(500).json({ error: "Error al aceptar invitación" });
    return;
  } finally {
    client.release();
  }
});

/* -----------------------
   Lectura y eliminación
   ----------------------- */
router.post("/conversations/:conversationId/read", isAuthenticated, async (req: Request, res: Response) => {
  const currentUser = getCurrentUserData(req);
  const authUserId = currentUser?.id;
  const { conversationId } = req.params;
  const { last_read_message_id } = req.body;

  if (!authUserId) {
    res.status(401).json({ error: "Usuario no autenticado" });
    return;
  }
  if (!conversationId || !last_read_message_id) {
    res.status(400).json({ error: "conversationId y last_read_message_id requeridos" });
    return;
  }

  try {
    const membership = await pool.query(`SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2`, [conversationId, authUserId]);
    if (membership.rowCount === 0) {
      res.status(403).json({ error: "No es miembro de la conversación" });
      return;
    }

    const upsert = await pool.query(
      `
      INSERT INTO message_reads (conversation_id, user_id, last_read_message_id, unread_count)
      VALUES ($1, $2, $3, 0)
      ON CONFLICT (conversation_id, user_id)
      DO UPDATE SET last_read_message_id = EXCLUDED.last_read_message_id, unread_count = 0
      RETURNING *;
    `,
      [conversationId, authUserId, last_read_message_id]
    );

    res.json(upsert.rows[0]);
    return;
  } catch (err) {
    console.error("Error actualizar lectura:", err);
    res.status(500).json({ error: "Error al actualizar estado de lectura" });
    return;
  }
});

router.delete("/conversations/:conversationId", isAuthenticated, async (req: Request, res: Response) => {
  const currentUser = getCurrentUserData(req);
  const authUserId = currentUser?.id;
  const { conversationId } = req.params;

  if (!authUserId) {
    res.status(401).json({ error: "Usuario no autenticado" });
    return;
  }
  if (!conversationId) {
    res.status(400).json({ error: "conversationId requerido" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const convRes = await client.query(`SELECT created_by FROM conversations WHERE id = $1`, [conversationId]);
    if (convRes.rowCount === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Conversación no encontrada" });
      return;
    }
    const createdBy = convRes.rows[0].created_by;
    if (createdBy !== authUserId) {
      await client.query("ROLLBACK");
      res.status(403).json({ error: "Solo el creador puede eliminar la conversación" });
      return;
    }

    await client.query(`DELETE FROM conversations WHERE id = $1`, [conversationId]);
    await client.query("COMMIT");
    res.json({ success: true });
    return;
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error eliminar conversación:", err);
    res.status(500).json({ error: "Error al eliminar conversación" });
    return;
  } finally {
    client.release();
  }
});

export default router;
