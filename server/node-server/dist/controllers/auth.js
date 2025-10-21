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
exports.logout = exports.getCurrentUser = exports.login = void 0;
exports.generateJWT = generateJWT;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const dotenv_1 = __importDefault(require("dotenv"));
const authService_1 = require("../services/authService");
dotenv_1.default.config();
if (!process.env.JWT_SECRET) {
    throw new Error("Falta definir JWT_SECRET en variables de entorno");
}
const JWT_SECRET = process.env.JWT_SECRET;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ message: "Faltan credenciales" });
        return;
    }
    try {
        const user = yield (0, authService_1.findUserByUsername)(username);
        if (user === null) {
            res.status(401).json({ message: "Usuario no encontrado" });
            return;
        }
        const match = yield bcrypt_1.default.compare(password, user.password);
        if (!match) {
            res.status(402).json({ message: "Contraseña incorrecta" });
            return;
        }
        // Genera el token JWT
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            username: user.username,
            name: user.name,
            privileges: user.privileges,
        }, JWT_SECRET, { expiresIn: "24h" });
        // Opcional: registrar el login
        yield (0, authService_1.logUserLogin)(user.id, req.ip || "0.0.0.0", req.headers["user-agent"] || "");
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 1000 * 60 * 60 * 24,
        });
        res.status(201).send("Login correcto");
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});
exports.login = login;
const getCurrentUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.cookies.token;
    if (!token) {
        res.status(401).json({ message: "No autorizado" });
        return;
    }
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            res.status(401).json({ message: "No autorizado" });
            return;
        }
        const user = decoded;
        res.json(user);
    });
});
exports.getCurrentUser = getCurrentUser;
function generateJWT(user) {
    return jsonwebtoken_1.default.sign({
        id: user.id,
        username: user.username,
        name: user.name,
        privileges: user.privileges,
    }, JWT_SECRET, { expiresIn: "7d" });
}
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.status(200).json({ message: "Sesión cerrada" });
});
exports.logout = logout;
