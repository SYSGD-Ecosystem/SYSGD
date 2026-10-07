import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import {
	findUserByemail,
	findAuthUserById,
	logUserLogin,
} from "../services/authService";
import { getAuthSubject } from "../middlewares/auth-jwt";
import { pool } from "../db";
import { createDefaultUserData } from "../utils/billing";
import { getClientIp, isIpFromCuba } from "../utils/ip";
import { AdminTwoFactorService } from "../services/adminTwoFactor.service";
import { LoginSecurityService } from "../services/loginSecurity.service";
import { normalizeClientSource, type ClientSource } from "../utils/client-source";
import { EmailVerificationService } from "../services/emailVerification.service";
import { AuthAccountError, changeOwnPassword } from "../services/authAccount.service";
import { recordUserActivity } from "../services/activity.service";
import {
	HEADER_SESIONES,
	crearSesion,
	generateAccessToken,
	generarRefreshToken,
} from "./sessions.controller";

dotenv.config();

if (!process.env.JWT_SECRET) {
	throw new Error("Falta definir JWT_SECRET en variables de entorno");
}

const JWT_SECRET = process.env.JWT_SECRET;
let twoFactorSchemaEnsured = false;

const ensureTwoFactorSchema = async () => {
	if (twoFactorSchemaEnsured) return;
	await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT false;
  `);
	await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;
  `);
	await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;
  `);
	await EmailVerificationService.ensureSchema();
	twoFactorSchemaEnsured = true;
};

interface UserPayload {
	id: string;
	email: string;
	name: string;
	privileges: string;
}

/** Formato del token pendiente de 2FA: solo identifica, sin PII. */
interface PendingTwoFactorPayload {
	id: string;
	purpose: "login-2fa";
}

const setAuthCookie = (res: Response, token: string, maxAgeMs: number) => {
	res.cookie("token", token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
		maxAge: maxAgeMs,
	});
};

const sendAuthSuccess = async (
	req: Request,
	res: Response,
	user: UserPayload,
	token: string,
	loginSource: ClientSource,
) => {
	await logUserLogin(
		user.id,
		req.ip || "0.0.0.0",
		req.headers["user-agent"] || "",
		loginSource,
	);

	setAuthCookie(res, token, 1000 * 60 * 60 * 24 * 7);

	// La app actual NO envia este header: recibe exactamente lo de siempre,
	// mismo token de 7/30 dias y nada mas. Es lo que garantiza que los 470
	// usuarios actuales sigan entrando sin enterarse de nada.
	//
	// La app nueva si lo envia y entra al flujo con refresh token.
	if (req.headers[HEADER_SESIONES] !== "v1") {
		res.status(201).json({
			message: "Login correcto",
			token,
			user,
		});
		return;
	}

	const refreshToken = generarRefreshToken();

	try {
		const sessionId = await crearSesion({
			userId: user.id,
			refreshToken,
			deviceId: (req.body?.deviceId as string) || null,
			deviceNombre: (req.body?.deviceName as string) || null,
			ip: req.ip || null,
			userAgent: req.headers["user-agent"] || null,
		});

		res.status(201).json({
			message: "Login correcto",
			// Access corto. La app nueva lo refresca cada 15 min.
			token: generateAccessToken(user),
			refreshToken,
			sessionId,
			user,
		});
	} catch (err) {
		// Si falla la sesion, no se cae el login: se devuelve el token viejo y
		// la app funciona, solo que sin revocacion hasta que se reintente.
		console.error("No se pudo crear la sesion, se devuelve token simple:", err);
		res.status(201).json({
			message: "Login correcto",
			token,
			user,
		});
	}
};

const createPendingTwoFactorToken = (user: UserPayload) =>
	jwt.sign(
		{
			sub: user.id,
			purpose: "login-2fa",
		},
		JWT_SECRET as string,
		{ expiresIn: `${AdminTwoFactorService.getPendingTokenTtlMinutes()}m` },
	);

const parsePendingTwoFactorToken = (
	token: string,
): PendingTwoFactorPayload | null => {
	try {
		const decoded = jwt.verify(
			token,
			JWT_SECRET as string,
		) as { sub?: unknown; id?: unknown; purpose?: unknown };
		if (decoded.purpose !== "login-2fa") {
			return null;
		}
		// `sub` es el formato actual; `id` cubre tokens pendientes
		// emitidos antes de minimizar el payload.
		const subject =
			typeof decoded.sub === "string" && decoded.sub.length > 0
				? decoded.sub
				: typeof decoded.id === "string" && decoded.id.length > 0
					? decoded.id
					: null;
		if (!subject) {
			return null;
		}
		return { id: subject, purpose: "login-2fa" };
	} catch (error) {
		console.error("Invalid pending 2FA token:", error);
		return null;
	}
};

export function generateJWT(user: {
	id: string;
	email: string;
	name: string;
	privileges: string;
}) {
	const expiresIn = user.privileges === "admin" ? "7d" : "30d";

	// El token solo identifica al sujeto (sub). Email, nombre y privilegios
	// se hidratan desde la base de datos en cada request (isAuthenticated).
	return jwt.sign(
		{
			sub: user.id,
		},
		JWT_SECRET as string,
		{ expiresIn },
	);
}

export const login = async (req: Request, res: Response) => {
	const { email, password } = req.body;
	const loginSource = normalizeClientSource(req.headers["x-app-source"], "unknown");
	if (!email || !password) {
		res.status(400).json({ message: "Faltan credenciales" });
		return;
	}

	try {
		await ensureTwoFactorSchema();
		const user = await findUserByemail(email);

		if (user === null) {
			res.status(401).json({ message: "Usuario no encontrado" });
			return;
		}

		const lockStatus = LoginSecurityService.getLockStatus(user.lockout_until);
		if (lockStatus.isLocked) {
			res.setHeader("Retry-After", lockStatus.retryAfterSeconds.toString());
			res.status(423).json({
				message:
					"Cuenta bloqueada temporalmente por intentos fallidos. Intenta nuevamente en unos minutos.",
				retryAfterSeconds: lockStatus.retryAfterSeconds,
			});
			return;
		}

		if (user.status === "invited" && !user.password) {
			res.status(202).json({
				message: "Usuario invitado detectado",
				status: "invited",
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
					status: user.status,
				},
			});
			return;
		}

		if (user.status === "suspended" || user.status === "banned") {
			res.status(403).json({ message: "Esta cuenta no tiene acceso habilitado." });
			return;
		}

		if (!user.password) {
			res.status(401).json({ message: "Credenciales inválidas" });
			return;
		}

		const match = await bcrypt.compare(password, user.password);

		if (!match) {
			const failed = await LoginSecurityService.registerFailedAttempt(user.id);
			if (failed.locked) {
				res.setHeader("Retry-After", (failed.retryAfterSeconds || 0).toString());
				res.status(423).json({
					message:
						"Cuenta bloqueada temporalmente por intentos fallidos. Intenta nuevamente en unos minutos.",
					retryAfterSeconds: failed.retryAfterSeconds,
				});
				return;
			}

			res.status(402).json({
				message: "Contraseña incorrecta",
				attemptsLeft: failed.attemptsLeft,
			});
			return;
		}

		await LoginSecurityService.clearFailedAttempts(user.id);

		const authUser: UserPayload = {
			id: user.id,
			email: user.email,
			name: user.name,
			privileges: user.privileges,
		};

		const enforceAdminTwoFactor = false && user.privileges === "admin" && AdminTwoFactorService.isRequiredForAdmins();
		const requiresTwoFactor =
			enforceAdminTwoFactor || Boolean(user.two_factor_enabled);

		if (user.privileges === "admin") {
			const clientIp = getClientIp(req);
			if (!isIpFromCuba(clientIp)) {
				res.status(403).json({
					message:
						"Acceso denegado. El administrador solo puede iniciar sesión desde Cuba.",
					ip: clientIp,
				});
					return;
				}
		}

		if (requiresTwoFactor) {
			const issueResult = await AdminTwoFactorService.issueCode(authUser);
			if (!issueResult.success) {
				const status = issueResult.secondsRemaining ? 429 : 500;
				res.status(status).json({
					message: issueResult.error || "No se pudo iniciar 2FA",
					secondsRemaining: issueResult.secondsRemaining,
				});
				return;
			}

			const twoFactorToken = createPendingTwoFactorToken(authUser);
			res.status(202).json({
				message: "Se envió un código de verificación a tu correo",
				requiresTwoFactor: true,
				twoFactorMethod: "email",
				twoFactorToken,
				expiresInMinutes: AdminTwoFactorService.getPendingTokenTtlMinutes(),
				user: authUser,
			});
			return;
		}

		const token = generateJWT(authUser);
		await sendAuthSuccess(req, res, authUser, token, loginSource);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Error interno del servidor" });
	}
};

export const verifyAdminTwoFactor = async (req: Request, res: Response) => {
	const { twoFactorToken, code } = req.body;
	if (!twoFactorToken || !code) {
		res.status(400).json({ message: "Token de 2FA y codigo son requeridos" });
		return;
	}

	const pending = parsePendingTwoFactorToken(twoFactorToken);
	if (!pending) {
		res.status(401).json({ message: "Token de 2FA invalido o expirado" });
		return;
	}

	try {
		const user = await findAuthUserById(pending.id);
		if (!user) {
			res.status(401).json({ message: "Usuario no encontrado" });
			return;
		}

		const result = await AdminTwoFactorService.verifyCode(user.id, code);
		if (!result.success) {
			res.status(401).json({
				message: result.error || "Codigo de verificacion invalido",
				attemptsLeft: result.attemptsLeft,
			});
			return;
		}

		const token = generateJWT(user);

		await sendAuthSuccess(
			req,
			res,
			user,
			token,
			normalizeClientSource(req.headers["x-app-source"], "unknown"),
		);
	} catch (error) {
		console.error("Error verifying admin 2FA:", error);
		res.status(500).json({ message: "Error al verificar el segundo factor" });
	}
};

export const resendAdminTwoFactor = async (req: Request, res: Response) => {
	const { twoFactorToken } = req.body;
	if (!twoFactorToken) {
		res.status(400).json({ message: "Token de 2FA requerido" });
		return;
	}

	const pending = parsePendingTwoFactorToken(twoFactorToken);
	if (!pending) {
		res.status(401).json({ message: "Token de 2FA invalido o expirado" });
		return;
	}

	try {
		const user = await findAuthUserById(pending.id);
		if (!user) {
			res.status(401).json({ message: "Usuario no encontrado" });
			return;
		}

		const result = await AdminTwoFactorService.issueCode({
			id: user.id,
			email: user.email,
			name: user.name,
		});

		if (!result.success) {
			const status = result.secondsRemaining ? 429 : 500;
			res.status(status).json({
				message: result.error || "No se pudo reenviar el codigo",
				secondsRemaining: result.secondsRemaining,
			});
			return;
		}

		res.status(200).json({ message: "Codigo reenviado correctamente" });
	} catch (error) {
		console.error("Error resending admin 2FA code:", error);
		res.status(500).json({ message: "Error al reenviar codigo" });
	}
};

export const getTwoFactorStatus = async (req: Request, res: Response) => {
	const authUser = req.user as UserPayload | undefined;
	if (!authUser?.id) {
		res.status(401).json({ message: "No autorizado" });
		return;
	}

	try {
		await ensureTwoFactorSchema();
		const { rows } = await pool.query<{
			two_factor_enabled: boolean;
			privileges: string;
			email_verified: boolean;
		}>(
			`SELECT two_factor_enabled, privileges, email_verified
       FROM users
       WHERE id = $1`,
			[authUser.id],
		);

		if (rows.length === 0) {
			res.status(404).json({ message: "Usuario no encontrado" });
			return;
		}

		const row = rows[0];
		const mandatory =
			row.privileges === "admin" && AdminTwoFactorService.isRequiredForAdmins();

		res.json({
			enabled: mandatory ? true : Boolean(row.two_factor_enabled),
			mandatory,
			method: "email",
			emailVerified: Boolean(row.email_verified),
		});
	} catch (error) {
		console.error("Error getting 2FA status:", error);
		res.status(500).json({ message: "Error al obtener estado de seguridad" });
	}
};

export const updateTwoFactorStatus = async (req: Request, res: Response) => {
	const authUser = req.user as UserPayload | undefined;
	const { enabled, password } = req.body as {
		enabled?: boolean;
		password?: string;
	};

	if (!authUser?.id) {
		res.status(401).json({ message: "No autorizado" });
		return;
	}

	if (typeof enabled !== "boolean" || !password) {
		res.status(400).json({ message: "enabled y password son requeridos" });
		return;
	}

	try {
		await ensureTwoFactorSchema();
		const { rows } = await pool.query<{
			password: string | null;
			privileges: string;
			email_verified: boolean;
		}>(
			`SELECT password, privileges, email_verified
       FROM users
       WHERE id = $1`,
			[authUser.id],
		);

		if (rows.length === 0) {
			res.status(404).json({ message: "Usuario no encontrado" });
			return;
		}

		const user = rows[0];
		const mandatory =
			user.privileges === "admin" && AdminTwoFactorService.isRequiredForAdmins();
		if (!enabled && mandatory) {
			res.status(400).json({
				message: "2FA es obligatorio para administradores en este entorno",
			});
			return;
		}

		if (!user.password) {
			res.status(400).json({ message: "La cuenta no tiene password local" });
			return;
		}

		if (enabled && !user.email_verified) {
			res.status(400).json({
				message:
					"Debes verificar tu correo electrónico antes de activar el doble factor.",
			});
			return;
		}

		const passwordValid = await bcrypt.compare(password, user.password);
		if (!passwordValid) {
			res.status(401).json({ message: "Contraseña incorrecta" });
			return;
		}

		await pool.query(
			`UPDATE users
       SET two_factor_enabled = $2
       WHERE id = $1`,
			[authUser.id, enabled],
		);

		res.json({
			message: enabled
				? "Doble factor activado correctamente"
				: "Doble factor desactivado correctamente",
			enabled,
			mandatory,
			emailVerified: Boolean(user.email_verified),
		});
	} catch (error) {
		console.error("Error updating 2FA status:", error);
		res.status(500).json({ message: "Error al actualizar seguridad" });
	}
};

export const changePassword = async (req: Request, res: Response) => {
	const authUser = req.user as UserPayload | undefined;
	const { currentPassword, newPassword } = req.body as {
		currentPassword?: string;
		newPassword?: string;
	};

	if (!authUser?.id) {
		res.status(401).json({ message: "No autorizado" });
		return;
	}

	try {
		const result = await changeOwnPassword({
			userId: authUser.id,
			currentPassword: currentPassword ?? "",
			newPassword: newPassword ?? "",
		});

		res.json(result);
	} catch (error) {
		if (error instanceof AuthAccountError) {
			res.status(error.statusCode).json({ message: error.message });
			return;
		}

		console.error("Error changing password:", error);
		res.status(500).json({ message: "Error al cambiar la contraseña" });
	}
};

export const deleteOwnAccount = async (req: Request, res: Response) => {
	const authUser = req.user as UserPayload | undefined;
	const { password } = req.body as { password?: string };

	if (!authUser?.id) {
		res.status(401).json({ message: "No autorizado" });
		return;
	}

	if (!password) {
		res.status(400).json({ message: "password es requerido" });
		return;
	}

	try {
		await ensureTwoFactorSchema();
		const { rows } = await pool.query<{
			password: string | null;
			email: string;
		}>(
			`SELECT password, email
       FROM users
       WHERE id = $1`,
			[authUser.id],
		);

		if (rows.length === 0) {
			res.status(404).json({ message: "Usuario no encontrado" });
			return;
		}

		const current = rows[0];
		if (!current.password) {
			res.status(400).json({ message: "No se puede eliminar esta cuenta con este método" });
			return;
		}

		const passwordValid = await bcrypt.compare(password, current.password);
		if (!passwordValid) {
			res.status(401).json({ message: "Contraseña incorrecta" });
			return;
		}

		const lockPassword = await bcrypt.hash(`${authUser.id}-${Date.now()}`, 10);
		const anonymizedEmail = `deleted+${authUser.id}@deleted.local`;
		await pool.query(
			`UPDATE users
       SET name = 'Cuenta eliminada',
           email = $2,
           password = $3,
           status = 'banned',
           is_public = false,
           two_factor_enabled = false
       WHERE id = $1`,
			[authUser.id, anonymizedEmail, lockPassword],
		);

		await pool.query(
			`DELETE FROM users_logins
       WHERE user_id = $1`,
			[authUser.id],
		);

		res.clearCookie("token", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
		});

		res.json({ message: "Cuenta eliminada correctamente" });
	} catch (error) {
		console.error("Error deleting own account:", error);
		res.status(500).json({ message: "Error al eliminar la cuenta" });
	}
};

export const checkUser = async (req: Request, res: Response) => {
	const { email } = req.body;
	if (!email) {
		res.status(400).json({ message: "Falta email" });
		return;
	}

	try {
		const user = await findUserByemail(email);
		if (!user) {
			res.status(404).json({ exists: false });
			return;
		}
		res.status(200).json({
			exists: true,
			id: user.id,
			status: user.status,
			hasPassword: !!user.password,
			privileges: user.privileges,
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Error interno del servidor" });
	}
};

export const getCurrentUser = async (req: Request, res: Response) => {
	const authHeader = req.headers.authorization;
	const tokenFromHeader = authHeader?.startsWith("Bearer ")
		? authHeader.split(" ")[1]
		: null;

	const token = tokenFromHeader || req.cookies?.token;

	if (!token) {
		res.status(401).json({ message: "No autorizado" });
		return;
	}

	let decoded: unknown;
	try {
		decoded = jwt.verify(token, JWT_SECRET as string);
	} catch (err) {
		console.error("JWT verification error:", err);
		res.status(401).json({ message: "Sesión inválida o expirada" });
		return;
	}

	// El token solo identifica (sub). Los datos del usuario se leen de la DB
	// para que la respuesta siempre refleje el estado real de la cuenta.
	const subject = getAuthSubject(decoded);
	if (!subject) {
		res.status(401).json({ message: "Sesión inválida o expirada" });
		return;
	}

	let user: UserPayload | null;
	try {
		user = await findAuthUserById(subject);
	} catch (err) {
		console.error("Error cargando usuario:", err);
		res.status(500).json({ message: "Error interno del servidor" });
		return;
	}

	if (!user) {
		res.status(401).json({ message: "Sesión inválida o expirada" });
		return;
	}

	res.json({
		id: user.id,
		name: user.name,
		email: user.email,
		privileges: user.privileges,
	});

	try {
		await recordUserActivity(req, user.id, "app_start");
	} catch (err) {
		console.error("Error registrando actividad:", err);
	}
};

export const completeInvitedUserRegistration = async (
	req: Request,
	res: Response,
) => {
	const { userId, name, password } = req.body;

	if (!userId || !name || !password) {
		res.status(400).json({ message: "Faltan datos requeridos" });
		return;
	}

	try {
		const defaultUserData = createDefaultUserData();
		const userCheck = await findUserByemail(req.body.email);
		if (!userCheck || userCheck.status !== "invited") {
			res
				.status(400)
				.json({ message: "Usuario no válido o ya completó registro" });
			return;
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		await pool.query(
			`UPDATE users 
				 SET name = $1, password = $2, status = 'active', user_data = COALESCE(user_data, $4::jsonb) 
				 WHERE id = $3 AND status = 'invited'`,
			[name, hashedPassword, userId, JSON.stringify(defaultUserData)],
		);

		const token = generateJWT({
			id: userId,
			email: req.body.email,
			name: name,
			privileges: userCheck.privileges,
		});

		setAuthCookie(res, token, 1000 * 60 * 60 * 24 * 7);

		res.status(201).json({
			message: "Registro completado exitosamente",
			token: token,
			user: {
				id: userId,
				email: req.body.email,
				name: name,
				status: "active",
			},
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Error interno del servidor" });
	}
};

export const issueExternalToken = async (req: Request, res: Response) => {
	const user = req.user as UserPayload | undefined;

	if (!user) {
		res.status(401).json({ message: "No autorizado" });
		return;
	}

	const token = generateJWT({
		id: user.id,
		email: user.email,
		name: user.name,
		privileges: user.privileges,
	});

	res.status(200).json({
		message: "Token generado para acceso externo",
		token,
		tokenType: "Bearer",
		expiresIn: "7d",
	});
};

// El logout que revoca de verdad vive en sessions.controller.ts y se importa
// en auth.routes.ts. Este no revocaba nada, solo borraba la cookie.
