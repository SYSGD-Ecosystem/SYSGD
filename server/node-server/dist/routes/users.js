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
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = require("../db");
const auth_jwt_1 = require("../middlewares/auth-jwt");
const users_1 = require("../controllers/users");
const auth_1 = require("../controllers/auth");
const router = (0, express_1.Router)();
// Current user data
router.get("/me", auth_1.getCurrentUser);
// Register new user (first becomes admin)
router.post("/register", users_1.register);
router.get("/public-users", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { rows } = yield db_1.pool.query("SELECT id, name, username FROM users WHERE is_public = true");
    res.json(rows);
}));
// ---- Admin only CRUD ----
router.use(auth_jwt_1.isAuthenticated);
router.put("/public", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = (0, users_1.getCurrentUserData)(req);
    const userId = user === null || user === void 0 ? void 0 : user.id;
    const { isPublic } = req.body;
    if (Number.isNaN(userId) || typeof isPublic !== "boolean") {
        res.status(400).json({ error: "Datos inválidos" });
        return;
    }
    try {
        const result = yield db_1.pool.query("UPDATE users SET is_public = $1 WHERE id = $2 RETURNING id", [isPublic, userId]);
        if (result.rowCount === 0) {
            res.status(404).json({ error: "Usuario no encontrado" });
            return;
        }
        res.json({ message: "Usuario actualizado" });
    }
    catch (_a) {
        res.status(500).json({ error: "Error al actualizar" });
    }
}));
router.use((req, res, next) => {
    const user = (0, users_1.getCurrentUserData)(req);
    if ((user === null || user === void 0 ? void 0 : user.privileges) !== "admin") {
        res.status(403).json({ error: "No autorizado" });
        return;
    }
    next();
});
// List users
router.get("/", users_1.getUsers);
// Create user
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, username, password, privileges } = req.body;
    if (!name || !username || !password || !privileges) {
        res.status(400).json({ error: "Faltan datos" });
        return;
    }
    try {
        yield db_1.pool.query("INSERT INTO users (name, username, password, privileges) VALUES ($1,$2,crypt($3, gen_salt('bf')),$4)", [name, username, password, privileges]);
        res.status(201).send("201");
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    }
    catch (e) {
        if (e.code === "23505")
            res.status(409).json({ error: "Usuario ya existe" });
        else
            res.status(500).json({ error: "Error servidor" });
    }
}));
// Update basic data
router.put("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = Number.parseInt(req.params.id, 10);
    const { name, username } = req.body;
    if (Number.isNaN(userId) || (!name && !username)) {
        res.status(400).json({ error: "Datos inválidos" });
        return;
    }
    try {
        const fields = [];
        const values = [];
        let idx = 1;
        if (name) {
            fields.push(`name = $${idx++}`);
            values.push(name);
        }
        if (username) {
            fields.push(`username = $${idx++}`);
            values.push(username);
        }
        values.push(userId);
        const result = yield db_1.pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id`, values);
        if (result.rowCount === 0) {
            res.status(404).json({ error: "Usuario no encontrado" });
            return;
        }
        res.json({ message: "Usuario actualizado" });
    }
    catch (_a) {
        res.status(500).json({ error: "Error al actualizar" });
    }
}));
// Update password
router.put("/:id/password", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = Number.parseInt(req.params.id, 10);
    const { password } = req.body;
    if (Number.isNaN(userId) || !password) {
        res.status(400).json({ error: "Datos inválidos" });
        return;
    }
    try {
        const hashed = yield bcrypt_1.default.hash(password, 10);
        const result = yield db_1.pool.query("UPDATE users SET password = $1 WHERE id = $2 RETURNING id", [hashed, userId]);
        if (result.rowCount === 0) {
            res.status(404).json({ error: "Usuario no encontrado" });
            return;
        }
        res.json({ message: "Contraseña actualizada" });
    }
    catch (_a) {
        res.status(500).json({ error: "Error" });
    }
}));
// Delete user (and their files)
router.delete("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) {
        res.status(400).json({ error: "ID inválido" });
        return;
    }
    try {
        yield db_1.pool.query("DELETE FROM document_management_file WHERE user_id = $1", [userId]);
        const result = yield db_1.pool.query("DELETE FROM users WHERE id = $1 RETURNING id", [userId]);
        if (result.rowCount === 0) {
            res.status(404).json({ error: "Usuario no encontrado" });
            return;
        }
        res.json({ message: "Usuario y documentos eliminados" });
    }
    catch (_a) {
        res.status(500).json({ error: "Error al eliminar" });
    }
}));
exports.default = router;
