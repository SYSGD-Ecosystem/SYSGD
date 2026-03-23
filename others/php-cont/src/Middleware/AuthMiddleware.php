<?php

namespace App\Middleware;

use App\Auth\JwtHandler;

class AuthMiddleware {
    private JwtHandler $jwt;

    public function __construct() {
        $this->jwt = new JwtHandler();
    }

    public function handle(): ?array {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_COOKIE['token'] ?? null;

        if (!$authHeader) {
            return null;
        }

        if (str_starts_with($authHeader, 'Bearer ')) {
            $token = substr($authHeader, 7);
        } else {
            $token = $authHeader;
        }

        $user = $this->jwt->getUserFromToken($token);
        
        if (!$user || !$user['id']) {
            return null;
        }

        return $user;
    }

    public function requireAuth(): array {
        $user = $this->handle();
        
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'Usuario no autenticado']);
            exit;
        }

        return $user;
    }
}
