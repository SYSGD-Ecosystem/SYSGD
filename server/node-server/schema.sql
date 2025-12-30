-- Habilitar extensión para generar UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================
-- Users
-- ==============================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  password TEXT,
  privileges TEXT DEFAULT 'user',
  is_public BOOLEAN DEFAULT false,
  user_data JSONB,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email);

CREATE TABLE IF NOT EXISTS users_logins (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  login_time TIMESTAMP DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- ==============================
-- Document management
-- ==============================
CREATE TABLE IF NOT EXISTS document_management_file (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  code TEXT NOT NULL,
  company TEXT NOT NULL,
  name TEXT NOT NULL,
  classification_chart JSONB DEFAULT '[]',
  retention_schedule JSONB DEFAULT '[]',
  entry_register JSONB DEFAULT '[]',
  exit_register JSONB DEFAULT '[]',
  loan_register JSONB DEFAULT '[]',
  transfer_list JSONB DEFAULT '[]',
  topographic_register JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================
-- Projects
-- ==============================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'activo',
  visibility TEXT DEFAULT 'privado'
);

CREATE TABLE IF NOT EXISTS projects_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  task_config JSONB DEFAULT '{
    "types": [
      {"name": "Tarea", "color": "#3B82F6"},
      {"name": "Idea", "color": "#10B981"},
      {"name": "Nota", "color": "#6B7280"}
    ],
    "priorities": [
      {"name": "Alta", "level": 3, "color": "#EF4444"},
      {"name": "Media", "level": 2, "color": "#F59E0B"},
      {"name": "Baja", "level": 1, "color": "#10B981"}
    ],
    "states": [
      {"name": "Pendiente", "requires_context": false, "color": "#6B7280"},
      {"name": "En Progreso", "requires_context": false, "color": "#3B82F6"},
      {"name": "Requiere Video", "requires_context": true, "color": "#EF4444"},
      {"name": "Completado", "requires_context": false, "color": "#10B981"}
    ]
  }'
);

-- ==============================
-- Tasks
-- ==============================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  type TEXT,
  priority TEXT,
  title TEXT,
  description TEXT,
  created_by UUID REFERENCES users(id),
  status TEXT DEFAULT 'active',
  project_id UUID REFERENCES projects(id),
  project_task_number INTEGER NOT NULL,
  UNIQUE (project_id, project_task_number)
);

-- ==============================
-- User Tokens
-- ==============================
CREATE TABLE IF NOT EXISTS user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_type TEXT NOT NULL CHECK (token_type IN ('github', 'gemini', 'replicate')),
  encrypted_token BYTEA NOT NULL,
  iv BYTEA NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, token_type)
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tokens_type ON user_tokens(token_type);

CREATE TABLE IF NOT EXISTS task_assignees (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  PRIMARY KEY (task_id, user_id)
);

-- ==============================
-- Invitations
-- ==============================
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  resource_type TEXT CHECK (resource_type IN ('project', 'archive')),
  resource_id UUID NOT NULL,
  role TEXT DEFAULT 'viewer',
  status TEXT DEFAULT 'pending',
  receiver_email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resource_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  resource_type TEXT CHECK (resource_type IN ('project', 'archive')),
  resource_id UUID NOT NULL,
  role TEXT DEFAULT 'viewer',
  UNIQUE(user_id, resource_type, resource_id)
);

-- ==============================
-- Ideas
-- ==============================
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
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  idea_number INTEGER NOT NULL,
  UNIQUE(project_id, idea_number)
);

CREATE TABLE IF NOT EXISTS idea_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  value INTEGER CHECK (value IN (1, -1)),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(idea_id, user_id)
);

-- ==============================
-- Project notes
-- ==============================
CREATE TABLE IF NOT EXISTS project_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_notes_project_user
ON project_notes(project_id, user_id);

-- ==============================
-- Project Members View
-- ==============================
CREATE OR REPLACE VIEW project_member_counts AS
SELECT 
    ra.resource_id AS project_id,
    COUNT(DISTINCT ra.user_id) AS member_count
FROM 
    resource_access ra
WHERE 
    ra.resource_type = 'project'
    AND ra.role != 'pending'
GROUP BY 
    ra.resource_id;

-- ==============================
-- Chat module
-- ==============================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT CHECK (type IN ('private', 'group', 'channel', 'bot')) NOT NULL DEFAULT 'private',
  title TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'guest')),
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT,
  attachment_type TEXT CHECK (attachment_type IN ('image','audio','video','file')),
  attachment_url TEXT,
  reply_to UUID REFERENCES messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_reads (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  last_read_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  unread_count INTEGER DEFAULT 0,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS conversation_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==============================
-- Agents module
-- ==============================
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  support TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(conversation_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_reads_user_conversation ON message_reads(user_id, conversation_id);

-- ==============================
-- GitHub integration
-- ==============================
CREATE TABLE IF NOT EXISTS github_project_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  owner TEXT NOT NULL,
  repo TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id)
);

CREATE INDEX IF NOT EXISTS idx_github_project_config_project_id
ON github_project_config(project_id);

CREATE TABLE IF NOT EXISTS github_project_user_token (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_encrypted BYTEA,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_github_project_user_token_project_user
ON github_project_user_token(project_id, user_id);
