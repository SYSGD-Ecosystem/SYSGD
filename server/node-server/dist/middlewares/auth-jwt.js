"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthenticated = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
if (!process.env.JWT_SECRET) {
    throw new Error("Falta definir JWT_SECRET en variables de entorno");
}
const JWT_SECRET = process.env.JWT_SECRET;
const isAuthenticated = (req, res, next) => {
    var _a;
    const token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.token;
    if (!token) {
        res.status(401).json({ message: "Token no proporcionado" });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Guardamos info del usuario en la request para accederla después
        req.user = decoded;
        next();
    }
    catch (err) {
        console.error(err);
        res.status(403).json({ message: "Token inválido o expirado" });
    }
};
exports.isAuthenticated = isAuthenticated;
