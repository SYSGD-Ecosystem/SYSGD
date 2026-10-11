import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
/** Marca de versión en cada valor cifrado: enc1:<iv b64>:<datos b64>. */
const PREFIX = "enc1:";
const ENCRYPTED_RE = /^enc1:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/;

const getEncryptionKey = (): Buffer => {
	const key = process.env.DATA_ENCRYPTION_KEY;
	if (!key || key.length !== 32) {
		throw new Error(
			"DATA_ENCRYPTION_KEY debe tener 32 caracteres (AES-256). " +
				"Genera una con: openssl rand -base64 24 | cut -c1-32",
		);
	}
	return Buffer.from(key, "utf8");
};

/** true si el valor ya está cifrado por este servicio. */
export const isEncryptedValue = (value: unknown): value is string =>
	typeof value === "string" && ENCRYPTED_RE.test(value);

/**
 * Cifra un campo de texto para guardarlo en la BD. null/undefined se
 * conservan (columnas nulables) y "" se guarda tal cual (no hay nada que
 * ocultar y se evitan criptogramas inútiles).
 */
export const encryptField = (
	plaintext: string | null | undefined,
): string | null => {
	if (plaintext === null || plaintext === undefined) return null;
	if (plaintext === "") return "";
	const key = getEncryptionKey();
	const iv = randomBytes(IV_LENGTH);
	const cipher = createCipheriv(ALGORITHM, key, iv, {
		authTagLength: TAG_LENGTH,
	});
	const encrypted = Buffer.concat([
		cipher.update(plaintext, "utf8"),
		cipher.final(),
		cipher.getAuthTag(),
	]);
	return `${PREFIX}${iv.toString("base64")}:${encrypted.toString("base64")}`;
};

/**
 * Descifra un valor leído de la BD. Los valores viejos en texto plano pasan
 * tal cual (migración transparente: lo nuevo se cifra al escribir, lo viejo
 * se sigue leyendo). null/undefined/"" se conservan.
 *
 * Lanza si el criptograma es inválido (clave incorrecta o manipulación):
 * fallo ruidoso, nunca texto corrupto silencioso.
 */
export const decryptField = (
	stored: string | null | undefined,
): string | null => {
	if (stored === null || stored === undefined) return null;
	if (stored === "" || !isEncryptedValue(stored)) return stored;
	const key = getEncryptionKey();
	const [, ivB64, dataB64] = stored.split(":");
	const iv = Buffer.from(ivB64, "base64");
	const encrypted = Buffer.from(dataB64, "base64");
	const authTag = encrypted.subarray(-TAG_LENGTH);
	const content = encrypted.subarray(0, -TAG_LENGTH);
	const decipher = createDecipheriv(ALGORITHM, key, iv, {
		authTagLength: TAG_LENGTH,
	});
	decipher.setAuthTag(authTag);
	const decrypted = Buffer.concat([decipher.update(content), decipher.final()]);
	return decrypted.toString("utf8");
};
