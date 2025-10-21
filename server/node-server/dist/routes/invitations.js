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
// routes/invitations.ts
const express_1 = require("express");
const db_1 = require("../db");
const auth_jwt_1 = require("../middlewares/auth-jwt");
const users_1 = require("../controllers/users");
const router = (0, express_1.Router)();
// Ver invitaciones recibidas
router.get("/", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = (0, users_1.getCurrentUserData)(req);
    const user_id = user === null || user === void 0 ? void 0 : user.id;
    try {
        const result = yield db_1.pool.query(`SELECT i.id, i.resource_id, i.resource_type, i.role, i.receiver_email,
                i.created_at, u.name as sender_name, u.username as sender_email
         FROM invitations i
         JOIN users u ON i.sender_id = u.id
         WHERE i.receiver_id = $1 AND i.status = 'pending'`, [user_id]);
        res.json(result.rows);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ error: "Error obteniendo invitaciones" });
    }
}));
exports.default = router;
