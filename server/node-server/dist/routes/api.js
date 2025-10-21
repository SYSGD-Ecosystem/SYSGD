"use strict";
/**
 * @deprecated
 * Estas viendo la primera version de la api, este archivo debe ser refactorizado
 */
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
const db_1 = require("../db");
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_jwt_1 = require("../middlewares/auth-jwt");
const auth_1 = require("../controllers/auth");
const auth_2 = require("../controllers/auth");
const users_1 = require("../controllers/users");
const archives_controller_1 = require("../controllers/archives.controller");
const auth_3 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.get("/archives", auth_jwt_1.isAuthenticated, archives_controller_1.getArchives);
/**
 * DELETE /api/archives/:id
 * Elimina un expediente (archivo de gestión) por id.
 * Solo el propietario o admin puede eliminarlo.
 */
router.delete("/archives/:id", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const user = (0, users_1.getCurrentUserData)(req);
    const user_id = user === null || user === void 0 ? void 0 : user.id;
    const privileges = user === null || user === void 0 ? void 0 : user.privileges;
    try {
        const result = yield db_1.pool.query("SELECT user_id FROM document_management_file WHERE id = $1", [id]);
        if (result.rows.length === 0 ||
            (privileges !== "admin" && result.rows[0].user_id !== user_id)) {
            res
                .status(403)
                .json({ error: "No tienes permisos para eliminar este expediente." });
            return;
        }
        yield db_1.pool.query("DELETE FROM document_management_file WHERE id = $1", [
            id,
        ]);
        res.json({ message: "Expediente eliminado correctamente" });
    }
    catch (err) {
        res.status(500).json({ error: "Error al eliminar el expediente" });
    }
}));
/**
 * PUT /api/archives/:id
 * Modifica los datos principales de un expediente (code, company, name).
 * Solo el propietario o admin puede modificarlo.
 */
