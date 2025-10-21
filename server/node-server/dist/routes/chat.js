"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
exports.chatRouter = (0, express_1.Router)();
// ✅ Obtener conversaciones de un usuario
exports.chatRouter.get("/conversations/:userId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        const result = yield db_1.pool.query(`
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al obtener conversaciones" });
    }
}));
// ✅ Obtener mensajes de una conversación
exports.chatRouter.get("/messages/:conversationId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { conversationId } = req.params;
    try {
        const result = yield db_1.pool.query(`
      SELECT *
      FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
    `, [conversationId]);
        res.json(result.rows);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al obtener mensajes" });
    }
}));
// ✅ Enviar mensaje
exports.chatRouter.post("/messages/send", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { conversation_id, sender_id, content, attachment_type, attachment_url, reply_to } = req.body;
    try {
        const result = yield db_1.pool.query(`
      INSERT INTO messages
      (conversation_id, sender_id, content, attachment_type, attachment_url, reply_to)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
    `, [conversation_id, sender_id, content, attachment_type || null, attachment_url || null, reply_to || null]);
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al enviar mensaje" });
    }
}));
