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
exports.getUsers = exports.getCurrentUserData = exports.register = void 0;
const db_1 = require("../db");
const bcrypt_1 = __importDefault(require("bcrypt"));
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
});
exports.register = register;
const getCurrentUserData = (req) => {
    const user = req.user;
    if (!user) {
        return null;
    }
    return user;
};
exports.getCurrentUserData = getCurrentUserData;
/**
 * @admin_only
 * @security_critical
 * Devuelve todos los usuarios, asegurarte de establecer un middleware de administración antes de invocar esta función
 */
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { rows } = yield db_1.pool.query("SELECT id, name, username, privileges FROM users ORDER BY id");
        res.json(rows);
    }
    catch (_a) {
        res.status(500).json({ error: "Error al obtener usuarios" });
    }
});
exports.getUsers = getUsers;
