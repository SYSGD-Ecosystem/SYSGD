import crypto from "crypto";
import { pool } from "../db";

// ─── CLAVE PRIVADA (solo en el servidor, NUNCA en el cliente) ─────────────────
// En producción: carga desde variable de entorno o archivo seguro
// process.env.LICENSE_PRIVATE_KEY  o  fs.readFileSync('/secrets/private.pem')
const PRIVATE_KEY = process.env.LICENSE_PRIVATE_KEY || `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD5N9emD0devGJU
iuxt7b0lnWTXiAlz7ZuYiYGjp9WK1xFRmfwnD9W2OCx0fz8hUqDTS8LDxxeNh1K8
EkF8qnFygzHzPi2oUhbwBXPfiNVwtymFaFO1lurJt4mL51BfQ4gQbhZVOr61vuBF
e9sveRWIaPwvmoLkbLWcM9rvTzF/2H1mZnkWOt9+ep3BfMLfURdEuLJCgxOy6mkI
6LSUWGUXbHbJvVgD6OruQtnVt8rat7RePGmzkbg+GzR0RsCRWJT1noLYtm2LfUjB
tq8f+JS8dbp/ZFnS5YzBoNDuK45nIqK/Rqb65LHpie0L++G63XlvhSwuXEM3Q45t
HeJ+9RvBAgMBAAECggEADe3I8d0t/x2ejczXbsPwM8VenNy7sYTk0sNRsXLIkLpZ
O5M0iH7eMhFk66xue/dtKW4VMEHE/1oiPcRz8Eqq7UxnmumdXehbo5XcbnCMhGCa
U5xbfF1XWUeWqpD2uSJSPR/YA/K09L26tWt5GkfFVDLQ8HytZuSsCFNOH9ywXq2f
xYKSWAM4EcPbAlG+qw4SDahG0u7utDay8E8TazV/6xUSlj6oanMs6DODTmIdzUGD
1FmE7+klh0Z3O0OeSdY5l18LjKbPB6qZ5LjJqOk/pk/cXvOyPFS0tAYjmrzQGLqi
30+cVDIx3uab9HH/9GBHRYbVov+iXe49EPK1nq9/yQKBgQD9a40VJgwSNjOCvNjW
jVtIjQYXmnzd+c755vtlziLvAYG3S7enNSJNqRHuTg0+19KdvuBR3k5OBtzTplDT
TWjs9ZxgTo5DSbKNyASq40E8H5TBer9tFRgP2puFCbybk7F+yPIgLLLeWvfYs9/W
1tlXJIPbO/qFQFAP94N8YFjZOQKBgQD7wVcdtbuHga437ovCZl51/ATL7pHJ+grM
W2tq+P1tKzm4nLId3T7ad85dgJhfBztum0gejCSxjZ60RcojA6dKKlW/NirO5zal
Ulsx1eVxgc3jeo/tUymlEsh7l6odGRbIUnJuD21Op030gVkbisIsWnYDWpZGLTa2
GviLmwz+yQKBgQChEpYWphswDCFLbKrKHAi0IWaI5BmPoTLr5eNOPuo3TZbcIRU3
Au+tutN5y0Rh+B2XQ/YiMxFESNpc8C4ZT+9sBWSCVgvYOuRxd3t3/n+9LjmHjHRV
af3kPcdxlNG7dPFxK1myF5cM+3bi1tlkHSUBXWUtmH7P6SO6MlDxYe+3CQKBgD1X
+gM6Qgyds7bbQGDJEuFK3FxYsFt3uuParsztCMtuCe2K+Pe/7k3LfZRY/kfBemDU
I3mWCmbdLDue+ccYX835jNU/vKSXwD/+VkxJY1QKHgH83k8kwXQApKtA5GmcsGl1
dX6N8cOFjsAyOGU2pWOrUzA0BYPqBnfPEJrr1/nJAoGBAIuHITyKo+8c55QvdrA/
kPMAn+2ZqEzb944kBMOQ9k39hJjQ0Sj5tBHjOix4hlmwy/Cv0UzThiXqWwYz52bi
DJ2rYCRrQtdNwCS1aFxWtxGWDTb4SrSkxMI+q5fJXYUMwFc3MnDOrYX6qlK0i6qS
dvJRwvqZCC3m4CF+9fQffGg/
-----END PRIVATE KEY-----`;

