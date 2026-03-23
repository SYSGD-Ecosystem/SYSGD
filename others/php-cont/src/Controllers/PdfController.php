<?php

namespace App\Controllers;

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../vendor/autoload.php';

use Database;
use App\Middleware\AuthMiddleware;
use TCPDF;

class PdfController {
    private AuthMiddleware $auth;

    public function __construct() {
        $this->auth = new AuthMiddleware();
    }

    public function generateTcpPdf(): void {
        $user = $this->auth->requireAuth();
        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['generalData']) || !isset($input['ingresos']) || !isset($input['gastos'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Datos incompletos para generar PDF']);
            return;
        }

        try {
            $stmt = Database::getInstance()->prepare(
                "SELECT user_data->'billing'->>'pdf_credits' as credits FROM users WHERE id = $1"
            );
            $stmt->execute([$user['id']]);
            $result = $stmt->fetch();
            $credits = intval($result['credits'] ?? 0);

            if ($credits < 1) {
                http_response_code(402);
                echo json_encode([
                    'error' => 'Créditos insuficientes',
                    'message' => 'No tienes créditos disponibles para generar el PDF',
                    'credits' => ['available' => $credits]
                ]);
                return;
            }

            $this->consumePdfCredit($user['id']);

            $pdf = $this->buildTcpPdf($input);
            
            $year = $input['generalData']['anio'] ?? date('Y');
            $filename = "Registro_TCP_{$year}.pdf";

            header('Content-Type: application/pdf');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            header('X-Credits-Consumed: 1');
            
            echo $pdf;
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al generar el PDF: ' . $e->getMessage()]);
        }
    }

    private function consumePdfCredit(string $userId): void {
        $stmt = Database::getInstance()->prepare(
            "UPDATE users SET user_data = jsonb_set(
                user_data, 
                '{billing,pdf_credits}', 
                (COALESCE(user_data->'billing'->>'pdf_credits', '0')::int - 1)::text::jsonb
            ) WHERE id = $1"
        );
        $stmt->execute([$userId]);
    }

    private function buildTcpPdf(array $data): string {
        $pdf = new TCPDF('L', 'mm', 'A4', true, 'UTF-8', false);
        
        $pdf->SetCreator('SYSGD');
        $pdf->SetAuthor('SYSGD Cont');
        $pdf->SetTitle('Registro TCP');
        
        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);
        
        $pdf->SetMargins(10, 10, 10);
        $pdf->SetAutoPageBreak(true, 10);
        
        $pdf->AddPage();
        
        $generalData = $data['generalData'] ?? [];
        $ingresos = $data['ingresos'] ?? [];
        $gastos = $data['gastos'] ?? [];
        
        $html = '<h1 style="text-align:center;">REGISTRO DE INGRESOS Y GASTOS</h1>';
        $html .= '<h2 style="text-align:center;">TRABAJADOR POR CUENTA PROPIA</h2>';
        $html .= '<br/>';
        
        $html .= '<table border="1" cellpadding="4">';
        $html .= '<tr><th colspan="2" style="background-color:#ddd;">DATOS DEL CONTRIBUYENTE</th></tr>';
        $html .= '<tr><td><b>Nombre:</b></td><td>' . ($generalData['nombre'] ?? '') . '</td></tr>';
        $html .= '<tr><td><b>Año:</b></td><td>' . ($generalData['anio'] ?? '') . '</td></tr>';
        $html .= '<tr><td><b>NIT:</b></td><td>' . ($generalData['nit'] ?? '') . '</td></tr>';
        $html .= '<tr><td><b>Actividad:</b></td><td>' . ($generalData['actividad'] ?? '') . '</td></tr>';
        $html .= '<tr><td><b>Dirección Fiscal:</b></td><td>' . ($generalData['fiscalCalle'] ?? '') . ', ' . ($generalData['fiscalMunicipio'] ?? '') . ', ' . ($generalData['fiscalProvincia'] ?? '') . '</td></tr>';
        $html .= '</table>';
        
        $html .= '<br/><h3>RESUMEN ANUAL</h3>';
        
        $totalIngresos = $this->calculateTotal($ingresos);
        $totalGastos = $this->calculateTotal($gastos);
        $beneficio = $totalIngresos - $totalGastos;
        
        $html .= '<table border="1" cellpadding="4">';
        $html .= '<tr><td><b>Total Ingresos:</b></td><td style="text-align:right;">' . number_format($totalIngresos, 2) . ' CUP</td></tr>';
        $html .= '<tr><td><b>Total Gastos:</b></td><td style="text-align:right;">' . number_format($totalGastos, 2) . ' CUP</td></tr>';
        $html .= '<tr><td><b>Beneficio:</b></td><td style="text-align:right;">' . number_format($beneficio, 2) . ' CUP</td></tr>';
        $html .= '</table>';
        
        $html .= '<br/><p style="font-size:10px;">Generado por SYSGD Cont - Servidor PHP</p>';
        
        $pdf->writeHTML($html, true, false, true, false, '');
        
        return $pdf->Output('tcp.pdf', 'S');
    }

    private function calculateTotal(array $months): float {
        $total = 0.0;
        
        $monthKeys = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
        
        foreach ($monthKeys as $month) {
            if (isset($months[$month]) && is_array($months[$month])) {
                foreach ($months[$month] as $entry) {
                    $importe = floatval(str_replace(',', '.', ($entry['importe'] ?? '0')));
                    $total += $importe;
                }
            }
        }
        
        return $total;
    }
}
