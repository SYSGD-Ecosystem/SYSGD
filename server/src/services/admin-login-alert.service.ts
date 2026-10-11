import { EmailService } from "./emailService";
import { SUPERADMIN_EMAIL } from "../utils/superadmin";

const ENABLED = (process.env.ADMIN_LOGIN_ALERT_ENABLED || "true") === "true";

// Pasarela SMS Cuba (OTP NOXCREATION). El token NO va en código: variable de
// entorno SMS_API_TOKEN en Railway. Sin token, la alerta sale solo por email.
const SMS_API_URL =
	process.env.SMS_API_URL || "https://otp.noxcreation.dev/api/v2/sms/send";
const SMS_API_TOKEN = process.env.SMS_API_TOKEN || "";
const SUPERADMIN_PHONE = process.env.SUPERADMIN_PHONE || "+5351158544";

/** SMS corto (≤160 caracteres) al superadmin. Nunca lanza. */
const sendSmsAlert = async (message: string): Promise<boolean> => {
	if (!SMS_API_TOKEN) {
		console.warn("SMS_API_TOKEN no configurado: alerta de login solo por email");
		return false;
	}
	try {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), 12000);
		const res = await fetch(SMS_API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-token-secret": SMS_API_TOKEN,
			},
			body: JSON.stringify({
				phoneNumber: SUPERADMIN_PHONE,
				message: message.slice(0, 160),
			}),
			signal: controller.signal,
		});
		clearTimeout(timer);
		if (!res.ok) {
			console.error(`SMS de alerta falló: HTTP ${res.status}`);
			return false;
		}
		const data = (await res.json().catch(() => ({}))) as {
			success?: boolean;
			error?: string;
		};
		if (data.success === false) {
			console.error("SMS de alerta rechazado:", data.error);
			return false;
		}
		return true;
	} catch (error) {
		console.error("Error enviando SMS de alerta:", error);
		return false;
	}
};

export interface AdminLoginInfo {
	email: string;
	name: string;
	ip: string;
	userAgent: string;
	at: Date;
}

/**
 * Avisa al superadmin cuando OTRA cuenta admin inicia sesión: SMS a su
 * teléfono + email. Fire-and-forget: nunca bloquea ni retrasa el login
 * (los errores solo van a consola). Cada SMS cuesta 6 CUP del saldo NOXCREATION.
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

	const smsText =
		`SYSGD alerta: login admin ${info.email} IP ${info.ip} ${when}`;
	void sendSmsAlert(smsText);
};
