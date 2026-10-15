<?php

namespace App\Controllers;

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../vendor/autoload.php';

use Database;
use App\Middleware\AuthMiddleware;
use App\Services\LedgerEncryptionService;

class GctcpSpaceController
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
                "SELECT space_id, updated_at FROM gctcp_spaces WHERE user_id = :user_id"
            );
            $stmt->execute(['user_id' => $userId]);
            $rows = $stmt->fetchAll();

            $result = array_map(function ($row) {
                return ['space_id' => $row['space_id'], 'updated_at' => $row['updated_at']];
            }, $rows);

            echo json_encode($result);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error listando spaces']);
        }
    }

    public function get(string $spaceId): void
    {
        $user = $this->auth->requireAuth();
        $userId = $user['id'];

        try {
            $stmt = Database::getInstance()->prepare(
                "SELECT data, updated_at FROM gctcp_spaces WHERE space_id = :space_id AND user_id = :user_id"
            );
            $stmt->execute(['space_id' => $spaceId, 'user_id' => $userId]);
            $row = $stmt->fetch();

            if (!$row) {
                http_response_code(404);
                echo json_encode(['error' => 'Space no encontrado']);
                return;
            }

            $data = $row['data'];
            if (is_string($data)) {
                $data = json_decode($data, true);
            }
            if (LedgerEncryptionService::isEncryptedData($data)) {
                $data = LedgerEncryptionService::decryptLedger($data);
            }

            echo json_encode(['data' => $data, 'updatedAt' => $row['updated_at']]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error obteniendo space']);
        }
    }

    public function update(string $spaceId): void
    {
        $user = $this->auth->requireAuth();
        $userId = $user['id'];
        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['data'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta el campo data']);
            return;
        }

        try {
            $encrypted = LedgerEncryptionService::encryptLedger($input['data']);

            $stmt = Database::getInstance()->prepare(
                "UPDATE gctcp_spaces
                 SET data = :data::jsonb, updated_at = NOW()
                 WHERE space_id = :space_id AND user_id = :user_id
                 RETURNING updated_at"
            );
            $stmt->execute([
                'space_id' => $spaceId,
                'user_id' => $userId,
                'data' => json_encode($encrypted),
            ]);
            $row = $stmt->fetch();

            if (!$row) {
                http_response_code(404);
                echo json_encode(['error' => 'Space no encontrado']);
                return;
            }

            echo json_encode(['message' => 'Space actualizado', 'updatedAt' => $row['updated_at']]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error actualizando space']);
        }
    }

    public function create(): void
    {
        $user = $this->auth->requireAuth();
        $userId = $user['id'];
        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['data']) || !isset($input['spaceId'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Faltan campos: spaceId y data']);
            return;
        }

        try {
            $encrypted = LedgerEncryptionService::encryptLedger($input['data']);

            $stmt = Database::getInstance()->prepare(
                "INSERT INTO gctcp_spaces (user_id, space_id, data)
                 VALUES (:user_id, :space_id, :data::jsonb)
                 ON CONFLICT (user_id, space_id)
                 DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
                 RETURNING space_id, updated_at"
            );
            $stmt->execute([
                'user_id' => $userId,
                'space_id' => $input['spaceId'],
                'data' => json_encode($encrypted),
            ]);
            $row = $stmt->fetch();

            http_response_code(201);
            echo json_encode(['spaceId' => $row['space_id'], 'updatedAt' => $row['updated_at']]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error creando space']);
        }
    }

    public function delete(string $spaceId): void
    {
        $user = $this->auth->requireAuth();
        $userId = $user['id'];

        try {
            $stmt = Database::getInstance()->prepare(
                "DELETE FROM gctcp_spaces WHERE space_id = :space_id AND user_id = :user_id RETURNING space_id"
            );
            $stmt->execute(['space_id' => $spaceId, 'user_id' => $userId]);
            $row = $stmt->fetch();

            if (!$row) {
                http_response_code(404);
                echo json_encode(['error' => 'Space no encontrado']);
                return;
            }

            echo json_encode(['message' => 'Space eliminado']);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error eliminando space']);
        }
    }
}
