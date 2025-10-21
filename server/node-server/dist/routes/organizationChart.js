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
const express_1 = require("express");
const db_1 = require("../db");
const auth_jwt_1 = require("../middlewares/auth-jwt");
const users_1 = require("../controllers/users");
const router = (0, express_1.Router)();
// All routes require auth
router.use(auth_jwt_1.isAuthenticated);
// GET /api/organization?id=FILEID
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.query;
    if (!id) {
        res.status(400).json({ error: "Falta id" });
        return;
    }
    try {
        const { rows } = yield db_1.pool.query("SELECT data FROM organization_chart WHERE file_id = $1", [id]);
        if (rows.length === 0) {
            res.json(null);
            return;
        }
        res.json(rows[0].data);
    }
    catch (_a) {
        res.status(500).json({ error: "Error al obtener organigrama" });
    }
}));
// POST /api/organization {id,data}
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, data } = req.body;
    if (!id || !data) {
        res.status(400).json({ error: "Faltan datos" });
        return;
    }
    const user = (0, users_1.getCurrentUserData)(req);
    const userId = user === null || user === void 0 ? void 0 : user.id;
    try {
        const owner = yield db_1.pool.query("SELECT user_id FROM document_management_file WHERE id = $1", [id]);
        if (owner.rows.length === 0) {
            res.status(404).json({ error: "Archivo no encontrado" });
            return;
        }
        if (owner.rows[0].user_id !== userId &&
            (user === null || user === void 0 ? void 0 : user.privileges) !== "admin") {
            res.status(403).json({ error: "Sin permisos" });
            return;
        }
        yield db_1.pool.query("INSERT INTO organization_chart(file_id,data) VALUES ($1,$2) ON CONFLICT (file_id) DO UPDATE SET data = EXCLUDED.data", [id, data]);
        res.status(201).send("201");
    }
    catch (_a) {
        res.status(500).json({ error: "Error al guardar" });
    }
}));
exports.default = router;
