import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { initDatabase } from "./initDatabase";
import routes from "./routes";
import session from "express-session";
import passport from "passport";
import "./passport";
import { setupSwagger } from "./swagger";
import cookieParser from "cookie-parser";


dotenv.config();

const app = express();

app.use(cookieParser());


const PORT = process.env.PORT || 3000;
const CLIENT_HOST = process.env.CLIENT_HOST;
const SECRET_SESSION = process.env.SECRET_SESSION || "SECRETDEFAULT";
const shouldInitDB = process.env.INIT_DB_ON_START === "true";
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

if (allowedOrigins.length === 0) {
	app.use(
		cors({
			origin: CLIENT_HOST,
			credentials: true,
		}),
	);
} else {
	// Usando CORS con orígenes multiples
	app.use(
		cors({
			origin: (origin, callback) => {
				if (!origin) return callback(null, true); // allow non-browser requests
				if (allowedOrigins.includes(origin)) {
					callback(null, true);
				} else {
					callback(new Error("CORS no permitido"));
				}
			},
			credentials: true,
		}),
	);
}

if (
	CLIENT_HOST === "http://127.0.0.1:5173" ||
	CLIENT_HOST === "http://localhost:5173"
) {
	app.use(
		session({
			secret: SECRET_SESSION,
			resave: false,
			saveUninitialized: false,
			cookie: {
				secure: false,
				maxAge: 1000 * 60 * 60 * 24,
				sameSite: "lax",
				httpOnly: true,
			},
		}),
	);
} else {
	console.log("Recibiendo en producción...");
	app.set("trust proxy", 1);
	app.use(
		session({
			secret: SECRET_SESSION,
			resave: false,
			saveUninitialized: false,
			cookie: {
				secure: true,
				sameSite: "none",
				maxAge: 1000 * 60 * 60 * 24,
				httpOnly: true,
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
		res.status(401).json({ error: "No autenticado con google" });
	}
});

app.use("/api", routes);

setupSwagger(app);

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

if (shouldInitDB) {
	initDatabase()
		.then(() => {
			app.listen(PORT, () => {
				console.log(`🚀 SYSGD corriendo en http://localhost:${PORT}`);
			});
		})
		.catch((error) => {
			console.error("Error al inicializar la base de datos:", error);
			process.exit(1);
		});
} else {
	app.listen(PORT, () => {
		console.log(`🚀 SYSGD corriendo en http://localhost:${PORT}`);
	});
}
