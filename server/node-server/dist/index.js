"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
const initDatabase_1 = require("./initDatabase");
const routes_1 = __importDefault(require("./routes"));
const passport_1 = __importDefault(require("passport"));
require("./passport");
const swagger_1 = require("./swagger");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cookie_parser_1.default)());
const PORT = process.env.PORT || 3000;
const CLIENT_HOST = process.env.CLIENT_HOST;
const shouldInitDB = process.env.INIT_DB_ON_START === "true";
const allowedOrigins = ((_a = process.env.ALLOWED_ORIGINS) === null || _a === void 0 ? void 0 : _a.split(",")) || [];
const isAcceptAllOrigins = process.env.ACCEPT_ALL_ORIGINS === "true";
if (isAcceptAllOrigins) {
    console.warn("Aceptando todos los origenes");
    app.use((0, cors_1.default)({
        origin: true, // SOLO se debe usar durante el desarrollo
        credentials: true,
    }));
}
else if (allowedOrigins.length === 0) {
    console.log(`Aceptando solicitudes desde ${CLIENT_HOST}`);
    app.use((0, cors_1.default)({
        origin: CLIENT_HOST,
        credentials: true,
    }));
}
else {
    // Usando CORS con orígenes multiples
    console.log("Aceptando solicitudes desde", allowedOrigins);
    app.use((0, cors_1.default)({
        origin: (origin, callback) => {
            if (!origin)
                return callback(null, true); // allow non-browser requests
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(new Error("CORS no permitido"));
            }
        },
        credentials: true,
    }));
}
app.use(express_1.default.json());
app.use(passport_1.default.initialize());
app.get("/api/auth/google", passport_1.default.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
}));
app.get("/api/auth/google/callback", passport_1.default.authenticate("google", {
    failureRedirect: "/login",
    session: false,
}), (req, res) => {
    const { token } = req.user;
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 1000 * 60 * 60 * 24,
    });
    res.redirect(`${process.env.CLIENT_HOST}/login` || "http://localhost:5173/login");
});
app.use("/api", routes_1.default);
(0, swagger_1.setupSwagger)(app);
// Ruta raíz que sirve la página de bienvenida desde un archivo externo
app.get("/", (_req, res) => {
    const filePath = node_path_1.default.join(__dirname, "../public/index.html");
    node_fs_1.default.readFile(filePath, "utf-8", (err, data) => {
        if (err) {
            res.status(500).send("Error al cargar la página de bienvenida");
        }
        else {
            res.send(data);
        }
    });
});
if (shouldInitDB) {
    (0, initDatabase_1.initDatabase)()
        .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 SYSGD corriendo en http://localhost:${PORT}`);
        });
    })
        .catch((error) => {
        console.error("Error al inicializar la base de datos:", error);
        process.exit(1);
    });
}
else {
    app.listen(PORT, () => {
        console.log(`🚀 SYSGD corriendo en http://localhost:${PORT}`);
    });
}
