<?php

/**
 * Database connection class
 */
class Database {
    private static $instance = null;
    private $connection;

    private function __construct() {
        try {
            $config = Config::getInstance();
            $dsn = "mysql:host=" . $config->get('database.host') . 
                   ";port=" . $config->get('database.port') . 
                   ";dbname=" . $config->get('database.name');

            $this->connection = new PDO(
                $dsn,
                $config->get('database.user'),
                $config->get('database.pass'),
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
                ]
            );
        } catch (PDOException $e) {
            error_log("Database connection error: " . $e->getMessage());
            throw new Exception("Database connection failed");
        }
    }

    public static function getInstance(): self {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection(): PDO {
        return $this->connection;
    }

    public function query($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            error_log("Database query error: " . $e->getMessage());
            throw new Exception("Database query failed");
        }
    }
}
