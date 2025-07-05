import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { Pool } from "pg";
import { initDatabase } from "./initDatabase";
import classificationRoutes from "./routes/api";
import session from "express-session";
import passport from "passport";
import "./passport";
import { setupSwagger } from "./swagger";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_HOST = process.env.CLIENT_HOST || "http://localhost:5173";
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

console.log("Allowed origins:", allowedOrigins);

export const pool = new Pool({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	port: Number(process.env.DB_PORT),
});

if (CLIENT_HOST === "http://localhost:5173" || allowedOrigins.length === 0) {
	app.use(
		cors({
			origin: CLIENT_HOST,
			credentials: true,
		}),
	);
} else {
	console.log("Usando CORS con orígenes permitidos:", allowedOrigins)
	app.use(
		cors({
			origin: allowedOrigins,
			credentials: true,
		}),
	);
}

if (CLIENT_HOST === "http://localhost:5173") {
	app.use(
		session({
			secret: "TESTSESSION", // Cámbialo a algo más largo y aleatorio
			resave: false,
			saveUninitialized: false,
			cookie: {
				secure: false, // true en producción con HTTPS
				maxAge: 1000 * 60 * 60 * 24,
				sameSite: "lax", // o "none" si el front está en otro dominio
			},
		}),
	);
} else if (allowedOrigins.length > 0) {
	app.use(
		session({
			secret: "TESTSESSION", // Cámbialo a algo más largo y aleatorio
			resave: false,
			saveUninitialized: false,
			cookie: {
				secure: true, // 🚨 REQUIERE HTTPS, y Railway lo tiene por default
				sameSite: "none", // Permite cookies en cross-origin
				maxAge: 1000 * 60 * 60 * 24,
				httpOnly: true, // Permite acceso desde el frontend
			},
		}),
	);
} else {
	app.use(
		session({
			secret: "TESTSESSION", // Cámbialo a algo más largo y aleatorio
			resave: false,
			saveUninitialized: false,
			cookie: {
				secure: true, // 🚨 REQUIERE HTTPS, y Railway lo tiene por default
				sameSite: "none", // Permite cookies en cross-origin
				maxAge: 1000 * 60 * 60 * 24,
				httpOnly: true, // Permite acceso desde el frontend
			},
		}),
	);
}

app.use(express.json());

app.use(passport.initialize());
app.use(passport.session());

app.get(
	"/api/auth/google",
	passport.authenticate("google", { scope: ["profile", "email"] }),
);

app.get(
	"/api/auth/google/callback",
	passport.authenticate("google", { failureRedirect: "/login" }),
	(req, res) => {
		console.log("Verificacion de que esta funcion se esta ejecutando");

		if (req.user && typeof req.user === "object") {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const { id, username, name, privileges } = req.user as any;
			req.session.user = { id, username, name, privileges };
			console.log("Usuario autenticado:", req.session.user);
		} else if (req.user) {
			req.session.user = {
				id: req.user,
				username: req.user,
				name: req.user,
				privileges: "user",
			};
			console.log("Usuario autenticado (string):", req.session.user);
		} else {
			console.log("Usuario no autenticado, asignando undefined");
			req.session.user = undefined;
		}

		res.redirect(process.env.CLIENT_HOST || "http://localhost:5173");
	},
);

// Ruta protegida de prueba
app.get("/api/profile", (req, res) => {
	if (req.isAuthenticated()) {
		res.json(req.user);
	} else {
		res.status(401).json({ error: "No autenticado" });
	}
});

setupSwagger(app);

app.use("/api", classificationRoutes);

// Ruta raíz que sirve la página de bienvenida desde un archivo externo
app.get("/", (_req, res) => {
	const filePath = path.join(__dirname, "../public/index.html");
	fs.readFile(filePath, "utf-8", (err, data) => {
		if (err) {
			res.status(500).send("Error al cargar la página de bienvenida");
		} else {
			res.send(data);
		}
	});
});

initDatabase().then(() => {
	app.listen(PORT, () => {
		console.log(`🚀 SYSGD corriendo en http://localhost:${PORT}`);
	});
});
