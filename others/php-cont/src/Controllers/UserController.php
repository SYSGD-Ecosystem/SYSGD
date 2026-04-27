<?php

namespace App\Controllers;

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../vendor/autoload.php';

use Database;
use App\Middleware\AuthMiddleware;

class UserController {
    private AuthMiddleware $auth;

    public function __construct() {
        $this->auth = new AuthMiddleware();
    }

    public function getPlan(): void {
        $user = $this->auth->requireAuth();

        try {
            $stmt = Database::getInstance()->prepare(
                "SELECT user_data FROM users WHERE id = $1"
            );
            $stmt->execute([$user['id']]);
            $result = $stmt->fetch();

            if (!$result) {
                http_response_code(404);
                echo json_encode(['error' => 'Usuario no encontrado']);
                return;
            }

            $userData = json_decode($result['user_data'] ?? '{}', true);
            $billing = $userData['billing'] ?? [];

            echo json_encode([
                'ai_task_credits' => $billing['ai_task_credits'] ?? 0,
                'pdf_credits' => $billing['pdf_credits'] ?? 0,
                'storage_credits' => $billing['storage_credits'] ?? 0,
                'plan' => $billing['plan'] ?? 'free'
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al obtener plan']);
        }
    }

    public function register(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $name = $input['name'] ?? '';
        $email = $input['email'] ?? '';
        $password = $input['password'] ?? '';

        if (empty($name) || empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode(['message' => 'Faltan datos requeridos']);
            return;
        }

        try {
            $checkStmt = Database::getInstance()->prepare(
                "SELECT id FROM users WHERE email = $1"
            );
            $checkStmt->execute([$email]);
            
            if ($checkStmt->fetch()) {
                http_response_code(409);
                echo json_encode(['message' => 'El correo ya está registrado']);
                return;
            }

            $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
            $defaultData = [
                'billing' => [
                    'ai_task_credits' => 0,
                    'pdf_credits' => 0,
                    'storage_credits' => 0,
                    'plan' => 'free'
                ],
                'settings' => []
            ];

            $insertStmt = Database::getInstance()->prepare(
                "INSERT INTO users (name, email, password, privileges, user_data) 
                 VALUES ($1, $2, $3, 'user', $4) 
                 RETURNING id, name, email, privileges"
            );
            $insertStmt->execute([$name, $email, $hashedPassword, json_encode($defaultData)]);
            $user = $insertStmt->fetch();

            echo json_encode([
                'success' => true,
                'user' => $user
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error al registrar usuario']);
        }
    }
}
