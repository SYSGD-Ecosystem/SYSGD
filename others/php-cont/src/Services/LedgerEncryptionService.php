<?php

namespace App\Services;

class LedgerEncryptionService
{
    private static function getKey(): string
    {
        $key = $_ENV['LEDGER_ENCRYPTION_KEY'] ?? '';
        if (empty($key)) {
            throw new \Exception('LEDGER_ENCRYPTION_KEY no esta definido');
        }
        if (strlen($key) !== 32) {
            throw new \Exception('LEDGER_ENCRYPTION_KEY debe tener 32 caracteres');
        }
        return $key;
    }

    public static function isEncryptedData($data): bool
    {
        if (!is_array($data)) return false;
        return isset($data['encrypted']) && isset($data['iv']);
    }

    public static function encryptLedger($data): array
    {
        $key = self::getKey();
        $iv = random_bytes(16);

        $encrypted = openssl_encrypt(
            json_encode($data),
            'aes-256-gcm',
            $key,
            OPENSSL_RAW_DATA,
            $iv,
            $tag
        );

        return [
            'encrypted' => base64_encode($encrypted . $tag),
            'iv' => base64_encode($iv)
        ];
    }

    public static function decryptLedger(array $encryptedData)
    {
        $key = self::getKey();

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

        if ($decrypted === false) {
            throw new \Exception('Error al descifrar los datos');
        }

        return json_decode($decrypted, true);
    }
}
