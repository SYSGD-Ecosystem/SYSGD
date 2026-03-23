import { createHmac, randomBytes } from 'crypto';

export type LicenseTier = 'free' | 'pro' | 'vip';

export interface License {
  key: string;
  email: string;
  machineId: string;
  tier: LicenseTier;
  expiresAt: string;
  activatedAt: string;
  deviceName: string;
}

export interface LicenseValidationResult {
  valid: boolean;
  license?: License;
  error?: string;
}

const SECRET_KEY = 'SYSGD_LICENSE_SECRET_KEY_2024';

const TIER_DURATIONS: Record<LicenseTier, number> = {
  free: 7,    // 7 días
  pro: 30,   // 30 días
  vip: 90,   // 90 días
};

export function generateRequestCode(): string {
  const randomPart = randomBytes(4).toString('hex').toUpperCase();
  return `SYSGD-REQ-${randomPart}`;
}

export function parseLicenseKey(key: string): {
  prefix: string;
  tier: LicenseTier;
  emailHash: string;
  machineHash: string;
  expiryHash: string;
} | null {
  const parts = key.split('-');
  if (parts.length !== 5) return null;
  
  const [prefix, tierStr, emailHash, machineHash, expiryHash] = parts;
  
  if (prefix !== 'SYGDD') return null;
  
  let tier: LicenseTier;
  if (tierStr.startsWith('FREE')) tier = 'free';
  else if (tierStr.startsWith('PRO')) tier = 'pro';
  else if (tierStr.startsWith('VIP')) tier = 'vip';
  else return null;
  
  return { prefix, tier, emailHash, machineHash, expiryHash };
}

export function generateLicenseKey(
  email: string,
  machineId: string,
  tier: LicenseTier,
  expiryDate: Date
): string {
  const tierPrefix = {
    free: 'FREE',
    pro: 'PRO',
    vip: 'VIP',
  }[tier];
  
  const emailHash = createHmac('sha256', SECRET_KEY)
    .update(email.toLowerCase())
    .digest('hex')
    .substring(0, 5)
    .toUpperCase();
  
  const machineHash = machineId.substring(0, 5).toUpperCase();
  
  const expiryHash = createHmac('sha256', SECRET_KEY)
    .update(expiryDate.toISOString())
    .digest('hex')
    .substring(0, 5)
    .toUpperCase();
  
  return `SYGDD-${tierPrefix}22-${emailHash}-${machineHash}-${expiryHash}`;
}

export function validateLicenseKey(
  key: string,
  email: string,
  machineId: string,
  currentDate: Date = new Date()
): LicenseValidationResult {
  const parsed = parseLicenseKey(key);
  
  if (!parsed) {
    return { valid: false, error: 'Formato de licencia inválido' };
  }
  
  const expectedEmailHash = createHmac('sha256', SECRET_KEY)
    .update(email.toLowerCase())
    .digest('hex')
    .substring(0, 5)
    .toUpperCase();
  
  if (parsed.emailHash !== expectedEmailHash) {
    return { valid: false, error: 'Licencia no válida para este correo' };
  }
  
  const machineIdPrefix = machineId.substring(0, 5).toUpperCase();
  if (parsed.machineHash !== machineIdPrefix) {
    return { valid: false, error: 'Licencia no válida para este dispositivo' };
  }
  
  const duration = TIER_DURATIONS[parsed.tier];
  const activatedDate = new Date();
  const expiresAt = new Date(activatedDate.getTime() + duration * 24 * 60 * 60 * 1000);
  
  if (expiresAt < currentDate) {
    return { valid: false, error: 'Licencia expirada' };
  }
  
  const license: License = {
    key,
    email: email.toLowerCase(),
    machineId,
    tier: parsed.tier,
    expiresAt: expiresAt.toISOString(),
    activatedAt: activatedDate.toISOString(),
    deviceName: 'Dispositivo',
  };
  
  return { valid: true, license };
}

export function getLicenseDuration(tier: LicenseTier): number {
  return TIER_DURATIONS[tier];
}

export function isLicenseExpired(license: License): boolean {
  return new Date(license.expiresAt) < new Date();
}

export function getDaysRemaining(license: License): number {
  const now = new Date();
  const expires = new Date(license.expiresAt);
  const diff = expires.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
