<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

$host = $_ENV['DB_HOST'] ?? 'localhost';
$port = $_ENV['DB_PORT'] ?? '5432';
$dbname = $_ENV['DB_NAME'] ?? 'sysgd';
$user = $_ENV['DB_USER'] ?? 'postgres';
$password = $_ENV['DB_PASSWORD'] ?? '';

$dsn = "pgsql:host={$host};port={$port};dbname={$dbname}";

try {
    $pdo = new PDO($dsn, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $pdo->exec("CREATE EXTENSION IF NOT EXISTS pgcrypto");

    $tables = [
        "CREATE TABLE IF NOT EXISTS cont_workspaces (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            owner_id UUID NOT NULL,
            name VARCHAR(255) NOT NULL,
            registro JSONB,
            sections JSONB DEFAULT '{}',
            conversation_id UUID,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )",

        "CREATE TABLE IF NOT EXISTS cont_workspace_vendedor_links (
            workspace_id UUID NOT NULL,
            vendedor_id VARCHAR(255) NOT NULL,
            member_user_id UUID,
            almacen_id VARCHAR(255),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (workspace_id, vendedor_id)
        )",

        "CREATE TABLE IF NOT EXISTS cont_informe_disponibilidad (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            workspace_id UUID NOT NULL UNIQUE,
            informe_id UUID NOT NULL,
            informe JSONB NOT NULL,
            huella VARCHAR(255),
            generado_en TIMESTAMPTZ,
            subido_por UUID,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )",

        "CREATE TABLE IF NOT EXISTS cont_reportes_turno (
            id UUID NOT NULL,
            workspace_id UUID NOT NULL,
            informe_origen_id UUID,
            informe_origen_generado_en TIMESTAMPTZ,
            vendedor_id VARCHAR(255) NOT NULL,
            vendedor_nombre VARCHAR(255),
            turno_id UUID,
            fecha_turno DATE,
            generado_en TIMESTAMPTZ,
            estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
            estado_nota TEXT,
            paquete JSONB,
            subido_por UUID,
            resuelto_por UUID,
            resuelto_en TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (workspace_id, id)
        )",

        "CREATE TABLE IF NOT EXISTS accounting_documents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            name VARCHAR(255) NOT NULL,
            document_type VARCHAR(100) NOT NULL DEFAULT 'tcp_income_expense',
            payload JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )",

        "CREATE TABLE IF NOT EXISTS gctcp_spaces (
            user_id UUID NOT NULL,
            space_id VARCHAR(255) NOT NULL,
            data JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (user_id, space_id)
        )",

        "CREATE TABLE IF NOT EXISTS invitations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            sender_id UUID,
            receiver_id UUID,
            receiver_email VARCHAR(255) NOT NULL,
            resource_type VARCHAR(50) NOT NULL,
            resource_id UUID NOT NULL,
            role VARCHAR(50) DEFAULT 'member',
            status VARCHAR(50) DEFAULT 'pending',
            token VARCHAR(255) UNIQUE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )",

        "CREATE TABLE IF NOT EXISTS resource_access (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            resource_type VARCHAR(50) NOT NULL,
            resource_id UUID NOT NULL,
            role VARCHAR(50) DEFAULT 'member',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id, resource_type, resource_id)
        )",
    ];

    foreach ($tables as $sql) {
        $pdo->exec($sql);
    }

    $indexes = [
        "CREATE INDEX IF NOT EXISTS idx_cont_workspaces_owner ON cont_workspaces(owner_id)",
        "CREATE INDEX IF NOT EXISTS idx_cont_workspaces_updated ON cont_workspaces(updated_at DESC)",
        "CREATE INDEX IF NOT EXISTS idx_cont_reportes_turno_ws ON cont_reportes_turno(workspace_id)",
        "CREATE INDEX IF NOT EXISTS idx_cont_reportes_turno_estado ON cont_reportes_turno(workspace_id, estado)",
        "CREATE INDEX IF NOT EXISTS idx_accounting_documents_user ON accounting_documents(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_gctcp_spaces_user ON gctcp_spaces(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_invitations_resource ON invitations(resource_type, resource_id)",
        "CREATE INDEX IF NOT EXISTS idx_invitations_receiver ON invitations(receiver_id, status)",
        "CREATE INDEX IF NOT EXISTS idx_resource_access_user ON resource_access(user_id)",
    ];

    foreach ($indexes as $sql) {
        $pdo->exec($sql);
    }

    echo "Migracion completada.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
