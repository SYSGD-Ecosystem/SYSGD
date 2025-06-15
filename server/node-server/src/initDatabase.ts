import { pool } from "./index";

export async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT,
      username TEXT,
      password TEXT,
      privileges TEXT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS classification_box (
      id SERIAL PRIMARY KEY,
      code TEXT,
      company TEXT,
      name TEXT,
      datos TEXT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS document_retention_table (
      id SERIAL PRIMARY KEY,
      code TEXT,
      data TEXT
    );
  `);

  console.log("✅ Tablas verificadas o creadas correctamente.");
}

