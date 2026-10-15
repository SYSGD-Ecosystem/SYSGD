<?php

namespace App\Controllers;

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../vendor/autoload.php';

use Database;
use App\Middleware\AuthMiddleware;
use App\Services\LedgerEncryptionService;

class ContWorkspacesController
{
    private AuthMiddleware $auth;

    public function __construct()
    {
        $this->auth = new AuthMiddleware();
    }

    public function list(): void
    {
        $user = $this->auth->requireAuth();
        $userId = $user['id'];

        try {
            $stmt = Database::getInstance()->prepare(
                "SELECT w.id, w.name, w.owner_id, w.conversation_id, w.created_at, w.updated_at,
                    CASE WHEN w.owner_id = :user_id THEN 'owner' ELSE COALESCE(ra.role, 'viewer') END AS role
                 FROM cont_workspaces w
                 LEFT JOIN resource_access ra
                    ON ra.resource_type = 'workspace'
                    AND ra.resource_id = w.id
                    AND ra.user_id = :user_id
                 WHERE w.owner_id = :user_id OR ra.user_id = :user_id
                 ORDER BY w.updated_at DESC"
            );
            $stmt->execute(['user_id' => $userId]);
            $workspaces = $stmt->fetchAll();

            $result = array_map(function ($row) {
                return [
                    'id' => $row['id'],
                    'name' => $row['name'],
                    'ownerId' => $row['owner_id'],
                    'role' => $row['role'],
                    'conversationId' => $row['conversation_id'],
                    'createdAt' => $row['created_at'],
                    'updatedAt' => $row['updated_at'],
                ];
            }, $workspaces);

            echo json_encode($result);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public function create(): void
    {
        $user = $this->auth->requireAuth();
        $userId = $user['id'];
        $input = json_decode(file_get_contents('php://input'), true);

        $name = trim($input['name'] ?? '');
        if (empty($name)) {
            http_response_code(400);
            echo json_encode(['error' => 'El nombre del espacio es obligatorio']);
            return;
        }

        try {
            $stmt = Database::getInstance()->prepare(
                "SELECT COUNT(*) as count FROM cont_workspaces WHERE owner_id = :user_id"
            );
            $stmt->execute(['user_id' => $userId]);
            $count = (int) $stmt->fetch()['count'];

            if ($count >= 10) {
                http_response_code(403);
                echo json_encode(['error' => 'Alcanzaste el limite de 10 espacios de trabajo']);
                return;
            }

            $stmt = Database::getInstance()->prepare(
                "INSERT INTO cont_workspaces (owner_id, name)
                 VALUES (:user_id, :name)
                 RETURNING id, name, owner_id, conversation_id, created_at, updated_at"
            );
            $stmt->execute(['user_id' => $userId, 'name' => $name]);
            $workspace = $stmt->fetch();

            http_response_code(201);
            echo json_encode([
                'id' => $workspace['id'],
                'name' => $workspace['name'],
                'ownerId' => $workspace['owner_id'],
                'role' => 'owner',
                'conversationId' => $workspace['conversation_id'],
                'createdAt' => $workspace['created_at'],
                'updatedAt' => $workspace['updated_at'],
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public function get(string $id): void
    {
        $user = $this->auth->requireAuth();
        $userId = $user['id'];

        try {
            $stmt = Database::getInstance()->prepare(
                "SELECT w.id, w.name, w.owner_id, w.conversation_id, w.created_at, w.updated_at,
                    CASE WHEN w.owner_id = :user_id THEN 'owner' ELSE COALESCE(ra.role, 'viewer') END AS role
                 FROM cont_workspaces w
                 LEFT JOIN resource_access ra
                    ON ra.resource_type = 'workspace'
                    AND ra.resource_id = w.id
                    AND ra.user_id = :user_id
                 WHERE w.id = :id AND (w.owner_id = :user_id OR ra.user_id = :user_id)"
            );
            $stmt->execute(['id' => $id, 'user_id' => $userId]);
            $workspace = $stmt->fetch();

            if (!$workspace) {
                http_response_code(404);
                echo json_encode(['error' => 'Espacio no encontrado']);
                return;
            }

            echo json_encode([
                'id' => $workspace['id'],
                'name' => $workspace['name'],
                'ownerId' => $workspace['owner_id'],
                'role' => $workspace['role'],
                'conversationId' => $workspace['conversation_id'],
                'createdAt' => $workspace['created_at'],
                'updatedAt' => $workspace['updated_at'],
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public function rename(string $id): void
    {
        $user = $this->auth->requireAuth();
        $userId = $user['id'];
        $input = json_decode(file_get_contents('php://input'), true);

        $name = trim($input['name'] ?? '');
        if (empty($name)) {
            http_response_code(400);
            echo json_encode(['error' => 'El nombre es obligatorio']);
            return;
        }

        try {
            $workspace = $this->getWorkspaceForUser($id, $userId);
            if (!$workspace || !in_array($workspace['role'], ['owner', 'admin'])) {
                http_response_code(403);
                echo json_encode(['error' => 'Solo el dueno o un admin puede renombrar']);
                return;
            }

            Database::getInstance()->prepare(
                "UPDATE cont_workspaces SET name = :name, updated_at = NOW() WHERE id = :id"
            )->execute(['id' => $id, 'name' => $name]);

            echo json_encode(['message' => 'Espacio actualizado']);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public function delete(string $id): void
    {
        $user = $this->auth->requireAuth();
        $userId = $user['id'];

        try {
            $workspace = $this->getWorkspaceForUser($id, $userId);
            $isGlobalAdmin = ($user['privileges'] ?? '') === 'admin';

            if (!$workspace || ($workspace['role'] !== 'owner' && !$isGlobalAdmin)) {
                http_response_code(403);
                echo json_encode(['error' => 'Solo el dueno puede eliminar el espacio']);
                return;
            }

            $pdo = Database::getInstance();
            $pdo->beginTransaction();

            $pdo->prepare("DELETE FROM invitations WHERE resource_type = 'workspace' AND resource_id = :id")
                ->execute(['id' => $id]);
            $pdo->prepare("DELETE FROM resource_access WHERE resource_type = 'workspace' AND resource_id = :id")
                ->execute(['id' => $id]);
            $pdo->prepare("DELETE FROM cont_workspaces WHERE id = :id")
                ->execute(['id' => $id]);

            $pdo->commit();
            echo json_encode(['message' => 'Espacio eliminado']);
        } catch (\Exception $e) {
            if (Database::getInstance()->inTransaction()) {
                Database::getInstance()->rollBack();
            }
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public function getLedger(string $id): void
    {
        $user = $this->auth->requireAuth();

        try {
            $stmt = Database::getInstance()->prepare(
                "SELECT registro, sections, updated_at FROM cont_workspaces WHERE id = :id"
            );
            $stmt->execute(['id' => $id]);
            $row = $stmt->fetch();

            if (!$row) {
                http_response_code(404);
                echo json_encode(['error' => 'Espacio no encontrado']);
                return;
            }

            $registro = $row['registro'];
            if (is_string($registro)) {
                $registro = json_decode($registro, true);
            }

            if (LedgerEncryptionService::isEncryptedData($registro)) {
                try {
                    $registro = LedgerEncryptionService::decryptLedger($registro);
                } catch (\Exception $e) {
                    $registro = null;
                }
            }

            echo json_encode([
                'registro' => $registro,
                'sections' => $row['sections'] ?? new \stdClass(),
                'version' => $row['updated_at'],
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public function saveLedger(string $id): void
    {
        $user = $this->auth->requireAuth();
        $userId = $user['id'];
        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['registro'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta el campo registro']);
            return;
        }

        try {
            $workspace = $this->getWorkspaceForUser($id, $userId);
            if (!$workspace || !in_array($workspace['role'], ['owner', 'admin'])) {
                http_response_code(403);
                echo json_encode(['error' => 'Solo el dueno o un admin pueden actualizar el ledger']);
                return;
            }

            $expectedVersion = $input['expectedVersion'] ?? null;
            $sections = $input['sections'] ?? null;

            $pdo = Database::getInstance();
            $pdo->beginTransaction();

            $stmt = $pdo->prepare("SELECT updated_at FROM cont_workspaces WHERE id = :id FOR UPDATE");
            $stmt->execute(['id' => $id]);
            $current = $stmt->fetch();

            if (!$current) {
                $pdo->rollBack();
                http_response_code(404);
                echo json_encode(['error' => 'Espacio no encontrado']);
                return;
            }

            $serverVersion = $current['updated_at'];
            if ($expectedVersion && strtotime($serverVersion) !== strtotime($expectedVersion)) {
                $pdo->rollBack();
                http_response_code(409);
                echo json_encode(['error' => 'version_conflict', 'serverVersion' => $serverVersion]);
                return;
            }

            $encrypted = LedgerEncryptionService::encryptLedger($input['registro']);

            $stmt = $pdo->prepare(
                "UPDATE cont_workspaces
                 SET registro = :registro::jsonb, sections = :sections::jsonb, updated_at = NOW()
                 WHERE id = :id
                 RETURNING updated_at"
            );
            $stmt->execute([
                'id' => $id,
                'registro' => json_encode($encrypted),
                'sections' => json_encode($sections ?? new \stdClass()),
            ]);
            $updated = $stmt->fetch();

            $pdo->commit();
            echo json_encode(['version' => $updated['updated_at']]);
        } catch (\Exception $e) {
            if (Database::getInstance()->inTransaction()) {
                Database::getInstance()->rollBack();
            }
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public function listMembers(string $id): void
    {
        $this->auth->requireAuth();

        try {
            $stmt = Database::getInstance()->prepare(
                "WITH active_members AS (
                    SELECT w.owner_id AS user_id, 'owner' AS role
                    FROM cont_workspaces w WHERE w.id = :id
                    UNION
                    SELECT ra.user_id, COALESCE(ra.role, 'member') AS role
                    FROM resource_access ra
                    WHERE ra.resource_type = 'workspace' AND ra.resource_id = :id
                )
                SELECT u.id, u.name, u.email, am.role, 'active' as status
                FROM active_members am
                JOIN users u ON am.user_id = u.id"
            );
            $stmt->execute(['id' => $id]);
            $members = $stmt->fetchAll();

            $stmt = Database::getInstance()->prepare(
                "SELECT i.id, i.receiver_email, i.role, i.created_at, us.name as sender_name
                 FROM invitations i
                 LEFT JOIN users us ON i.sender_id = us.id
                 WHERE i.resource_type = 'workspace' AND i.resource_id = :id AND i.status = 'pending'"
            );
            $stmt->execute(['id' => $id]);
            $pending = $stmt->fetchAll();

            $result = array_merge(
                array_map(function ($m) {
                    return [
                        'id' => $m['id'],
                        'name' => $m['name'],
                        'email' => $m['email'],
                        'role' => $m['role'],
                        'status' => $m['status'],
                    ];
                }, $members),
                array_map(function ($p) {
                    return [
                        'id' => $p['id'],
                        'receiverEmail' => $p['receiver_email'],
                        'name' => $p['receiver_email'],
                        'email' => $p['receiver_email'],
                        'role' => $p['role'],
                        'status' => 'invited',
                        'senderName' => $p['sender_name'],
                        'createdAt' => $p['created_at'],
                    ];
                }, $pending)
            );

            echo json_encode($result);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public function inviteMember(string $id): void
    {
        $user = $this->auth->requireAuth();
        $userId = $user['id'];
        $input = json_decode(file_get_contents('php://input'), true);

        $email = trim(strtolower($input['email'] ?? ''));
        if (empty($email) || !str_contains($email, '@')) {
            http_response_code(400);
            echo json_encode(['error' => 'Email invalido']);
            return;
        }

        try {
            $workspace = $this->getWorkspaceForUser($id, $userId);
            if (!$workspace || !in_array($workspace['role'], ['owner', 'admin'])) {
                http_response_code(403);
                echo json_encode(['error' => 'Solo el dueno o un admin puede invitar miembros']);
                return;
            }

            $role = $input['role'] ?? 'member';
            $validRoles = ['admin', 'member', 'viewer', 'vendedor'];
            if (!in_array($role, $validRoles)) {
                $role = 'member';
            }

            $stmt = Database::getInstance()->prepare("SELECT id FROM users WHERE email = :email");
            $stmt->execute(['email' => $email]);
            $existingUser = $stmt->fetch();

            if ($existingUser) {
                $receiverId = $existingUser['id'];
            } else {
                $defaultData = json_encode(['billing' => ['ai_task_credits' => 0, 'pdf_credits' => 0, 'storage_credits' => 0, 'plan' => 'free'], 'settings' => []]);
                $stmt = Database::getInstance()->prepare(
                    "INSERT INTO users (email, status, privileges, user_data)
                     VALUES (:email, 'invited', 'user', :user_data::jsonb)
                     RETURNING id"
                );
                $stmt->execute(['email' => $email, 'user_data' => $defaultData]);
                $receiverId = $stmt->fetch()['id'];
            }

            Database::getInstance()->prepare(
                "INSERT INTO invitations (sender_id, receiver_id, receiver_email, resource_type, resource_id, role)
                 VALUES (:sender_id, :receiver_id, :email, 'workspace', :id, :role)"
            )->execute([
                'sender_id' => $userId,
                'receiver_id' => $receiverId,
                'email' => $email,
                'id' => $id,
                'role' => $role,
            ]);

            http_response_code(201);
            echo json_encode(['message' => 'Invitacion creada']);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al invitar al usuario']);
        }
    }

    public function updateMemberRole(string $id, string $memberUserId): void
    {
        $user = $this->auth->requireAuth();
        $userId = $user['id'];
        $input = json_decode(file_get_contents('php://input'), true);

        $role = trim(strtolower($input['role'] ?? ''));
        if (empty($role)) {
            http_response_code(400);
            echo json_encode(['error' => 'El rol es obligatorio']);
            return;
        }

        try {
            $workspace = $this->getWorkspaceForUser($id, $userId);
            if (!$workspace || !in_array($workspace['role'], ['owner', 'admin'])) {
                http_response_code(403);
                echo json_encode(['error' => 'Solo el dueno o un admin puede cambiar roles']);
                return;
            }

            $validRoles = ['admin', 'member', 'viewer', 'vendedor'];
            if (!in_array($role, $validRoles)) {
                http_response_code(400);
                echo json_encode(['error' => 'Rol invalido: ' . $role]);
                return;
            }

            $stmt = Database::getInstance()->prepare(
                "UPDATE resource_access SET role = :role
                 WHERE resource_type = 'workspace' AND resource_id = :id AND user_id = :user_id"
            );
            $stmt->execute(['id' => $id, 'user_id' => $memberUserId, 'role' => $role]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(['message' => 'Rol actualizado']);
                return;
            }

            $stmt = Database::getInstance()->prepare(
                "UPDATE invitations SET role = :role
                 WHERE resource_type = 'workspace' AND resource_id = :id
                 AND receiver_id = :user_id AND status = 'pending'"
            );
            $stmt->execute(['id' => $id, 'user_id' => $memberUserId, 'role' => $role]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(['message' => 'Rol actualizado']);
                return;
            }

            http_response_code(404);
            echo json_encode(['error' => 'El usuario no es miembro de este espacio']);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public function removeMember(string $id, string $memberUserId): void
    {
        $user = $this->auth->requireAuth();
        $userId = $user['id'];

        try {
            $workspace = $this->getWorkspaceForUser($id, $userId);
            if (!$workspace || $workspace['role'] !== 'owner') {
                http_response_code(403);
                echo json_encode(['error' => 'Solo el dueno puede quitar miembros']);
                return;
            }

            if ($memberUserId === $workspace['ownerId']) {
                http_response_code(400);
                echo json_encode(['error' => 'El dueno no puede ser removido']);
                return;
            }

            Database::getInstance()->prepare(
                "DELETE FROM resource_access
                 WHERE resource_type = 'workspace' AND resource_id = :id AND user_id = :user_id"
            )->execute(['id' => $id, 'user_id' => $memberUserId]);

            echo json_encode(['message' => 'Miembro removido']);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public function listVendedorLinks(string $id): void
    {
        $this->auth->requireAuth();

        try {
            $stmt = Database::getInstance()->prepare(
                "SELECT l.vendedor_id, l.member_user_id, u.email, u.name, l.almacen_id,
                        COALESCE(ra.role, 'vendedor') AS role, l.created_at
                 FROM cont_workspace_vendedor_links l
                 JOIN users u ON u.id = l.member_user_id
                 LEFT JOIN resource_access ra
                    ON ra.resource_type = 'workspace' AND ra.resource_id = l.workspace_id
                    AND ra.user_id = l.member_user_id
                 WHERE l.workspace_id = :id
                 ORDER BY u.name"
            );
            $stmt->execute(['id' => $id]);
            $links = $stmt->fetchAll();

            $result = array_map(function ($row) {
                return [
                    'vendedorId' => $row['vendedor_id'],
                    'memberUserId' => $row['member_user_id'],
                    'memberEmail' => $row['email'],
                    'memberName' => $row['name'],
                    'almacenId' => $row['almacen_id'],
                    'role' => $row['role'],
                    'createdAt' => $row['created_at'],
                ];
            }, $links);

            echo json_encode($result);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public function linkVendedor(string $id, string $vendedorId): void
    {
        $user = $this->auth->requireAuth();
        $userId = $user['id'];
        $input = json_decode(file_get_contents('php://input'), true);

        $memberUserId = trim($input['memberUserId'] ?? '');
        if (empty($memberUserId)) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta memberUserId']);
            return;
        }

        $almacenId = !empty($input['almacenId']) ? trim($input['almacenId']) : null;

        try {
            $workspace = $this->getWorkspaceForUser($id, $userId);
            if (!$workspace || !in_array($workspace['role'], ['owner', 'admin'])) {
                http_response_code(403);
                echo json_encode(['error' => 'Solo el dueno o un admin puede vincular vendedores']);
                return;
            }

            if (!$this->isMemberOfWorkspace($id, $memberUserId)) {
                http_response_code(404);
                echo json_encode(['error' => 'El miembro no pertenece a este espacio']);
                return;
            }

            $pdo = Database::getInstance();
            $pdo->beginTransaction();

            $pdo->prepare(
                "DELETE FROM cont_workspace_vendedor_links
                 WHERE workspace_id = :id AND member_user_id = :member_id AND vendedor_id != :vendedor_id"
            )->execute(['id' => $id, 'member_id' => $memberUserId, 'vendedor_id' => $vendedorId]);

            $pdo->prepare(
                "INSERT INTO cont_workspace_vendedor_links (workspace_id, vendedor_id, member_user_id, almacen_id)
                 VALUES (:id, :vendedor_id, :member_id, :almacen_id)
                 ON CONFLICT (workspace_id, vendedor_id)
                 DO UPDATE SET member_user_id = EXCLUDED.member_user_id,
                               almacen_id = COALESCE(EXCLUDED.almacen_id, cont_workspace_vendedor_links.almacen_id)"
            )->execute([
                'id' => $id,
                'vendedor_id' => $vendedorId,
                'member_id' => $memberUserId,
                'almacen_id' => $almacenId,
            ]);

            $pdo->prepare(
                "UPDATE resource_access SET role = 'vendedor'
                 WHERE resource_type = 'workspace' AND resource_id = :id AND user_id = :member_id"
            )->execute(['id' => $id, 'member_id' => $memberUserId]);

            $pdo->prepare(
                "UPDATE invitations SET role = 'vendedor'
                 WHERE resource_type = 'workspace' AND resource_id = :id
                 AND receiver_id = :member_id AND status = 'pending'"
            )->execute(['id' => $id, 'member_id' => $memberUserId]);

            $pdo->commit();
            echo json_encode(['message' => 'Vendedor vinculado al miembro']);
        } catch (\Exception $e) {
            if (Database::getInstance()->inTransaction()) {
                Database::getInstance()->rollBack();
            }
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    public function unlinkVendedor(string $id, string $vendedorId): void
    {
        $user = $this->auth->requireAuth();
        $userId = $user['id'];

        try {
            $workspace = $this->getWorkspaceForUser($id, $userId);
            if (!$workspace || !in_array($workspace['role'], ['owner', 'admin'])) {
                http_response_code(403);
                echo json_encode(['error' => 'Solo el dueno o un admin puede desvincular vendedores']);
                return;
            }

            Database::getInstance()->prepare(
                "DELETE FROM cont_workspace_vendedor_links
                 WHERE workspace_id = :id AND vendedor_id = :vendedor_id"
            )->execute(['id' => $id, 'vendedor_id' => $vendedorId]);

            echo json_encode(['message' => 'Vendedor desvinculado']);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor']);
        }
    }

    private function getWorkspaceForUser(string $workspaceId, string $userId): ?array
    {
        $stmt = Database::getInstance()->prepare(
            "SELECT w.id, w.name, w.owner_id, w.conversation_id, w.created_at, w.updated_at,
                CASE WHEN w.owner_id = :user_id THEN 'owner' ELSE COALESCE(ra.role, 'viewer') END AS role
             FROM cont_workspaces w
             LEFT JOIN resource_access ra
                ON ra.resource_type = 'workspace'
                AND ra.resource_id = w.id
                AND ra.user_id = :user_id
             WHERE w.id = :id AND (w.owner_id = :user_id OR ra.user_id = :user_id)"
        );
        $stmt->execute(['id' => $workspaceId, 'user_id' => $userId]);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    private function isMemberOfWorkspace(string $workspaceId, string $userId): bool
    {
        $stmt = Database::getInstance()->prepare(
            "SELECT 1 FROM cont_workspaces WHERE id = :id AND owner_id = :user_id
             UNION
             SELECT 1 FROM resource_access
             WHERE resource_type = 'workspace' AND resource_id = :id AND user_id = :user_id
             UNION
             SELECT 1 FROM invitations
             WHERE resource_type = 'workspace' AND resource_id = :id
             AND receiver_id = :user_id AND status = 'pending'"
        );
        $stmt->execute(['id' => $workspaceId, 'user_id' => $userId]);
        return $stmt->fetch() !== false;
    }
}