router.put("/archives/:id", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { code, company, name } = req.body;
    const user = (0, users_1.getCurrentUserData)(req);
    const user_id = user === null || user === void 0 ? void 0 : user.id;
    const privileges = user === null || user === void 0 ? void 0 : user.privileges;
    if (!code && !company && !name) {
        res.status(400).json({ error: "No hay datos para actualizar" });
        return;
    }
    try {
        const result = yield db_1.pool.query("SELECT user_id FROM document_management_file WHERE id = $1", [id]);
        if (result.rows.length === 0 ||
            (privileges !== "admin" && result.rows[0].user_id !== user_id)) {
            res.status(403).json({
                error: "No tienes permisos para modificar este expediente.",
            });
            return;
        }
        const fields = [];
        const values = [];
        let idx = 1;
        if (code) {
            fields.push(`code = $${idx++}`);
            values.push(code);
        }
        if (company) {
            fields.push(`company = $${idx++}`);
            values.push(company);
        }
        if (name) {
            fields.push(`name = $${idx++}`);
            values.push(name);
        }
        values.push(id);
        yield db_1.pool.query(`UPDATE document_management_file SET ${fields.join(", ")} WHERE id = $${idx}`, values);
        res.json({ message: "Expediente actualizado correctamente" });
    }
    catch (err) {
        res.status(500).json({ error: "Error al actualizar el expediente" });
    }
}));
// GET /api/get_data?id=ABC123
router.get("/get_data", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.query;
    if (typeof id !== "string") {
        res.status(400).json({ error: "Id inválido" });
        return;
    }
    const user = (0, users_1.getCurrentUserData)(req);
    const user_id = user === null || user === void 0 ? void 0 : user.id;
    try {
        const result = yield db_1.pool.query("SELECT classification_chart FROM document_management_file WHERE id = $1 AND user_id = $2", [id, user_id]);
        res.json(result.rows);
    }
    catch (err) {
        res.status(500).json({ error: "Error al obtener los datos" });
    }
}));
// POST /api/create_new_classification_box
router.post("/create", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { company, code, name } = req.body;
    if (!company || !code || !name) {
        res.status(400).send("400");
        return;
    }
    const user = (0, users_1.getCurrentUserData)(req);
    const user_id = user === null || user === void 0 ? void 0 : user.id;
    try {
        yield db_1.pool.query("INSERT INTO document_management_file (code, company, name, user_id) VALUES ($1, $2, $3, $4)", [code, company, name, user_id]);
        res.status(201).send("201");
    }
    catch (err) {
        res.status(500).send("500");
    }
}));
// POST /api/add_classification_data
router.post("/add_classification_data", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, data } = req.body;
    if (!id || !data) {
        res.status(400).send("400");
        return;
    }
    try {
        yield db_1.pool.query("UPDATE document_management_file SET classification_chart = $1 WHERE id = $2", [data, id]);
        res.status(201).send("201");
    }
    catch (err) {
        res.status(500).send("500");
    }
}));
router.post("/add-document-entry", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, data } = req.body;
    if (!id || !data) {
        res.status(400).json({ error: "Faltan campos obligatorios." });
        return;
    }
    const user = (0, users_1.getCurrentUserData)(req);
    const user_id = user === null || user === void 0 ? void 0 : user.id;
    if (!user_id) {
        res.status(401).json({ error: "No estás autorizado." });
        return;
    }
    const result = yield db_1.pool.query("SELECT user_id FROM document_management_file WHERE id = $1", [id]);
    if (result.rows.length === 0 ||
        (user.privileges !== "admin" && result.rows[0].user_id !== user_id)) {
        res
            .status(403)
            .json({ error: "No tienes permisos para modificar este expediente." });
        return;
    }
    try {
        yield db_1.pool.query("UPDATE document_management_file SET entry_register = $1 WHERE id = $2", [data, id]);
        res.status(201).send("201");
    }
    catch (err) {
        res.status(500).send("500");
    }
}));
// GET /api/get-document-entry?id=123
router.get("/get-document-entry", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.query;
    if (typeof id !== "string") {
        res.status(400).json({ error: "Id inválido" });
        return;
    }
    const user = (0, users_1.getCurrentUserData)(req);
    const user_id = user === null || user === void 0 ? void 0 : user.id;
    try {
        const result = yield db_1.pool.query("SELECT entry_register FROM document_management_file WHERE id = $1 AND user_id = $2", [id, user_id]);
        res.json(result.rows);
    }
    catch (err) {
        res.status(500).json({ error: "Error al obtener los datos" });
    }
}));
router.post("/add-document-exit", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, data } = req.body;
    if (!id || !data) {
        res.status(400).json({ error: "Faltan campos obligatorios." });
        return;
    }
    const user = (0, users_1.getCurrentUserData)(req);
    const user_id = user === null || user === void 0 ? void 0 : user.id;
    const privileges = user === null || user === void 0 ? void 0 : user.privileges;
    if (!user_id) {
        res.status(401).json({ error: "No estás autorizado." });
        return;
    }
    const result = yield db_1.pool.query("SELECT user_id FROM document_management_file WHERE id = $1", [id]);
    if (result.rows.length === 0 ||
        (privileges !== "admin" && result.rows[0].user_id !== user_id)) {
        res
            .status(403)
            .json({ error: "No tienes permisos para modificar este expediente." });
        return;
    }
    try {
        yield db_1.pool.query("UPDATE document_management_file SET exit_register = $1 WHERE id = $2", [data, id]);
        res.status(201).send("201");
    }
    catch (err) {
        res.status(500).send("500");
    }
}));
// GET /api/users - lista usuarios (solo admin)
router.get("/users", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = (0, users_1.getCurrentUserData)(req);
    const privileges = user === null || user === void 0 ? void 0 : user.privileges;
    if (privileges !== "admin") {
        res.status(403).json({ error: "No autorizado" });
        return;
    }
    try {
        const result = yield db_1.pool.query("SELECT id, name, username, privileges FROM users ORDER BY id");
        res.json(result.rows);
    }
    catch (_a) {
        res.status(500).json({ error: "Error al obtener usuarios" });
    }
}));
// POST /api/users - crear usuario (solo admin)
router.post("/users", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = (0, users_1.getCurrentUserData)(req);
    if ((user === null || user === void 0 ? void 0 : user.privileges) !== "admin") {
        res.status(403).json({ error: "No autorizado" });
        return;
    }
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
router.get("/admin/users", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = (0, users_1.getCurrentUserData)(req);
    const privileges = user === null || user === void 0 ? void 0 : user.privileges;
    if (privileges !== "admin") {
        res.status(403).json({ error: "Acceso denegado" });
        return;
    }
    try {
        const result = yield db_1.pool.query("SELECT id, name, username, privileges FROM users ORDER BY id");
        res.json(result.rows);
    }
    catch (_a) {
        res.status(500).json({ error: "Error al obtener usuarios" });
    }
}));
// POST /api/admin/users
router.post("/admin/users", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = (0, users_1.getCurrentUserData)(req);
    if (!user)
        return;
    if (user.privileges !== "admin") {
        res.status(403).json({ error: "Acceso denegado" });
        return;
    }
    const { name, username, password, privileges } = req.body;
    if (!name || !username || !password || !privileges) {
        res.status(400).json({ error: "Faltan datos obligatorios." });
        return;
    }
    try {
        yield db_1.pool.query("INSERT INTO users (name, username, password, privileges) VALUES ($1,$2,crypt($3, gen_salt('bf')),$4)", [name, username, password, privileges]);
        res.status(201).send("201");
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    }
    catch (e) {
        if (e.code === "23505")
            res.status(409).json({ error: "Usuario existe" });
        else
            res.status(500).json({ error: "Error al crear usuario" });
    }
}));
// PUT /api/admin/users/:id
router.put("/admin/users/:id", auth_jwt_1.isAuthenticated, auth_3.isAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name, username, password, privileges } = req.body;
    if (!id) {
        res.status(400).json({ error: "Id requerido" });
        return;
    }
    try {
        yield db_1.pool.query("UPDATE users SET name = COALESCE($1,name), username = COALESCE($2,username), password = COALESCE(crypt($3, gen_salt('bf')),password), privileges = COALESCE($4,privileges) WHERE id = $5", [name, username, password || null, privileges, id]);
        res.sendStatus(204);
    }
    catch (_a) {
        res.status(500).json({ error: "Error al actualizar" });
    }
}));
// DELETE /api/admin/users/:id
router.delete("/admin/users/:id", auth_jwt_1.isAuthenticated, auth_3.isAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield db_1.pool.query("DELETE FROM users WHERE id = $1", [id]);
        res.sendStatus(204);
    }
    catch (_a) {
        res.status(500).json({ error: "Error al eliminar" });
    }
}));
// GET /api/get-organization-chart?id=FILEID
router.get("/get-organization-chart", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.query;
    if (!id) {
        res.status(400).json({ error: "Falta id" });
        return;
    }
    try {
        const result = yield db_1.pool.query("SELECT data FROM organization_chart WHERE file_id = $1", [id]);
        if (result.rows.length === 0) {
            res.json(null);
            return;
        }
        res.json(result.rows[0].data);
    }
    catch (error) {
        res.status(500).json({ error: "Error al obtener organigrama" });
    }
}));
// POST /api/save-organization-chart {id, data}
router.post("/save-organization-chart", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, data } = req.body;
    if (!id || !data) {
        res.status(400).json({ error: "Faltan datos" });
        return;
    }
    const user = (0, users_1.getCurrentUserData)(req);
    const userId = user === null || user === void 0 ? void 0 : user.id;
    if (!userId) {
        res.status(401).json({ error: "No autorizado" });
        return;
    }
    try {
        // check ownership or admin
        const ownerCheck = yield db_1.pool.query("SELECT user_id FROM document_management_file WHERE id = $1", [id]);
        if (ownerCheck.rows.length === 0) {
            res.status(404).json({ error: "Archivo no encontrado" });
            return;
        }
        if (ownerCheck.rows[0].user_id !== userId && (user === null || user === void 0 ? void 0 : user.privileges) !== "admin") {
            res.status(403).json({ error: "Sin permisos" });
            return;
        }
        yield db_1.pool.query("INSERT INTO organization_chart(file_id,data) VALUES ($1,$2) ON CONFLICT (file_id) DO UPDATE SET data = EXCLUDED.data", [id, data]);
        res.status(201).send("201");
    }
    catch (error) {
        res.status(500).json({ error: "Error al guardar organigrama" });
    }
}));
// POST /api/add-retention-schedule
router.post("/add-retention-schedule", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, data } = req.body;
    if (!id || !data) {
        res.status(400).json({ error: "Faltan campos obligatorios." });
        return;
    }
    const user = (0, users_1.getCurrentUserData)(req);
    const user_id = user === null || user === void 0 ? void 0 : user.id;
    if (!user_id) {
        res.status(401).json({ error: "No estás autorizado." });
        return;
    }
    const result = yield db_1.pool.query("SELECT user_id FROM document_management_file WHERE id = $1", [id]);
    if (result.rows.length === 0 ||
        ((user === null || user === void 0 ? void 0 : user.privileges) !== "admin" && result.rows[0].user_id !== user_id)) {
        res
            .status(403)
            .json({ error: "No tienes permisos para modificar este expediente." });
        return;
    }
    try {
        yield db_1.pool.query("UPDATE document_management_file SET retention_schedule = $1 WHERE id = $2", [data, id]);
        res.status(201).send("201");
    }
    catch (_a) {
        res.status(500).send("500");
    }
}));
// POST /api/add-document-topographic
router.post("/add-document-topographic", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, data } = req.body;
    if (!id || !data) {
        res.status(400).json({ error: "Faltan campos obligatorios." });
        return;
    }
    const user = (0, users_1.getCurrentUserData)(req);
    const user_id = user === null || user === void 0 ? void 0 : user.id;
    if (!user_id) {
        res.status(401).json({ error: "No estás autorizado." });
        return;
    }
    const result = yield db_1.pool.query("SELECT user_id FROM document_management_file WHERE id = $1", [id]);
    if (result.rows.length === 0 ||
        ((user === null || user === void 0 ? void 0 : user.privileges) !== "admin" && result.rows[0].user_id !== user_id)) {
        res
            .status(403)
            .json({ error: "No tienes permisos para modificar este expediente." });
        return;
    }
    try {
        yield db_1.pool.query("UPDATE document_management_file SET topographic_register = $1 WHERE id = $2", [data, id]);
        res.status(201).send("201");
    }
    catch (_a) {
        res.status(500).send("500");
    }
}));
// POST /api/add-document-loan
router.post("/add-document-loan", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, data } = req.body;
    if (!id || !data) {
        res.status(400).json({ error: "Faltan campos obligatorios." });
        return;
    }
    const user = (0, users_1.getCurrentUserData)(req);
    const user_id = user === null || user === void 0 ? void 0 : user.id;
    if (!user_id) {
        res.status(401).json({ error: "No estás autorizado." });
        return;
    }
    const result = yield db_1.pool.query("SELECT user_id FROM document_management_file WHERE id = $1", [id]);
    if (result.rows.length === 0 ||
        ((user === null || user === void 0 ? void 0 : user.privileges) !== "admin" && result.rows[0].user_id !== user_id)) {
        res
            .status(403)
            .json({ error: "No tienes permisos para modificar este expediente." });
        return;
    }
    try {
        yield db_1.pool.query("UPDATE document_management_file SET loan_register = $1 WHERE id = $2", [data, id]);
        res.status(201).send("201");
    }
    catch (_a) {
        res.status(500).send("500");
    }
}));
// GET /api/get-document-exit?id=123
router.get("/get-document-exit", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.query;
    if (typeof id !== "string") {
        res.status(400).json({ error: "Id inválido" });
        return;
    }
    const user = (0, users_1.getCurrentUserData)(req);
    const user_id = user === null || user === void 0 ? void 0 : user.id;
    try {
        const result = yield db_1.pool.query("SELECT exit_register FROM document_management_file WHERE id = $1 AND user_id = $2", [id, user_id]);
        res.json(result.rows);
    }
    catch (err) {
        res.status(500).json({ error: "Error al obtener los datos" });
    }
}));
// GET /api/get-retention-schedule?id=123
router.get("/get-retention-schedule", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.query;
    if (typeof id !== "string") {
        res.status(400).json({ error: "Id inválido" });
        return;
    }
    const user = (0, users_1.getCurrentUserData)(req);
    const user_id = user === null || user === void 0 ? void 0 : user.id;
    try {
        const result = yield db_1.pool.query("SELECT retention_schedule FROM document_management_file WHERE id = $1 AND user_id = $2", [id, user_id]);
        res.json(result.rows);
    }
    catch (_a) {
        res.status(500).json({ error: "Error al obtener los datos" });
    }
}));
// GET /api/get-document-topographic?id=123
router.get("/get-document-topographic", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.query;
    if (typeof id !== "string") {
        res.status(400).json({ error: "Id inválido" });
        return;
    }
    const user = (0, users_1.getCurrentUserData)(req);
    const user_id = user === null || user === void 0 ? void 0 : user.id;
    try {
        const result = yield db_1.pool.query("SELECT topographic_register FROM document_management_file WHERE id = $1 AND user_id = $2", [id, user_id]);
        res.json(result.rows);
    }
    catch (_a) {
        res.status(500).json({ error: "Error al obtener los datos" });
    }
}));
// GET /api/get-document-loan?id=123
router.get("/get-document-loan", auth_jwt_1.isAuthenticated, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.query;
    if (typeof id !== "string") {
        res.status(400).json({ error: "Id inválido" });
        return;
    }
    const user = (0, users_1.getCurrentUserData)(req);
    const user_id = user === null || user === void 0 ? void 0 : user.id;
    try {
        const result = yield db_1.pool.query("SELECT loan_register FROM document_management_file WHERE id = $1 AND user_id = $2", [id, user_id]);
        res.json(result.rows);
    }
    catch (_a) {
        res.status(500).json({ error: "Error al obtener los datos" });
    }
}));
/**
 * @swagger
 * /api/status:
 *   get:
 *     summary: Verifica el estado del servidor
 *     tags: [Sistema]
 *     responses:
 *       200:
 *         description: Servidor activo
 */
