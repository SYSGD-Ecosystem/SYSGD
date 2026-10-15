<?php

namespace App\Controllers;

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../vendor/autoload.php';

use Database;
use App\Middleware\AuthMiddleware;

class NomenclatorsController
{
    private AuthMiddleware $auth;

    public function __construct()
    {
        $this->auth = new AuthMiddleware();
    }

    public function listCategories(): void
    {
        $this->auth->requireAuth();

        try {
            $dbPath = $this->getNomenclatorDbPath();
            $db = new \SQLite3($dbPath, SQLITE3_OPEN_READONLY);

            $result = $db->query("SELECT code, name FROM account_categories ORDER BY sort_order, code");
            $categories = [];
            while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
                $categories[] = ['code' => $row['code'], 'name' => $row['name']];
            }
            $db->close();

            echo json_encode($categories);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al listar categorias contables']);
        }
    }

    public function listSubcategories(): void
    {
        $this->auth->requireAuth();

        try {
            $dbPath = $this->getNomenclatorDbPath();
            $db = new \SQLite3($dbPath, SQLITE3_OPEN_READONLY);

            $result = $db->query("SELECT code, name FROM account_subcategories ORDER BY sort_order, code");
            $subcategories = [];
            while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
                $subcategories[] = ['code' => $row['code'], 'name' => $row['name']];
            }
            $db->close();

            echo json_encode($subcategories);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al listar subcategorias contables']);
        }
    }

    public function searchAccountingCatalog(): void
    {
        $this->auth->requireAuth();

        $term = trim($_GET['q'] ?? '');
        $categoryCode = trim($_GET['categoryCode'] ?? '');
        $subcategoryCode = trim($_GET['subcategoryCode'] ?? '');
        $limit = (int) ($_GET['limit'] ?? 50);
        $limit = min(max($limit, 1), 200);

        try {
            $dbPath = $this->getNomenclatorDbPath();
            $db = new \SQLite3($dbPath, SQLITE3_OPEN_READONLY);

            $where = [];
            $params = [];

            if ($term !== '') {
                $where[] = "(UPPER(display_name) LIKE UPPER(:term) OR UPPER(display_code) LIKE UPPER(:term) OR UPPER(category_name) LIKE UPPER(:term) OR UPPER(subcategory_name) LIKE UPPER(:term))";
                $params['term'] = '%' . $term . '%';
            }
            if ($categoryCode !== '') {
                $where[] = "category_code = :category_code";
                $params['category_code'] = $categoryCode;
            }
            if ($subcategoryCode !== '') {
                $where[] = "subcategory_code = :subcategory_code";
                $params['subcategory_code'] = $subcategoryCode;
            }

            $whereClause = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';

            $sql = "SELECT item_type, category_code, category_name,
                    COALESCE(subcategory_code, '') as subcategory_code,
                    COALESCE(subcategory_name, '') as subcategory_name,
                    account_code, account_name, account_nature,
                    COALESCE(subaccount_code, '') as subaccount_code,
                    COALESCE(subaccount_name, '') as subaccount_name,
                    COALESCE(subaccount_nature, '') as subaccount_nature,
                    display_code, display_name, display_nature
                FROM (
                    SELECT 'Cuenta' AS item_type, category_code, category_name,
                        subcategory_code, subcategory_name, account_code, account_name, account_nature,
                        NULL AS subaccount_code, NULL AS subaccount_name, NULL AS subaccount_nature,
                        account_code AS display_code, account_name AS display_name, account_nature AS display_nature
                    FROM account_catalog_flat WHERE subaccount_id IS NULL
                    UNION ALL
                    SELECT 'Subcuenta' AS item_type, category_code, category_name,
                        subcategory_code, subcategory_name, account_code, account_name, account_nature,
                        subaccount_code, subaccount_name, subaccount_nature,
                        account_code || '.' || subaccount_code AS display_code, subaccount_name AS display_name, subaccount_nature AS display_nature
                    FROM account_catalog_flat WHERE subaccount_id IS NOT NULL
                ) catalog
                {$whereClause}
                ORDER BY category_code, subcategory_code, account_code, subaccount_code
                LIMIT :limit";

            $stmt = $db->prepare($sql);
            foreach ($params as $key => $val) {
                $stmt->bindValue(':' . $key, $val);
            }
            $stmt->bindValue(':limit', $limit, SQLITE3_INTEGER);

            $result = $stmt->execute();
            $items = [];
            while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
                $items[] = [
                    'itemType' => $row['item_type'],
                    'categoryCode' => $row['category_code'],
                    'categoryName' => $row['category_name'],
                    'subcategoryCode' => $row['subcategory_code'] ?? '',
                    'subcategoryName' => $row['subcategory_name'] ?? '',
                    'accountCode' => $row['account_code'],
                    'accountName' => $row['account_name'],
                    'accountNature' => $row['account_nature'],
                    'subaccountCode' => $row['subaccount_code'] ?? '',
                    'subaccountName' => $row['subaccount_name'] ?? '',
                    'subaccountNature' => $row['subaccount_nature'] ?? '',
                    'displayCode' => $row['display_code'],
                    'displayName' => $row['display_name'],
                    'displayNature' => $row['display_nature'],
                ];
            }
            $db->close();

            echo json_encode($items);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al buscar en nomenclador contable']);
        }
    }

    public function searchCnae(): void
    {
        $this->auth->requireAuth();

        $term = trim($_GET['q'] ?? '');
        $limit = (int) ($_GET['limit'] ?? 50);
        $limit = min(max($limit, 1), 200);

        try {
            $dbPath = $this->getNomenclatorDbPath();
            $db = new \SQLite3($dbPath, SQLITE3_OPEN_READONLY);

            $value = '%' . $term . '%';
            $stmt = $db->prepare(
                "SELECT section, extructure, code, description
                 FROM cnae
                 WHERE :value = '%%'
                    OR UPPER(description) LIKE UPPER(:value)
                    OR UPPER(code) LIKE UPPER(:value)
                    OR UPPER(section) LIKE UPPER(:value)
                    OR UPPER(extructure) LIKE UPPER(:value)
                 ORDER BY code
                 LIMIT :limit"
            );
            $stmt->bindValue(':value', $value);
            $stmt->bindValue(':limit', $limit, SQLITE3_INTEGER);
            $result = $stmt->execute();

            $items = [];
            while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
                $notesStmt = $db->prepare("SELECT descripcion FROM cnae_notes WHERE codigo_notas = :code");
                $notesStmt->bindValue(':code', $row['code']);
                $notesResult = $notesStmt->execute();
                $notes = [];
                while ($noteRow = $notesResult->fetchArray(SQLITE3_ASSOC)) {
                    $notes[] = $noteRow['descripcion'];
                }

                $corrStmt = $db->prepare(
                    "SELECT code_cnae, description_cnae, code_nae, description_nae, code_ciiu, description_ciiu
                     FROM cnae_correlation WHERE code_cnae = :code"
                );
                $corrStmt->bindValue(':code', $row['code']);
                $corrResult = $corrStmt->execute();
                $correlations = [];
                while ($corrRow = $corrResult->fetchArray(SQLITE3_ASSOC)) {
                    $correlations[] = [
                        'codeCnae' => $corrRow['code_cnae'],
                        'descriptionCnae' => $corrRow['description_cnae'],
                        'codeNae' => $corrRow['code_nae'],
                        'descriptionNae' => $corrRow['description_nae'],
                        'codeCiiu' => $corrRow['code_ciiu'],
                        'descriptionCiiu' => $corrRow['description_ciiu'],
                    ];
                }

                $items[] = [
                    'section' => $row['section'],
                    'structure' => $row['extructure'],
                    'code' => $row['code'],
                    'description' => $row['description'],
                    'notes' => $notes,
                    'correlations' => $correlations,
                ];
            }
            $db->close();

            echo json_encode($items);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al buscar en nomenclador CNAE']);
        }
    }

    private function getNomenclatorDbPath(): string
    {
        $candidates = [
            $_ENV['NOMENCLATOR_DB_PATH'] ?? null,
            __DIR__ . '/../../assets/database.db',
            __DIR__ . '/../../assets/filesdata.db',
            __DIR__ . '/../../../accounting/android/app/src/main/assets/filesdata.db',
            __DIR__ . '/../../../accounting/android/app/src/main/assets/database.db',
        ];

        foreach ($candidates as $path) {
            if ($path && file_exists($path)) {
                return $path;
            }
        }

        throw new \Exception('No se encontro la base del nomenclador. Configura NOMENCLATOR_DB_PATH o copia database.db/filesdata.db a assets/');
    }
}
