<?php

require_once __DIR__ . '/../vendor/autoload.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

$basePath = '/api';
$path = str_replace($basePath, '', parse_url($requestUri, PHP_URL_PATH));
$path = trim($path, '/');

require_once __DIR__ . '/../config/database.php';

$authController = new \App\Controllers\AuthController();
$userController = new \App\Controllers\UserController();
$ledgerController = new \App\Controllers\LedgerController();
$pdfController = new \App\Controllers\PdfController();

if ($path === 'status' && $requestMethod === 'GET') {
    echo json_encode(['status' => 'ok', 'service' => 'sysgd-php-cont']);
    exit;
}

if ($path === 'auth/login' && $requestMethod === 'POST') {
    $authController->login();
    exit;
}

if ($path === 'auth/check-user' && $requestMethod === 'POST') {
    $authController->checkUser();
    exit;
}

if ($path === 'auth/me' && $requestMethod === 'GET') {
    $authController->me();
    exit;
}

if ($path === 'auth/logout' && $requestMethod === 'POST') {
    $authController->logout();
    exit;
}

if ($path === 'users/register' && $requestMethod === 'POST') {
    $userController->register();
    exit;
}

if ($path === 'users/plan' && $requestMethod === 'GET') {
    $userController->getPlan();
    exit;
}

if ($path === 'cont-ledger' && $requestMethod === 'GET') {
    $ledgerController->get();
    exit;
}

if ($path === 'cont-ledger' && $requestMethod === 'PUT') {
    $ledgerController->save();
    exit;
}

if ($path === 'accounting-documents/pdf/tcp' && $requestMethod === 'POST') {
    $pdfController->generateTcpPdf();
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Endpoint no encontrado']);
