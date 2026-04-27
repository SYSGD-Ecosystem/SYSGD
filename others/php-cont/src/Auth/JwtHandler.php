<?php

namespace App\Auth;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class JwtHandler {
    private string $secret;
    private int $ttl = 7 * 24 * 60 * 60; // 7 días en segundos

    public function __construct() {
        $this->secret = $_ENV['JWT_SECRET'] ?? '';
        if (empty($this->secret)) {
            throw new Exception('JWT_SECRET no está definido en las variables de entorno');
        }
    }

    public function encode(array $payload): string {
        $issuedAt = time();
        $expire = $issuedAt + $this->ttl;

        $payload['iat'] = $issuedAt;
        $payload['exp'] = $expire;

        return JWT::encode($payload, $this->secret, 'HS256');
    }

    public function decode(string $token): ?object {
        try {
            return JWT::decode($token, new Key($this->secret, 'HS256'));
        } catch (Exception $e) {
            return null;
        }
    }

    public function validate(string $token): ?object {
        return $this->decode($token);
    }

    public function getUserFromToken(string $token): ?array {
        $decoded = $this->decode($token);
        if (!$decoded) {
            return null;
        }

        return [
            'id' => $decoded->id ?? null,
            'email' => $decoded->email ?? null,
            'name' => $decoded->name ?? null,
            'role' => $decoded->role ?? 'user'
        ];
    }
}
