import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { Pool } from "pg";
import { initDatabase } from "./initDatabase";
import classificationRoutes from './routes/api';
import session from "express-session";


dotenv.config();


const app = express();
const PORT = process.env.PORT || 3000;


export const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
});


app.use(
  cors({
    origin: "http://localhost:5173", // o el dominio de tu frontend
    credentials: true, // 🔥 permite el uso de cookies
  })
);


app.use(
  session({
    secret: "TESTSESSION", // Cámbialo a algo más largo y aleatorio
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // true en producción con HTTPS
      maxAge: 1000 * 60 * 60 * 24, // 1 día
      sameSite: "lax", // o "none" si el front está en otro dominio
    },
  })
);

app.use(express.json());
app.use("/api", classificationRoutes);

// Ruta raíz que sirve la página de bienvenida desde un archivo externo
app.get('/', (_req, res) => {
  const filePath = path.join(__dirname, '../public/index.html');
  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      res.status(500).send('Error al cargar la página de bienvenida');
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