// ─── TIPOS ────────────────────────────────────────────────────────────────────
export type LicenseTier = "monthly" | "quarterly" | "annual";

export interface LicensePayload {
  machineId: string;   // ID del dispositivo del cliente
  email: string;       // Email del comprador
  tier: LicenseTier;   // Plan comprado
  issuedAt: number;    // Unix timestamp de emisión
  expiresAt: number;   // Unix timestamp de expiración
}

export interface GeneratedLicense {
  licenseKey: string;  // payload:firma en base64
  payload: LicensePayload;
}

// ─── DURACIONES (días) ────────────────────────────────────────────────────────
const TIER_DURATIONS: Record<LicenseTier, number> = {
  monthly: 30,
  quarterly: 90,
  annual: 365,
};

// ─── GENERAR LICENCIA ─────────────────────────────────────────────────────────
// El servidor firma el payload con su clave privada RSA.
// El cliente solo necesita la clave pública para verificar — nunca puede forjar una licencia.
export function generateLicense(
  machineId: string,
  email: string,
  tier: LicenseTier
): GeneratedLicense {
  const now = Date.now();
  const durationMs = TIER_DURATIONS[tier] * 24 * 60 * 60 * 1000;

  const payload: LicensePayload = {
    machineId: machineId.trim().toUpperCase(),
    email: email.trim().toLowerCase(),
    tier,
    issuedAt: now,
    expiresAt: now + durationMs,
  };

  // Serializar el payload como JSON y firmarlo con SHA-256 + RSA
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadStr).toString("base64url");

  const sign = crypto.createSign("SHA256");
  sign.update(payloadB64);
  const signature = sign.sign(PRIVATE_KEY, "base64url");

  // Formato final: payloadB64.signature  (separado por punto, como un JWT simplificado)
  const licenseKey = `${payloadB64}.${signature}`;

  return { licenseKey, payload };
}

// ─── PARSEAR REQUEST CODE DEL CLIENTE ────────────────────────────────────────
// El request code que genera el cliente Electron es simplemente:
//   base64url({ machineId, timestamp })
// No necesita firma porque el servidor no confía en él ciegamente —
// solo lo usa para extraer el machineId antes de generar la licencia firmada.
export function parseRequestCode(requestCode: string): {
  machineId: string;
  timestamp: number;
} | null {
  try {
    const decoded = Buffer.from(requestCode, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded);
    if (!parsed.machineId || !parsed.timestamp) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ─── GUARDAR LICENCIA EN DB ───────────────────────────────────────────────────
export async function saveLicense(
  userId: string,
  licenseKey: string,
  payload: LicensePayload
): Promise<void> {
  await pool.query(
    `INSERT INTO licenses (user_id, email, license_key, machine_id, tier, issued_at, expires_at)
     VALUES ($1, $2, $3, $4, $5, to_timestamp($6 / 1000.0), to_timestamp($7 / 1000.0))
     ON CONFLICT (machine_id, user_id) DO UPDATE
     SET license_key = $3, tier = $5, issued_at = to_timestamp($6 / 1000.0), expires_at = to_timestamp($7 / 1000.0)`,
    [
      userId,
      payload.email,
      licenseKey,
      payload.machineId,
      payload.tier,
      payload.issuedAt,
      payload.expiresAt,
    ]
  );
}

// ─── OBTENER LICENCIAS DEL USUARIO ───────────────────────────────────────────
export async function getUserLicenses(userId: string) {
  const result = await pool.query(
    `SELECT id, license_key, machine_id, tier, issued_at, expires_at
     FROM licenses
     WHERE user_id = $1
     ORDER BY issued_at DESC`,
    [userId]
  );
  return result.rows;
}