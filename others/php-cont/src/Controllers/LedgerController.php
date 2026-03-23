<?php

namespace App\Controllers;

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../vendor/autoload.php';

use Database;
use App\Middleware\AuthMiddleware;

class LedgerController {
    private AuthMiddleware $auth;

    public function __construct() {
        $this->auth = new AuthMiddleware();
    }

    public function get(): void {
        $user = $this->auth->requireAuth();

        try {
            $stmt = Database::getInstance()->prepare(
                "SELECT registro, updated_at FROM cont_ledger_records WHERE user_id = :user_id"
            );
            $stmt->execute(['user_id' => $user['id']]);
            $record = $stmt->fetch();

            if (!$record) {
                echo json_encode([
                    'registro' => null,
                    'updatedAt' => null
                ]);
                return;
            }

            $registro = $record['registro'];
            
            if (is_string($registro)) {
                $registro = json_decode($registro, true);
            }
            
            // Si está cifrado, descifrar; si no, usarlo directamente
            if ($this->isEncryptedData($registro)) {
                try {
                    $registro = $this->decryptLedger($registro);
                } catch (\Exception $e) {
                    error_log("Decrypt error: " . $e->getMessage());
                    $registro = null;
                }
            }
            // Si no está cifrado pero es un array, usarlo tal cual (datos legacy sin cifrar)

            echo json_encode([
                'registro' => $registro,
                'updatedAt' => $record['updated_at']
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al obtener registro contable']);
        }
    }

    public function save(): void {
        $user = $this->auth->requireAuth();
        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['registro'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta el campo registro']);
            return;
        }

        try {
            $encryptedData = $this->encryptLedger($input['registro']);

            $stmt = Database::getInstance()->prepare(
                "INSERT INTO cont_ledger_records (user_id, registro)
                 VALUES (:user_id, :registro::jsonb)
                 ON CONFLICT (user_id)
                 DO UPDATE SET registro = EXCLUDED.registro, updated_at = NOW()
                 RETURNING updated_at"
            );
            $stmt->execute(['user_id' => $user['id'], 'registro' => json_encode($encryptedData)]);
            $result = $stmt->fetch();

            echo json_encode([
                'message' => 'Registro contable guardado',
                'updatedAt' => $result['updated_at']
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            error_log("Ledger save error: " . $e->getMessage());
            echo json_encode(['error' => 'Error al guardar registro contable: ' . $e->getMessage()]);
        }
    }

    private function getEncryptionKey(): string {
        $key = $_ENV['LEDGER_ENCRYPTION_KEY'] ?? '';
        if (empty($key)) {
            throw new \Exception('LEDGER_ENCRYPTION_KEY no está definido');
        }
        if (strlen($key) !== 32) {
            throw new \Exception('LEDGER_ENCRYPTION_KEY debe tener 32 caracteres');
        }
        return $key;
    }

    private function encryptLedger(array $data): array {
        $key = $this->getEncryptionKey();
        $iv = random_bytes(16);
        
        $encrypted = openssl_encrypt(
            json_encode($data),
            'aes-256-gcm',
            $key,
            OPENSSL_RAW_DATA,
            $iv,
            $tag
        );

        $encryptedWithTag = $encrypted . $tag;

        return [
            'encrypted' => base64_encode($encryptedWithTag),
            'iv' => base64_encode($iv)
        ];
    }

    private function decryptLedger(array $encryptedData): array {
        $key = $this->getEncryptionKey();
        
        $encryptedWithTag = base64_decode($encryptedData['encrypted']);
        $iv = base64_decode($encryptedData['iv']);
        
        $tag = substr($encryptedWithTag, -16);
        $encrypted = substr($encryptedWithTag, 0, -16);
        
        $decrypted = openssl_decrypt(
            $encrypted,
            'aes-256-gcm',
            $key,
            OPENSSL_RAW_DATA,
            $iv,
            $tag
        );

        return json_decode($decrypted, true);
    }

    private function isEncryptedData($data): bool {
        if (!is_array($data)) return false;
        return isset($data['encrypted']) && isset($data['iv']);
    }
}
