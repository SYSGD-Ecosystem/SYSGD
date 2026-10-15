<?php

require_once __DIR__ . '/../vendor/autoload.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
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
$contWorkspacesController = new \App\Controllers\ContWorkspacesController();
$contTurnosController = new \App\Controllers\ContTurnosController();
$accountingDocumentsController = new \App\Controllers\AccountingDocumentsController();
$nomenclatorsController = new \App\Controllers\NomenclatorsController();
$gctcpSpaceController = new \App\Controllers\GctcpSpaceController();

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

if ($path === 'cont-workspaces' && $requestMethod === 'GET') {
    $contWorkspacesController->list();
    exit;
}

if ($path === 'cont-workspaces' && $requestMethod === 'POST') {
    $contWorkspacesController->create();
    exit;
}

if (preg_match('/^cont-workspaces\/([^\/]+)$/', $path, $m) && $requestMethod === 'GET') {
    $contWorkspacesController->get($m[1]);
    exit;
}

if (preg_match('/^cont-workspaces\/([^\/]+)\/name$/', $path, $m) && $requestMethod === 'PUT') {
    $contWorkspacesController->rename($m[1]);
    exit;
}

if (preg_match('/^cont-workspaces\/([^\/]+)$/', $path, $m) && $requestMethod === 'DELETE') {
    $contWorkspacesController->delete($m[1]);
    exit;
}

if (preg_match('/^cont-workspaces\/([^\/]+)\/ledger$/', $path, $m) && $requestMethod === 'GET') {
    $contWorkspacesController->getLedger($m[1]);
    exit;
}

if (preg_match('/^cont-workspaces\/([^\/]+)\/ledger$/', $path, $m) && $requestMethod === 'PUT') {
    $contWorkspacesController->saveLedger($m[1]);
    exit;
}

if (preg_match('/^cont-workspaces\/([^\/]+)\/members$/', $path, $m) && $requestMethod === 'GET') {
    $contWorkspacesController->listMembers($m[1]);
    exit;
}

if (preg_match('/^cont-workspaces\/([^\/]+)\/members\/invite$/', $path, $m) && $requestMethod === 'POST') {
    $contWorkspacesController->inviteMember($m[1]);
    exit;
}

if (preg_match('/^cont-workspaces\/([^\/]+)\/members\/([^\/]+)$/', $path, $m) && $requestMethod === 'PATCH') {
    $contWorkspacesController->updateMemberRole($m[1], $m[2]);
    exit;
}

if (preg_match('/^cont-workspaces\/([^\/]+)\/members\/([^\/]+)$/', $path, $m) && $requestMethod === 'DELETE') {
    $contWorkspacesController->removeMember($m[1], $m[2]);
    exit;
}

if (preg_match('/^cont-workspaces\/([^\/]+)\/vendedores\/links$/', $path, $m) && $requestMethod === 'GET') {
    $contWorkspacesController->listVendedorLinks($m[1]);
    exit;
}

if (preg_match('/^cont-workspaces\/([^\/]+)\/vendedores\/([^\/]+)\/link$/', $path, $m) && $requestMethod === 'PUT') {
    $contWorkspacesController->linkVendedor($m[1], $m[2]);
    exit;
}

if (preg_match('/^cont-workspaces\/([^\/]+)\/vendedores\/([^\/]+)\/link$/', $path, $m) && $requestMethod === 'DELETE') {
    $contWorkspacesController->unlinkVendedor($m[1], $m[2]);
    exit;
}

if (preg_match('/^cont-turnos\/([^\/]+)\/informe-disponibilidad$/', $path, $m) && $requestMethod === 'PUT') {
    $contTurnosController->putInformeDisponibilidad($m[1]);
    exit;
}

if (preg_match('/^cont-turnos\/([^\/]+)\/informe-disponibilidad$/', $path, $m) && $requestMethod === 'GET') {
    $contTurnosController->getInformeDisponibilidad($m[1]);
    exit;
}

if (preg_match('/^cont-turnos\/([^\/]+)\/reportes-turno$/', $path, $m) && $requestMethod === 'POST') {
    $contTurnosController->postReporteTurno($m[1]);
    exit;
}

if (preg_match('/^cont-turnos\/([^\/]+)\/reportes-turno$/', $path, $m) && $requestMethod === 'GET') {
    $contTurnosController->getReportesTurno($m[1]);
    exit;
}

if (preg_match('/^cont-turnos\/([^\/]+)\/reportes-turno\/([^\/]+)$/', $path, $m) && $requestMethod === 'PATCH') {
    $contTurnosController->patchReporteTurno($m[1], $m[2]);
    exit;
}

if ($path === 'accounting-documents' && $requestMethod === 'GET') {
    $accountingDocumentsController->list();
    exit;
}

if ($path === 'accounting-documents' && $requestMethod === 'POST') {
    $accountingDocumentsController->create();
    exit;
}

if (preg_match('/^accounting-documents\/([^\/]+)$/', $path, $m) && $requestMethod === 'GET') {
    $accountingDocumentsController->get($m[1]);
    exit;
}

if (preg_match('/^accounting-documents\/([^\/]+)$/', $path, $m) && $requestMethod === 'PUT') {
    $accountingDocumentsController->save($m[1]);
    exit;
}

if ($path === 'nomenclators/accounting/categories' && $requestMethod === 'GET') {
    $nomenclatorsController->listCategories();
    exit;
}

if ($path === 'nomenclators/accounting/subcategories' && $requestMethod === 'GET') {
    $nomenclatorsController->listSubcategories();
    exit;
}

if ($path === 'nomenclators/accounting/search' && $requestMethod === 'GET') {
    $nomenclatorsController->searchAccountingCatalog();
    exit;
}

if ($path === 'nomenclators/cnae/search' && $requestMethod === 'GET') {
    $nomenclatorsController->searchCnae();
    exit;
}

if ($path === 'gctcp-space' && $requestMethod === 'GET') {
    $gctcpSpaceController->list();
    exit;
}

if ($path === 'gctcp-space' && $requestMethod === 'POST') {
    $gctcpSpaceController->create();
    exit;
}

if (preg_match('/^gctcp-space\/([^\/]+)$/', $path, $m) && $requestMethod === 'GET') {
    $gctcpSpaceController->get($m[1]);
    exit;
}

if (preg_match('/^gctcp-space\/([^\/]+)$/', $path, $m) && $requestMethod === 'PUT') {
    $gctcpSpaceController->update($m[1]);
    exit;
}

if (preg_match('/^gctcp-space\/([^\/]+)$/', $path, $m) && $requestMethod === 'DELETE') {
    $gctcpSpaceController->delete($m[1]);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Endpoint no encontrado']);
