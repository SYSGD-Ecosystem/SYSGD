<?php

namespace App\Controllers;

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../vendor/autoload.php';

use Database;
use App\Middleware\AuthMiddleware;

class AccountingDocumentsController
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

        if (!$this->hasAccountingAccess($userId)) {
            http_response_code(403);
            echo json_encode(['error' => 'Esta funcion esta disponible solo para planes Pro y VIP']);
            return;
        }

        try {
            $stmt = Database::getInstance()->prepare(
                "SELECT id, user_id, name, document_type, payload, created_at, updated_at
                 FROM accounting_documents WHERE user_id = :user_id ORDER BY created_at DESC"
            );
            $stmt->execute(['user_id' => $userId]);
            $docs = $stmt->fetchAll();

            $result = array_map(function ($row) {
                return [
                    'id' => $row['id'],
                    'userId' => $row['user_id'],
                    'name' => $row['name'],
                    'documentType' => $row['document_type'],
                    'payload' => $row['payload'],
                    'createdAt' => $row['created_at'],
                    'updatedAt' => $row['updated_at'],
                ];
            }, $docs);

            echo json_encode($result);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al listar documentos contables']);
        }
    }

    public function create(): void
    {
        $user = $this->auth->requireAuth();
        $userId = $user['id'];
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$this->hasAccountingAccess($userId)) {
            http_response_code(403);
            echo json_encode(['error' => 'Esta funcion esta disponible solo para planes Pro y VIP']);
            return;
        }

        $name = trim($input['name'] ?? '');
        if (empty($name)) {
            http_response_code(400);
            echo json_encode(['error' => 'El nombre del documento es obligatorio']);
            return;
        }

        try {
            $stmt = Database::getInstance()->prepare(
                "INSERT INTO accounting_documents (user_id, name, document_type, payload)
                 VALUES (:user_id, :name, 'tcp_income_expense', '{}'::jsonb)
                 RETURNING id, user_id, name, document_type, payload, created_at, updated_at"
            );
            $stmt->execute(['user_id' => $userId, 'name' => $name]);
            $doc = $stmt->fetch();

            http_response_code(201);
            echo json_encode([
                'id' => $doc['id'],
                'userId' => $doc['user_id'],
                'name' => $doc['name'],
                'documentType' => $doc['document_type'],
                'payload' => $doc['payload'],
                'createdAt' => $doc['created_at'],
                'updatedAt' => $doc['updated_at'],
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al crear documento contable']);
        }
    }

    public function get(string $id): void
    {
        $user = $this->auth->requireAuth();
        $userId = $user['id'];

        if (!$this->hasAccountingAccess($userId)) {
            http_response_code(403);
            echo json_encode(['error' => 'Esta funcion esta disponible solo para planes Pro y VIP']);
            return;
        }

        try {
            $stmt = Database::getInstance()->prepare(
                "SELECT id, user_id, name, document_type, payload, created_at, updated_at
                 FROM accounting_documents WHERE id = :id AND user_id = :user_id"
            );
            $stmt->execute(['id' => $id, 'user_id' => $userId]);
            $doc = $stmt->fetch();

            if (!$doc) {
                http_response_code(404);
                echo json_encode(['error' => 'Documento no encontrado']);
                return;
            }

            echo json_encode([
                'id' => $doc['id'],
                'userId' => $doc['user_id'],
                'name' => $doc['name'],
                'documentType' => $doc['document_type'],
                'payload' => $doc['payload'],
                'createdAt' => $doc['created_at'],
                'updatedAt' => $doc['updated_at'],
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al obtener documento contable']);
        }
    }

    public function save(string $id): void
    {
        $user = $this->auth->requireAuth();
        $userId = $user['id'];
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$this->hasAccountingAccess($userId)) {
            http_response_code(403);
            echo json_encode(['error' => 'Esta funcion esta disponible solo para planes Pro y VIP']);
            return;
        }

        if (!isset($input['payload']) || !is_array($input['payload'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Parametros invalidos']);
            return;
        }

        try {
            $stmt = Database::getInstance()->prepare(
                "UPDATE accounting_documents
                 SET payload = :payload::jsonb, updated_at = NOW()
                 WHERE id = :id AND user_id = :user_id
                 RETURNING id, user_id, name, document_type, payload, created_at, updated_at"
            );
            $stmt->execute([
                'id' => $id,
                'user_id' => $userId,
                'payload' => json_encode($input['payload']),
            ]);
            $doc = $stmt->fetch();

            if (!$doc) {
                http_response_code(404);
                echo json_encode(['error' => 'Documento no encontrado']);
                return;
            }

            echo json_encode([
                'message' => 'Documento guardado',
                'updatedAt' => $doc['updated_at'],
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al guardar documento contable']);
        }
    }

    private function hasAccountingAccess(string $userId): bool
    {
        $stmt = Database::getInstance()->prepare(
            "SELECT user_data->'billing'->>'tier' as tier FROM users WHERE id = :user_id"
        );
        $stmt->execute(['user_id' => $userId]);
        $tier = $stmt->fetch()['tier'] ?? null;
        return in_array($tier, ['pro', 'vip']);
    }
}
