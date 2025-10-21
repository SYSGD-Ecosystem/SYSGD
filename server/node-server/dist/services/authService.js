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
exports.logUserLogin = exports.findUserByUsername = exports.createUser = void 0;
const db_1 = require("../db");
const createUser = (name, username, password, privileges) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield db_1.pool.query("INSERT INTO users (name, username, password, privileges) VALUES ($1, $2, $3, $4) RETURNING *", [name, username, password, privileges]);
        return {
            success: true,
            user: result.rows[0],
        };
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    }
    catch (error) {
        if (error.code === "23505") {
            // Código de error PostgreSQL para violación de restricción única
            return {
                success: false,
                message: "El nombre de usuario ya está en uso",
            };
        }
        console.error("Error al crear usuario:", error);
        return {
            success: false,
            message: "Error interno del servidor",
        };
    }
});
exports.createUser = createUser;
const findUserByUsername = (username) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db_1.pool.query("SELECT * FROM users WHERE username = $1", [
        username,
    ]);
    return result.rows[0] || null;
});
exports.findUserByUsername = findUserByUsername;
const logUserLogin = (userId, ip, userAgent) => __awaiter(void 0, void 0, void 0, function* () {
    yield db_1.pool.query("INSERT INTO users_logins (user_id, ip_address, user_agent) VALUES ($1, $2, $3)", [userId, ip, userAgent]);
});
exports.logUserLogin = logUserLogin;
