/**
 * Los correos se guardan y comparan siempre sin espacios y en minúsculas.
 * La base de datos tiene un índice único sobre LOWER(BTRIM(email)), así que
 * cualquier escritura o búsqueda debe pasar por esta normalización.
 */
export const normalizeEmail = (email: string): string => email.trim().toLowerCase();
