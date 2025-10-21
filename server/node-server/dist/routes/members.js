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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/members.ts
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const auth_jwt_1 = require("../middlewares/auth-jwt");
const users_1 = require("../controllers/users");
const router = express_1.default.Router();
router.get("/status", (_req, res) => {
    res.json({ status: "ok", message: "status members ok" });
});
// GET /api/projects/:projectId/members
router.get("/:projectId", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId } = req.params;
    try {
        const result = yield db_1.pool.query(`SELECT u.id, u.name, u.username, ra.role
       FROM resource_access ra
       JOIN users u ON ra.user_id = u.id
       WHERE ra.resource_type = 'project' AND ra.resource_id = $1`, [projectId]);
        res.json(result.rows);
    }
    catch (error) {
        console.error("Error fetching project members:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
}));
// POST /api/projects/:projectId/invite
router.post("/invite/:projectId", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { projectId } = req.params;
    const { email, role } = req.body;
    const user = (0, users_1.getCurrentUserData)(req);
    const senderId = user === null || user === void 0 ? void 0 : user.id;
    try {
        const userResult = yield db_1.pool.query("SELECT id FROM users WHERE username = $1", [email]);
        const receiverId = ((_a = userResult.rows[0]) === null || _a === void 0 ? void 0 : _a.id) || null;
        yield db_1.pool.query(`INSERT INTO invitations (id, sender_id, receiver_id, receiver_email, resource_type, resource_id, role)
       VALUES (gen_random_uuid(), $1, $2, $3, 'project', $4, $5)`, [senderId, receiverId, email, projectId, role || "member"]);
        // Aquí puedes llamar a una función para enviar el correo si receiverId es null
        res.json({ message: "Invitación enviada" });
    }
    catch (error) {
        console.error("Error creando la invitación:", error);
        res.status(500).json({ error: "Error al invitar al usuario" });
    }
}));
// POST /api/invitations/:invitationId/accept
router.post("/accept-invite/:invitationId", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { invitationId } = req.params;
    const user = (0, users_1.getCurrentUserData)(req);
    const userId = user === null || user === void 0 ? void 0 : user.id;
    try {
        const result = yield db_1.pool.query(`UPDATE invitations
       SET status = 'accepted', receiver_id = $1
       WHERE id = $2 AND (receiver_id IS NULL OR receiver_id = $1)
       RETURNING resource_type, resource_id, role`, [userId, invitationId]);
        const invitation = result.rows[0];
        if (!invitation) {
            res.status(404).json({ error: "Invitación no válida o ya aceptada" });
            return;
        }
        yield db_1.pool.query(`INSERT INTO resource_access (user_id, resource_type, resource_id, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, resource_type, resource_id) DO NOTHING`, [
            userId,
            invitation.resource_type,
            invitation.resource_id,
            invitation.role,
        ]);
        res.json({ message: "Invitación aceptada" });
        return;
    }
    catch (error) {
        console.error("Error aceptando la invitación:", error);
        res.status(500).json({ error: "Error interno" });
        return;
    }
}));
exports.default = router;
