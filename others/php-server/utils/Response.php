<?php

/**
 * Utility class for handling HTTP responses
 */
class Response {
    public static function success($data = null, $message = "Success") {
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'success',
            'message' => $message,
            'data' => $data
        ]);
        exit;
    }

    public static function error($message, $code = 500) {
        http_response_code($code);
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'error',
            'message' => $message
        ]);
        exit;
    }

    public static function unauthorized($message = "Unauthorized") {
        self::error($message, 401);
    }

    public static function notFound($message = "Not Found") {
        self::error($message, 404);
    }

    public static function badRequest($message = "Bad Request") {
        self::error($message, 400);
    }
}
