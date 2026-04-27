import type { Request, Response } from "express";
import { pool } from "../db";
import {
  generateLicense,
  saveLicense,
  getUserLicenses,
  parseRequestCode,
  type LicenseTier,
} from "../services/license.service"; // el nuevo servicio RSA
import { getCurrentUserData } from "../controllers/users";

// ─── POST /api/licenses/generate ─────────────────────────────────────────────
// Body: { requestCode: string, tier: "monthly" | "quarterly" | "annual" }
//
// El cliente Electron generó un requestCode con su machineId + timestamp.
// El usuario lo pegó aquí y eligió un plan.
// Devolvemos la licenseKey firmada con RSA para que la pegue de vuelta en la app.
export async function generateLicenseHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = getCurrentUserData(req);
    if (!user) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }

    const { requestCode, tier } = req.body as {
      requestCode?: string;
      tier?: LicenseTier;
    };

    // Validar campos
    if (!requestCode || !tier) {
      res.status(400).json({
        error: "Faltan datos requeridos: requestCode y tier",
      });
      return;
    }

    const validTiers: LicenseTier[] = ["monthly", "quarterly", "annual"];
    if (!validTiers.includes(tier)) {
      res.status(400).json({
        error: "Tier inválido. Valores permitidos: monthly, quarterly, annual",
      });
      return;
    }

    // Decodificar el requestCode para extraer machineId y timestamp
    const parsed = parseRequestCode(requestCode);
    if (!parsed) {
      res.status(400).json({
        error:
          "El código de solicitud es inválido o está malformado. Genera uno nuevo desde la aplicación.",
      });
      return;
    }

    // El requestCode no debe tener más de 1 hora de antigüedad
    const ageMs = Date.now() - parsed.timestamp;
    if (ageMs > 60 * 60 * 1000) {
      res.status(400).json({
        error:
          "El código de solicitud ha expirado (validez: 1 hora). Genera uno nuevo desde la aplicación.",
      });
      return;
    }

    // Verificar que este requestCode no haya sido usado ya
    const existingUse = await pool.query(
      `SELECT 1 FROM license_request_codes WHERE request_code = $1 AND used = true`,
      [requestCode]
    );
    if (existingUse.rows.length > 0) {
      res.status(400).json({
        error:
          "Este código de solicitud ya fue utilizado. Genera uno nuevo desde la aplicación.",
      });
      return;
    }

    // Registrar el uso del requestCode (idempotencia: si falla el insert abajo, no se duplica)
    await pool.query(
      `INSERT INTO license_request_codes (user_id, request_code, machine_id, used, expires_at)
       VALUES ($1, $2, $3, true, NOW() + INTERVAL '1 hour')
       ON CONFLICT (request_code) DO UPDATE SET used = true`,
      [user.id, requestCode, parsed.machineId]
    );

    // Generar licencia firmada con RSA
    const { licenseKey, payload } = generateLicense(
      parsed.machineId,
      user.email,
      tier
    );

    // Guardar en la tabla licenses
    await saveLicense(user.id, licenseKey, payload);

    res.status(201).json({
      licenseKey,
      tier,
      machineId: parsed.machineId,
      expiresAt: new Date(payload.expiresAt).toISOString(),
    });
  } catch (error) {
    console.error("Error generating license:", error);
    res.status(500).json({ error: "Error interno generando licencia" });
  }
}

// ─── GET /api/licenses ────────────────────────────────────────────────────────
export async function getUserLicensesHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = getCurrentUserData(req);
    if (!user) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }

    const licenses = await getUserLicenses(user.id);

    res.json({
      licenses: licenses.map((l) => ({
        id: l.id,
        licenseKey: l.license_key,
        machineId: l.machine_id,
        tier: l.tier,
        issuedAt: l.issued_at,
        expiresAt: l.expires_at,
      })),
    });
  } catch (error) {
    console.error("Error getting licenses:", error);
    res.status(500).json({ error: "Error al obtener licencias" });
  }
}