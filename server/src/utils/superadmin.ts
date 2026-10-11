/**
 * Superadmin: resuelve en código (no en base de datos) para que ningún admin
 * —ni siquiera con acceso total a la API— pueda modificarlo ni eliminarlo.
 * Se configura con SUPERADMIN_EMAIL (por defecto, el correo del dueño).
 */
export const SUPERADMIN_EMAIL = (
	process.env.SUPERADMIN_EMAIL || "lazaro.salazarr@gmail.com"
).toLowerCase();

export const isSuperadminEmail = (email?: string | null): boolean =>
	(email ?? "").toLowerCase() === SUPERADMIN_EMAIL;
