import { EmailService } from "./emailService";
import { SUPERADMIN_EMAIL } from "../utils/superadmin";

const ENABLED = (process.env.ADMIN_LOGIN_ALERT_ENABLED || "true") === "true";

export interface AdminLoginInfo {
	email: string;
	name: string;
	ip: string;
	userAgent: string;
	at: Date;
}

/**
 * Avisa al superadmin cuando OTRA cuenta admin inicia sesión. Fire-and-forget:
 * nunca bloquea ni retrasa el login (los errores solo van a consola).
 *
 * Nota: SMS real a Cuba requiere una pasarela que hoy no existe en el
 * servidor; el aviso sale por email (Resend, ya operativo). Si se configura
 * un bot de Telegram o pasarela SMS, enganchar aquí.
 */
export const notifySuperadminOfAdminLogin = (
	info: AdminLoginInfo,
): void => {
	if (!ENABLED) return;

	const when = info.at.toISOString();
	const subject = `Alerta: login admin (${info.email})`;
	const text =
		`Se inició sesión con una cuenta administradora distinta a la tuya.\n\n` +
		`Cuenta: ${info.name} <${info.email}>\n` +
		`Fecha (UTC): ${when}\n` +
		`IP: ${info.ip}\n` +
		`Agente: ${info.userAgent}\n\n` +
		`Si no fuiste tú, revisa la página Seguridad y cambia las credenciales.`;

	void EmailService.sendEmail({
		to: SUPERADMIN_EMAIL,
		subject,
		html: `<pre>${text}</pre>`,
		text,
	}).then((ok) => {
		if (!ok) console.error("No se pudo enviar la alerta de login admin");
	}).catch((error) => {
		console.error("Error en alerta de login admin:", error);
	});
};
