import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { promisify } from 'util';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

export interface EncryptedData {
  encrypted: string;
  iv: string;
}

export class LedgerEncryptionService {
  private static getEncryptionKey(): string {
    const key = process.env.LEDGER_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('Missing LEDGER_ENCRYPTION_KEY environment variable');
    }
    if (key.length !== 32) {
      throw new Error('LEDGER_ENCRYPTION_KEY must be 32 characters for AES-256');
    }
    return key;
  }

  public static encryptLedger(registro: unknown): EncryptedData {
    const key = this.getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);
    
    const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
    
    const jsonData = JSON.stringify(registro);
    const encrypted = Buffer.concat([
      cipher.update(jsonData, 'utf8'),
      cipher.final(),
      cipher.getAuthTag()
    ]);

    return {
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('base64')
    };
  }

  public static decryptLedger(encryptedData: EncryptedData): unknown {
    const key = this.getEncryptionKey();
    
    const encrypted = Buffer.from(encryptedData.encrypted, 'base64');
    const iv = Buffer.from(encryptedData.iv, 'base64');
    
    const authTag = encrypted.subarray(-TAG_LENGTH);
    const encryptedContent = encrypted.subarray(0, -TAG_LENGTH);
    
    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
    decipher.setAuthTag(authTag);
    
    const decrypted = decipher.update(encryptedContent) + decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  public static isEncryptedData(data: unknown): boolean {
    if (!data || typeof data !== 'object') return false;
    const obj = data as Record<string, unknown>;
    return typeof obj.encrypted === 'string' && typeof obj.iv === 'string';
  }
}
