-- Tickets de soporte: el admin abre un ticket con un usuario y el sistema
-- envia el correo desde el dominio de la plataforma (Resend).
--
-- Se crea tambien en initDatabase.ts (INIT_DB_ON_START=true). Este script es
-- para despliegues manuales.
--
-- user_id se asocia solo si el destinatario existe en users; cualquier otro
-- correo queda registrado igualmente (user_id NULL).

CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    email_status TEXT NOT NULL DEFAULT 'pending' CHECK (email_status IN ('pending', 'sent', 'failed')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_recipient_email ON support_tickets(recipient_email);
