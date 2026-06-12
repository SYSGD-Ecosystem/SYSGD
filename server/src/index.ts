import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { createServer } from "http";
import { initDatabase } from "./initDatabase";
import routes from "./routes";
import passport from "passport";
import "./passport";
import { setupSwagger } from "./swagger";
import cookieParser from "cookie-parser";
import dotenv from 'dotenv';
import { initSocketIO } from "./socket";

dotenv.config();

const app = express();
const httpServer = createServer(app);

app.use(cookieParser());

const PORT = process.env.PORT || 3000;
const CLIENT_HOST = process.env.CLIENT_HOST;
const shouldInitDB = process.env.INIT_DB_ON_START === "true";
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
const isAcceptAllOrigins = process.env.ACCEPT_ALL_ORIGINS === "true";

if (isAcceptAllOrigins) {
	console.warn("Aceptando todos los origenes");
	app.use(
		cors({
			origin: true, // SOLO se debe usar durante el desarrollo
			credentials: true,
		}),
	);
} else if (allowedOrigins.length === 0) {
	console.log(`Aceptando solicitudes desde ${CLIENT_HOST}`);
	app.use(
		cors({
			origin: CLIENT_HOST,
			credentials: true,
		}),
	);
} else {
	// Usando CORS con orígenes multiples
	console.log("Aceptando solicitudes desde", allowedOrigins);
	app.use(
		cors({
			origin: (origin, callback) => {

				if (!origin){
					 return callback(null, true);
				 } // allow non-browser requests


				if (allowedOrigins.includes(origin)) {
					callback(null, true);
				} else {
					console.warn(`Bloqueando solicitud CORS desde origen no permitido: ${origin}`);
					callback(new Error("CORS no permitido"));
				}
			},
			credentials: true,
		}),
	);
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(passport.initialize());

app.get(
	"/api/auth/google",
	passport.authenticate("google", {
		scope: ["profile", "email"],
		session: false,
	}),
);

app.get(
	"/api/auth/google/callback",
	passport.authenticate("google", {
		failureRedirect: "/login",
		session: false,
	}),
	(req, res) => {
		const { token } = req.user as { token: string };

		res.cookie("token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
			partitioned: true,
			maxAge: 1000 * 60 * 60 * 24,
		});

		// console.log("Redirigiendo a cliente con token:", token);

		res.redirect(
			`${process.env.CLIENT_HOST}/login?token=${token}` || `http://localhost:5173/login?token=${token}`,
		);
	},
);

app.use("/api", routes);

setupSwagger(app);

// Ruta raíz que sirve la página de bienvenida desde un archivo externo
app.get("/", (_req, res) => {

	// redirigir hacia el cliente
	res.redirect(process.env.CLIENT_HOST || "http://localhost:5173");

	// Si se desea servir un archivo HTML estático, descomentar lo siguiente:

	// const filePath = path.join(__dirname, "../public/index.html");
	// fs.readFile(filePath, "utf-8", (err, data) => {
	// 	if (err) {
	// 		res.status(500).send("Error al cargar la página de bienvenida");
	// 	} else {
	// 		res.send(data);
	// 	}
	// });
});

if (shouldInitDB) {
	initDatabase()
		.then(() => {
			initSocketIO(httpServer);
			httpServer.listen(PORT, () => {
				console.log(`🚀 SYSGD Ecosystem corriendo en http://localhost:${PORT}`);
			});
		})
		.catch((error) => {
			console.error("Error al inicializar la base de datos:", error);
			process.exit(1);
		});
} else {
	initSocketIO(httpServer);
	httpServer.listen(PORT, () => {
		console.log(`🚀 SYSGD corriendo en http://localhost:${PORT}`);
	});
}
