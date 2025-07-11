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

	await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      status TEXT DEFAULT 'activo',
      visibility TEXT DEFAULT 'privado'
    );
  `);

  await pool.query(`
  CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT NOW(),
    type TEXT,
    priority TEXT,
    title TEXT,
    description TEXT,
    created_by INTEGER REFERENCES users(id),
    status TEXT DEFAULT 'active',
    project_id UUID REFERENCES projects(id),
    project_task_number INTEGER NOT NULL,
    UNIQUE (project_id, project_task_number)
  );
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS task_assignees (
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    PRIMARY KEY (task_id, user_id)
  );
`);


await pool.query(`
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  resource_type TEXT CHECK (resource_type IN ('project', 'archive')),
  resource_id UUID NOT NULL,
  role TEXT DEFAULT 'viewer',
  status TEXT DEFAULT 'pending',
  receiver_email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
`);

await pool.query(`
CREATE TABLE IF NOT EXISTS resource_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  resource_type TEXT CHECK (resource_type IN ('project', 'archive')),
  resource_id UUID NOT NULL,
  role TEXT DEFAULT 'viewer',
  UNIQUE(user_id, resource_type, resource_id)
);
`);

	console.log("✅ Tablas verificadas o creadas correctamente.");
}
