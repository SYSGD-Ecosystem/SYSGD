<?php

namespace App\Controllers;

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../vendor/autoload.php';

use Database;
use App\Middleware\AuthMiddleware;
use App\Services\LedgerEncryptionService;

class ContTurnosController
{
    private AuthMiddleware $auth;

    public function __construct()
    {
        $this->auth = new AuthMiddleware();
    }

    public function putInformeDisponibilidad(string $workspaceId): void
    {
        $user = $this->auth->requireAuth();
        $userId = $user['id'];
        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['informe'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta el campo informe']);
            return;
        }

        $informeId = $input['informeId'] ?? null;
        if ($informeId !== null && !$this->esUuid($informeId)) {
            http_response_code(400);
            echo json_encode(['error' => 'informeId no es un UUID valido']);
            return;
        }

        try {
            $encrypted = LedgerEncryptionService::encryptLedger($input['informe']);

            $stmt = Database::getInstance()->prepare(
                "INSERT INTO cont_informe_disponibilidad
                    (workspace_id, informe_id, informe, generado_en, huella, subido_por)
                 VALUES (:ws_id, COALESCE(:informe_id::uuid, gen_random_uuid()), :informe::jsonb, :generado_en, :huella, :user_id)
                 ON CONFLICT (workspace_id) DO UPDATE SET
                    informe_id = COALESCE(:informe_id::uuid, gen_random_uuid()),
                    informe = EXCLUDED.informe,
                    generado_en = EXCLUDED.generado_en,
                    huella = EXCLUDED.huella,
                    subido_por = EXCLUDED.subido_por,
                    updated_at = NOW()
                 RETURNING (xmax <> '0') AS actualizado, informe_id"
            );
            $stmt->execute([
                'ws_id' => $workspaceId,
                'informe_id' => $informeId,
                'informe' => json_encode($encrypted),
                'generado_en' => $input['generadoEn'] ?? null,
                'huella' => $input['huella'] ?? null,
                'user_id' => $userId,
            ]);
            $result = $stmt->fetch();

            echo json_encode([
                'actualizado' => $result['actualizado'] === true || $result['actualizado'] === 't',
                'informeId' => $result['informe_id'],
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al guardar el informe de disponibilidad']);
        }
    }

    public function getInformeDisponibilidad(string $workspaceId): void
    {
        $this->auth->requireAuth();

        try {
            $stmt = Database::getInstance()->prepare(
                "SELECT informe_id, informe, huella, generado_en, updated_at
                 FROM cont_informe_disponibilidad WHERE workspace_id = :id"
            );
            $stmt->execute(['id' => $workspaceId]);
            $row = $stmt->fetch();

            if (!$row) {
                http_response_code(404);
                echo json_encode(['error' => 'El negocio aun no ha publicado el informe de disponibilidad']);
                return;
            }

            $informe = $row['informe'];
            if (is_string($informe)) {
                $informe = json_decode($informe, true);
            }
            if (LedgerEncryptionService::isEncryptedData($informe)) {
                try {
                    $informe = LedgerEncryptionService::decryptLedger($informe);
                } catch (\Exception $e) {
                    $informe = null;
                }
            }

            echo json_encode([
                'informeId' => $row['informe_id'],
                'informe' => $informe,
                'huella' => $row['huella'],
                'generadoEn' => $row['generado_en'],
                'updatedAt' => $row['updated_at'],
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al obtener el informe de disponibilidad']);
        }
    }

    public function postReporteTurno(string $workspaceId): void
    {
        $user = $this->auth->requireAuth();
        $userId = $user['id'];
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$this->esUuid($input['id'] ?? '')) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta el id del reporte o no es un UUID valido']);
            return;
        }
        if (empty($input['vendedorId'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta el vendedorId']);
            return;
        }
        if (!isset($input['paquete'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta el campo paquete']);
            return;
        }

        $informeOrigenId = $input['informeOrigenId'] ?? null;
        if ($informeOrigenId !== null && !$this->esUuid($informeOrigenId)) {
            http_response_code(400);
            echo json_encode(['error' => 'informeOrigenId no es un UUID valido']);
            return;
        }

        try {
            $encrypted = LedgerEncryptionService::encryptLedger($input['paquete']);

            $stmt = Database::getInstance()->prepare(
                "INSERT INTO cont_reportes_turno
                    (id, workspace_id, informe_origen_id, informe_origen_generado_en,
                     vendedor_id, vendedor_nombre, turno_id, fecha_turno,
                     generado_en, estado, paquete, subido_por)
                 VALUES (:id, :ws_id, :inf_origen_id, :inf_origen_gen, :vendedor_id, :vendedor_nombre,
                         :turno_id, :fecha_turno, :generado_en, 'PENDIENTE', :paquete::jsonb, :user_id)
                 ON CONFLICT (workspace_id, id) DO NOTHING
                 RETURNING true AS creado"
            );
            $stmt->execute([
                'id' => $input['id'],
                'ws_id' => $workspaceId,
                'inf_origen_id' => $informeOrigenId,
                'inf_origen_gen' => $input['informeOrigenGeneradoEn'] ?? null,
                'vendedor_id' => $input['vendedorId'],
                'vendedor_nombre' => $input['vendedorNombre'] ?? '',
                'turno_id' => $input['turnoId'] ?? null,
                'fecha_turno' => $input['fechaTurno'] ?? null,
                'generado_en' => $input['generadoEn'] ?? null,
                'paquete' => json_encode($encrypted),
                'user_id' => $userId,
            ]);
            $row = $stmt->fetch();

            $creado = ($row !== false);
            http_response_code($creado ? 201 : 200);
            echo json_encode(['creado' => $creado, 'yaExistia' => !$creado]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al subir el reporte de turno']);
        }
    }

    public function getReportesTurno(string $workspaceId): void
    {
        $this->auth->requireAuth();

        $estado = $_GET['estado'] ?? null;
        $estadosValidos = ['PENDIENTE', 'FUSIONADO', 'RECHAZADO'];
        if ($estado !== null && !in_array($estado, $estadosValidos)) {
            http_response_code(400);
            echo json_encode(['error' => 'Estado invalido. Valores permitidos: ' . implode(', ', $estadosValidos)]);
            return;
        }

        try {
            $sql = "SELECT id, informe_origen_id, informe_origen_generado_en,
                           vendedor_id, vendedor_nombre, turno_id, fecha_turno, generado_en,
                           estado, estado_nota, paquete, created_at
                    FROM cont_reportes_turno
                    WHERE workspace_id = :id";
            $params = ['id' => $workspaceId];

            if ($estado !== null) {
                $sql .= " AND estado = :estado";
                $params['estado'] = $estado;
            }
            $sql .= " ORDER BY created_at DESC";

            $stmt = Database::getInstance()->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();

            $result = array_map(function ($row) {
                $paquete = $row['paquete'];
                if (is_string($paquete)) {
                    $paquete = json_decode($paquete, true);
                }
                if (LedgerEncryptionService::isEncryptedData($paquete)) {
                    try {
                        $paquete = LedgerEncryptionService::decryptLedger($paquete);
                    } catch (\Exception $e) {
                        $paquete = null;
                    }
                }

                return [
                    'id' => $row['id'],
                    'informeOrigenId' => $row['informe_origen_id'],
                    'informeOrigenGeneradoEn' => $row['informe_origen_generado_en'],
                    'vendedorId' => $row['vendedor_id'],
                    'vendedorNombre' => $row['vendedor_nombre'] ?? '',
                    'turnoId' => $row['turno_id'],
                    'fechaTurno' => $row['fecha_turno'],
                    'generadoEn' => $row['generado_en'],
                    'estado' => $row['estado'],
                    'estadoNota' => $row['estado_nota'],
                    'paquete' => $paquete,
                    'createdAt' => $row['created_at'],
                ];
            }, $rows);

            echo json_encode(['reportes' => $result]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al listar los reportes de turno']);
        }
    }

    public function patchReporteTurno(string $workspaceId, string $reporteId): void
    {
        $user = $this->auth->requireAuth();
        $userId = $user['id'];
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$this->esUuid($reporteId)) {
            http_response_code(400);
            echo json_encode(['error' => 'reporteId no es un UUID valido']);
            return;
        }

        $estado = $input['estado'] ?? '';
        if (!in_array($estado, ['FUSIONADO', 'RECHAZADO'])) {
            http_response_code(400);
            echo json_encode(['error' => 'estado debe ser FUSIONADO o RECHAZADO']);
            return;
        }

        try {
            $stmt = Database::getInstance()->prepare(
                "UPDATE cont_reportes_turno
                 SET estado = :estado, estado_nota = :nota, resuelto_por = :user_id,
                     resuelto_en = NOW(), updated_at = NOW()
                 WHERE workspace_id = :ws_id AND id = :reporte_id
                 RETURNING true AS actualizado"
            );
            $stmt->execute([
                'ws_id' => $workspaceId,
                'reporte_id' => $reporteId,
                'estado' => $estado,
                'nota' => $input['nota'] ?? null,
                'user_id' => $userId,
            ]);
            $result = $stmt->fetch();

            if (!$result) {
                http_response_code(404);
                echo json_encode(['error' => 'El reporte no existe en este espacio de trabajo']);
                return;
            }

            echo json_encode(['actualizado' => true]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al resolver el reporte de turno']);
        }
    }

    private function esUuid(string $value): bool
    {
        return (bool) preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $value);
    }
}
