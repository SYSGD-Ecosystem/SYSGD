<?php

/**
 * Configuration file for the SYSGD API
 */

class Config {
    private static $instance = null;
    private $config = [];

    private function __construct() {
        // Load environment variables
        $dotenv = new Dotenv\Dotenv(__DIR__ . '/../');
        $dotenv->load();

        // Database configuration
        $this->config['database'] = [
            'host' => $_ENV['DB_HOST'] ?? 'localhost',
            'port' => $_ENV['DB_PORT'] ?? '3306',
            'name' => $_ENV['DB_NAME'] ?? 'sysgd',
            'user' => $_ENV['DB_USER'] ?? 'root',
            'pass' => $_ENV['DB_PASS'] ?? '',
        ];

        // Server configuration
        $this->config['server'] = [
            'port' => $_ENV['SERVER_PORT'] ?? '8080',
            'env' => $_ENV['SERVER_ENV'] ?? 'development',
        ];

        // JWT configuration
        $this->config['jwt'] = [
            'secret' => $_ENV['JWT_SECRET'] ?? 'your-secret-key',
            'expires_in' => $_ENV['JWT_EXPIRES_IN'] ?? '24h',
        ];

        // CORS configuration
        $this->config['cors'] = [
            'origin' => $_ENV['CORS_ORIGIN'] ?? 'http://localhost:5173',
            'methods' => $_ENV['CORS_METHODS'] ?? 'GET,POST,PUT,DELETE,OPTIONS',
            'headers' => $_ENV['CORS_HEADERS'] ?? 'Content-Type,Authorization',
        ];

        // API configuration
        $this->config['api'] = [
            'version' => $_ENV['API_VERSION'] ?? 'v1',
        ];
    }

    public static function getInstance(): self {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function get(string $key, $default = null) {
        $keys = explode('.', $key);
        $value = $this->config;
        foreach ($keys as $key) {
            if (!isset($value[$key])) {
                return $default;
            }
            $value = $value[$key];
        }
        return $value;
    }
}
