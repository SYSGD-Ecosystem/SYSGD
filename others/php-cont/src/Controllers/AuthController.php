<?php

namespace App\Controllers;

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../vendor/autoload.php';

use App\Auth\JwtHandler;
use Database;

class AuthController {
    private JwtHandler $jwt;

    public function __construct() {
        $this->jwt = new JwtHandler();
    }

    public function login(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $email = $input['email'] ?? '';
        $password = $input['password'] ?? '';

        if (empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode(['message' => 'Faltan credenciales']);
            return;
        }

        try {
            $stmt = Database::getInstance()->prepare("SELECT * FROM users WHERE email = :email");
            $stmt->execute(['email' => $email]);
            $user = $stmt->fetch();

            if (!$user) {
                http_response_code(401);
                echo json_encode(['message' => 'Usuario no encontrado']);
                return;
            }

            if ($user['status'] === 'invited' && empty($user['password'])) {
                http_response_code(202);
                echo json_encode([
                    'message' => 'Usuario invitado detectado',
                    'status' => 'invited',
                    'user' => [
                        'id' => $user['id'],
                        'email' => $user['email'],
                        'name' => $user['name'],
                        'status' => $user['status']
                    ]
                ]);
                return;
            }

            if (!password_verify($password, $user['password'])) {
                http_response_code(402);
                echo json_encode(['message' => 'Contraseña incorrecta']);
                return;
            }

            $expiresIn = $user['privileges'] === 'admin' ? '30m' : '7d';
            $token = $this->jwt->encode([
                'id' => $user['id'],
                'email' => $user['email'],
                'name' => $user['name'],
                'privileges' => $user['privileges']
            ]);

            $this->logUserLogin($user['id']);

            http_response_code(200);
            echo json_encode([
                'token' => $token,
                'user' => [
                    'id' => $user['id'],
                    'email' => $user['email'],
                    'name' => $user['name'],
                    'privileges' => $user['privileges']
                ]
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            error_log("Login error: " . $e->getMessage());
            echo json_encode(['message' => 'Error interno del servidor', 'debug' => $e->getMessage()]);
        }
    }

    private function logUserLogin(string $userId): void {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
        
        Database::query(
            "INSERT INTO users_logins (user_id, ip_address, user_agent) VALUES ($1, $2, $3)",
            [$userId, $ip, $userAgent]
        );
    }

    public function me(): void {
        $auth = new \App\Middleware\AuthMiddleware();
        $user = $auth->requireAuth();

        try {
            $stmt = Database::getInstance()->prepare("SELECT id, name, email, privileges, status FROM users WHERE id = $1");
            $stmt->execute([$user['id']]);
            $userData = $stmt->fetch();

            if (!$userData) {
                http_response_code(404);
                echo json_encode(['error' => 'Usuario no encontrado']);
                return;
            }

            echo json_encode($userData);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al obtener usuario']);
        }
    }

    public function checkUser(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        $email = $input['email'] ?? '';

        if (empty($email)) {
            http_response_code(400);
            echo json_encode(['exists' => false]);
            return;
        }

        try {
            $stmt = Database::getInstance()->prepare("SELECT id FROM users WHERE email = $1");
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            echo json_encode(['exists' => !!$user]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['exists' => false]);
        }
    }

    public function logout(): void {
        http_response_code(200);
        echo json_encode(['message' => 'Sesión cerrada']);
    }
}
