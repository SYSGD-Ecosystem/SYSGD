<?php

namespace App\Services;

class AccountingEncryption
{
    public static function encrypt(string $value): string
    {
        $key = $_ENV['FIELD_ENCRYPTION_KEY'] ?? $_ENV['LEDGER_ENCRYPTION_KEY'] ?? '';
        if (empty($key)) {
            return $value;
        }
        $iv = random_bytes(16);
        $encrypted = openssl_encrypt($value, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
        return base64_encode($iv . $tag . $encrypted);
    }

    public static function decrypt(string $value): string
    {
        $key = $_ENV['FIELD_ENCRYPTION_KEY'] ?? $_ENV['LEDGER_ENCRYPTION_KEY'] ?? '';
        if (empty($key)) {
            return $value;
        }
        $data = base64_decode($value);
        if ($data === false || strlen($data) < 32) {
            return $value;
        }
        $iv = substr($data, 0, 16);
        $tag = substr($data, 16, 16);
        $encrypted = substr($data, 32);
        $decrypted = openssl_decrypt($encrypted, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
        return $decrypted !== false ? $decrypted : $value;
    }

    public static function isEncrypted(string $value): bool
    {
        return str_starts_with($value, 'eyJ') || (base64_decode($value, true) !== false && strlen($value) > 32);
    }
}
