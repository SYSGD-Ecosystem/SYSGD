// src/services/token.service.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { promisify } from 'util';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

export class TokenService {
  private static getEncryptionKey(tokenType: string): string {

    const envVar = "TOKEN_ENCRYPTION_KEY" // `${tokenType.toUpperCase()}_TOKEN_ENCRYPTION_KEY`;
    const key = process.env[envVar];
    if (!key) {
      throw new Error(`Missing ${envVar} environment variable`);
    }
    return key;
  }

  public static async encryptToken(token: string, tokenType: string): Promise<{ encrypted: Buffer; iv: Buffer }> {
    const key = this.getEncryptionKey(tokenType);
    const iv = await promisify(randomBytes)(IV_LENGTH);
    console.log(ALGORITHM, key, iv, TAG_LENGTH)
    const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
    
    const encrypted = Buffer.concat([
      cipher.update(token, 'utf8'),
      cipher.final(),
      cipher.getAuthTag()
    ]);

    return { encrypted, iv };
  }

  public static decryptToken(encryptedToken: Buffer, iv: Buffer, tokenType: string): string {
    const key = this.getEncryptionKey(tokenType);
    
    const authTag = encryptedToken.subarray(-TAG_LENGTH);
    const encrypted = encryptedToken.subarray(0, -TAG_LENGTH);
    
    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
    decipher.setAuthTag(authTag);
    
    return decipher.update(encrypted) + decipher.final('utf8');
  }
}