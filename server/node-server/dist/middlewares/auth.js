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
exports.isAuthenticate = void 0;
exports.isAdmin = isAdmin;
exports.hasProjectAccess = hasProjectAccess;
exports.hasProjectAccessFromNote = hasProjectAccessFromNote;
const db_1 = require("../db");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const users_1 = require("../controllers/users");
if (!process.env.JWT_SECRET) {
    throw new Error("Falta definir JWT_SECRET en variables de entorno");
}
const JWT_SECRET = process.env.JWT_SECRET;
function isAdmin(req, res, next) {
    const user = (0, users_1.getCurrentUserData)(req);
    if (!user) {
        res.status(400).json({ error: "user not found" });
        return;
    }
    if (user.privileges !== "admin") {
        res.status(403).json({ error: "Solo para admins" });
        return;
    }
    next();
}
function hasProjectAccess(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const projectId = req.params.id || req.params.projectId;
        const user = (0, users_1.getCurrentUserData)(req);
        const userId = user === null || user === void 0 ? void 0 : user.id;
        if (!projectId) {
            res.status(400).json({ error: "ID de proyecto requerido" });
            return;
        }
        if (!userId) {
            res.status(401).json({ error: "Usuario no autenticado" });
            return;
        }
        try {
            // Verificar si el usuario es admin
            if ((user === null || user === void 0 ? void 0 : user.privileges) === "admin") {
                next();
                return;
            }
            // Verificar si el usuario es el creador del proyecto o tiene acceso a través de resource_access
            const result = yield db_1.pool.query(`
			SELECT 1 FROM projects p
			LEFT JOIN resource_access ra ON p.id = ra.resource_id 
				AND ra.resource_type = 'project' 
				AND ra.user_id = $2
			WHERE p.id = $1 
				AND (p.created_by = $2 OR ra.user_id IS NOT NULL)
		`, [projectId, userId]);
            if (result.rows.length === 0) {
                res.status(403).json({ error: "No tienes acceso a este proyecto" });
                return;
            }
            next();
        }
        catch (error) {
            console.error("Error verificando acceso al proyecto:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    });
}
function hasProjectAccessFromNote(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const noteId = req.params.id;
        const user = (0, users_1.getCurrentUserData)(req);
        const userId = user === null || user === void 0 ? void 0 : user.id;
        if (!noteId) {
            res.status(400).json({ error: "ID de nota requerido" });
            return;
        }
        if (!userId) {
            res.status(401).json({ error: "Usuario no autenticado" });
            return;
        }
        try {
            // Verificar si el usuario es admin
            if ((user === null || user === void 0 ? void 0 : user.privileges) === "admin") {
                next();
                return;
            }
            // Verificar que el usuario tenga acceso al proyecto de la nota
            const result = yield db_1.pool.query(`
			SELECT n.user_id, p.id as project_id FROM project_notes n
			JOIN projects p ON n.project_id = p.id
			LEFT JOIN resource_access ra ON p.id = ra.resource_id 
				AND ra.resource_type = 'project' 
				AND ra.user_id = $2
			WHERE n.id = $1 
				AND (p.created_by = $2 OR ra.user_id IS NOT NULL)
		`, [noteId, userId]);
            if (result.rows.length === 0) {
                res
                    .status(403)
                    .json({
                    error: "No tienes permisos para acceder a esta nota o no existe",
                });
                return;
            }
            next();
        }
        catch (error) {
            console.error("Error verificando acceso a la nota:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    });
}
// Middleware para verificar el JWT
const isAuthenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Token no proporcionado" });
    }
    const token = authHeader.split(" ")[1];
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Token inválido" });
        }
        req.user = decoded;
        next();
    });
};
exports.isAuthenticate = isAuthenticate;
