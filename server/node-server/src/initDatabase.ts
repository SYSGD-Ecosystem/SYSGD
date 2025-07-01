import { pool } from "./index";

export async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT,
      username TEXT,
      password TEXT,
      privileges TEXT DEFAULT 'user' -- o 'admin'
    );
  `);


await pool.query(`
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";

  CREATE TABLE IF NOT EXISTS document_management_file (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES users(id),
    code TEXT NOT NULL,                         -- Código funcional visible para el usuario
    company TEXT NOT NULL,                      -- Nombre de la Empresa
    name TEXT NOT NULL,                         -- Nombre del expediente


    classification_chart JSONB DEFAULT '[]',    -- Cuadro de clasificación documental
    retention_schedule JSONB DEFAULT '[]',      -- Tabla de retención documental
    entry_register JSONB DEFAULT '[]',          -- Registro de entrada
    exit_register JSONB DEFAULT '[]',           -- Registro de salida
    loan_register JSONB DEFAULT '[]',           -- Registro de préstamos
    transfer_list JSONB DEFAULT '[]',           -- Relación de entrega de transferencias documentales
    topographic_register JSONB DEFAULT '[]',    -- Registro topográfico
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);


  console.log("✅ Tablas verificadas o creadas correctamente.");
}