router.get("/status", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json({ status: "ok", message: "Servidor activo y listo" });
}));
router.get("/me", auth_2.getCurrentUser);
router.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //TODO: Implementar verificación de email
    const { name, username, password } = req.body;
    if (!name || !username || !password) {
        res.status(400).send("400");
        return;
    }
    let privileges = "user";
    try {
        const usercount = yield db_1.pool.query("SELECT id FROM users");
        if (usercount.rows.length === 0) {
            privileges = "admin";
        }
        const userExists = yield db_1.pool.query("SELECT id FROM users WHERE username = $1", [username]);
        if (userExists.rows.length > 0) {
            res.status(409).send("Usuario ya existe");
            return;
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        yield db_1.pool.query("INSERT INTO users (name, username, password, privileges) VALUES ($1, $2, $3, $4)", [name, username, hashedPassword, privileges]);
        res.status(201).send("Usuario registrado");
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Error interno del servidor");
    }
}));
router.post("/login", auth_1.login);
router.get("/logout", auth_1.logout);
// GET /api/users - Devuelve todos los usuarios (solo admin)
router.get("/users", auth_jwt_1.isAuthenticated, auth_3.isAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield db_1.pool.query("SELECT id, name, username, privileges FROM users");
        res.json(result.rows);
    }
    catch (err) {
        res.status(500).json({ error: "Error al obtener los usuarios" });
    }
}));
// DELETE /api/users/:id - Elimina usuario y sus documentos (solo admin)
router.delete("/users/:id", auth_jwt_1.isAuthenticated, auth_3.isAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    catch (err) {
        res.status(500).json({ error: "Error al eliminar el usuario" });
    }
}));
// PUT /api/users/:id/password - Actualiza la contraseña (solo admin)
router.put("/users/:id/password", auth_jwt_1.isAuthenticated, auth_3.isAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = Number.parseInt(req.params.id, 10);
    const { password } = req.body;
    if (Number.isNaN(userId) || !password) {
        res.status(400).json({ error: "Datos inválidos" });
        return;
    }
    try {
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const result = yield db_1.pool.query("UPDATE users SET password = $1 WHERE id = $2 RETURNING id", [hashedPassword, userId]);
        if (result.rowCount === 0) {
            res.status(404).json({ error: "Usuario no encontrado" });
            return;
        }
        res.json({ message: "Contraseña actualizada" });
    }
    catch (err) {
        res.status(500).json({ error: "Error al actualizar la contraseña" });
    }
}));
// PUT /api/users/:id - Actualiza nombre y nombre de usuario (solo admin)
router.put("/users/:id", auth_jwt_1.isAuthenticated, auth_3.isAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = Number.parseInt(req.params.id, 10);
    const { name, username } = req.body;
    if (Number.isNaN(userId) || (!name && !username)) {
        res.status(400).json({ error: "Datos inválidos" });
        return;
    }
    try {
        if (username) {
            const exists = yield db_1.pool.query("SELECT id FROM users WHERE username = $1 AND id <> $2", [username, userId]);
            if (exists.rows.length > 0) {
                res.status(409).json({ error: "El nombre de usuario ya existe" });
                return;
            }
        }
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
    catch (err) {
        res.status(500).json({ error: "Error al actualizar el usuario" });
    }
}));
router.get("/user-count", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield db_1.pool.query("SELECT COUNT(*) FROM users WHERE privileges <> 'admin'");
        res.json({ count: Number(result.rows[0].count) });
    }
    catch (_a) {
        res.status(500).json({ error: "Error al obtener la cantidad de usuarios" });
    }
}));
exports.default = router;
