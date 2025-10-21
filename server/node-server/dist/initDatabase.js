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
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = initDatabase;
const db_1 = require("./db");
function initDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        yield db_1.pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT,
      username TEXT,
      password TEXT,
      privileges TEXT DEFAULT 'user',
      is_public BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
        yield db_1.pool.query(`
    CREATE TABLE IF NOT EXISTS users_logins (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      login_time TIMESTAMP DEFAULT NOW(),
      ip_address TEXT,
      user_agent TEXT
    );
  `);
        yield db_1.pool.query(`
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
        yield db_1.pool.query(`
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
        yield db_1.pool.query(`
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
        yield db_1.pool.query(`
  CREATE TABLE IF NOT EXISTS task_assignees (
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    PRIMARY KEY (task_id, user_id)
  );
`);
        yield db_1.pool.query(`
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
        yield db_1.pool.query(`
CREATE TABLE IF NOT EXISTS resource_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  resource_type TEXT CHECK (resource_type IN ('project', 'archive')),
  resource_id UUID NOT NULL,
  role TEXT DEFAULT 'viewer',
  UNIQUE(user_id, resource_type, resource_id)
);
`);
        yield db_1.pool.query(`
  CREATE TABLE IF NOT EXISTS ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    implementability TEXT DEFAULT 'medium',
    impact TEXT DEFAULT 'medium',
    votes INTEGER DEFAULT 0,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    idea_number INTEGER NOT NULL,
    UNIQUE(project_id, idea_number)
  );
`);
        yield db_1.pool.query(`
  CREATE TABLE IF NOT EXISTS idea_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    value INTEGER CHECK (value IN (1, -1)),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(idea_id, user_id)
  );
`);
        yield db_1.pool.query(`
  CREATE TABLE IF NOT EXISTS project_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );
`);
        yield db_1.pool.query(`
  CREATE INDEX IF NOT EXISTS idx_project_notes_project_user
  ON project_notes(project_id, user_id);
`);
        // ==============================
        // Chat module
        // ==============================
        yield db_1.pool.query(`
  CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    type TEXT CHECK (type IN ('user', 'agent')) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );
`);
        yield db_1.pool.query(`
  CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    attachment_type TEXT CHECK (attachment_type IN ('image','audio','video','file')),
    attachment_url TEXT,
    reply_to UUID REFERENCES messages(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );
`);
        yield db_1.pool.query(`
  CREATE TABLE IF NOT EXISTS conversation_read_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    last_read_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    unread_count INTEGER DEFAULT 0,
    UNIQUE(conversation_id, user_id)
  );
`);
        // Índices opcionales para optimización de consultas
        yield db_1.pool.query(`
  CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
`);
        yield db_1.pool.query(`
  CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
`);
        yield db_1.pool.query(`
  CREATE INDEX IF NOT EXISTS idx_read_status_user ON conversation_read_status(user_id, conversation_id);
`);
        console.log("✅ Tablas verificadas o creadas correctamente.");
    });
}
