import crypto from "crypto";
import { pool } from "../db";

/** Duracion del access token. Corto a proposito: si se filtra, el dano maximo es este plazo. */
export const ACCESS_TOKEN_MINUTES = 15;

/** Refresh token: renovacion deslizante. */
export const REFRESH_DIAS = 30;

/** Tope absoluto. Aunque se renueve siempre, aqui se muere. */
export const REFRESH_TOPE_DIAS = 90;

const MS_DIA = 86_400_000;

/**
 * Hash del refresh token.
 *
 * Se guarda el hash y no el token. Si alguien lee la base, con los hashes no
 * puede autenticarse; con los tokens crudos si. Un refresh token da acceso
 * completo a la cuenta.
 */
export const hashToken = (token: string): string =>
	crypto.createHash("sha256").update(token).digest("hex");

export const generarRefreshToken = (): string =>
	crypto.randomBytes(48).toString("base64url");

export interface CrearSesionInput {
	userId: string;
	refreshToken: string;
	deviceId?: string | null;
	deviceNombre?: string | null;
	ip?: string | null;
	userAgent?: string | null;
}

export interface SesionRow {
	id: string;
	user_id: string;
	device_id: string | null;
	device_nombre: string | null;
	ip: string | null;
	user_agent: string | null;
	created_at: string;
	last_seen_at: string;
	expires_at: string;
	deadline_at: string;
	revoked_at: string | null;
	revoked_reason: string | null;
}

/**
 * Crea la sesion y devuelve su id. Si el dispositivo ya tiene una sesion viva,
 * la revoca antes: mismo telefono, misma sesion, sin acumular filas.
 */
export const crearSesion = async (datos: CrearSesionInput): Promise<string> => {
	const cliente = await pool.connect();
	try {
		await cliente.query("BEGIN");

		if (datos.deviceId) {
			await cliente.query(
				`UPDATE user_sessions
				 SET revoked_at = NOW(), revoked_reason = 'sustitucion'
				 WHERE user_id = $1 AND device_id = $2 AND revoked_at IS NULL`,
				[datos.userId, datos.deviceId],
			);
		}

		// Tope absoluto del dispositivo: 90 dias contados desde su sesion mas
		// antigua. Renovarse muchas veces no lo extiende, asi un refresh robado
		// no puede renovarse para siempre mientras este en uso.
		//
		// deadline_at y expires_at van separados a proposito: si se calculara
		// expires_at contra el expires_at anterior, ambos serian el mismo valor
		// deslizante y la ventana nunca avanzaria.
		const { rows: previa } = await cliente.query<{ deadline_at: string }>(
			`SELECT LEAST(
			        NOW() + ($3::int * interval '1 day'),
			        MIN(created_at) + ($4::int * interval '1 day')
			 ) AS deadline_at
			   FROM user_sessions
			  WHERE user_id = $1 AND device_id = $2`,
			[datos.userId, datos.deviceId ?? null, REFRESH_TOPE_DIAS, REFRESH_TOPE_DIAS],
		);

		const deadline =
			previa[0]?.deadline_at ??
			new Date(Date.now() + REFRESH_TOPE_DIAS * MS_DIA).toISOString();

		const { rows: insert } = await cliente.query<{ id: string }>(
			`INSERT INTO user_sessions
				(user_id, token_hash, device_id, device_nombre, ip, user_agent, expires_at, deadline_at)
			 VALUES ($1, $2, $3, $4, $5, $6,
				        LEAST(NOW() + ($7::int * interval '1 day'), $8), $8)
			 RETURNING id`,
			[
				datos.userId,
				hashToken(datos.refreshToken),
				datos.deviceId ?? null,
				datos.deviceNombre ?? null,
				datos.ip ?? null,
				datos.userAgent ?? null,
				REFRESH_DIAS,
				deadline,
			],
		);

		await cliente.query("COMMIT");
		return insert[0].id;
	} catch (err) {
		await cliente.query("ROLLBACK");
		throw err;
	} finally {
		cliente.release();
	}
}

export class RefreshInvalidoError extends Error {
	constructor() {
		super("El refresh token no es válido, ya se usó, fue revocado o expiró");
		this.name = "RefreshInvalidoError";
	}
}

/**
 * Valida el refresh, lo rota y actualiza last_seen_at.
 *
 * Rotacion: el token viejo queda revocado y se emite uno nuevo. Si alguien
 * robo un refresh, lo usa antes que el titular y el token legitimo que llega
 * despues falla, lo que delata el robo.
 *
 * Devuelve la sesion con el user_id para firmar el nuevo access token.
 */
export const rotarRefreshToken = async (
	refreshToken: string,
	ip?: string | null,
	userAgent?: string | null,
): Promise<{ userId: string; sessionId: string; nuevoRefreshToken: string }> => {
	const cliente = await pool.connect();
	try {
		await cliente.query("BEGIN");

		const hash = hashToken(refreshToken);
		const { rows } = await cliente.query<SesionRow>(
			`SELECT * FROM user_sessions
			 WHERE token_hash = $1
			   FOR UPDATE`,
			[hash],
		);

		if (rows.length === 0) {
			throw new RefreshInvalidoError();
		}
		const sesion = rows[0];

		if (sesion.revoked_at !== null) {
			// Un token ya revocado significa que se uso dos veces, o que alguien
			// copio la sesion. Se cierra la sesion completa por seguridad.
			await cliente.query(
				`UPDATE user_sessions
				 SET revoked_at = NOW(), revoked_reason = 'uso duplicado'
				 WHERE user_id = $1 AND revoked_at IS NULL`,
				[sesion.user_id],
			);
			throw new RefreshInvalidoError();
		}

		if (new Date(sesion.expires_at) <= new Date()) {
			await cliente.query(
				`UPDATE user_sessions SET revoked_at = NOW(), revoked_reason = 'expirado'
				 WHERE id = $1`,
				[sesion.id],
			);
			throw new RefreshInvalidoError();
		}

		const nuevoRefresh = generarRefreshToken();

		// Se revoca TODA sesion activa del dispositivo, no solo la que se
		// esta rotando. El indice unico es (user_id, device_id) WHERE
		// revoked_at IS NULL, asi que si quedara alguna activa el INSERT
		// reventaria por duplicado.
		//
		// IS NOT DISTINCT FROM y no "=" a proposito: la app vieja no manda
		// device_id, queda NULL, y "device_id = NULL" nunca es cierto.
		await cliente.query(
			`UPDATE user_sessions
			 SET revoked_at = NOW(), revoked_reason = 'rotado', last_seen_at = NOW()
			 WHERE user_id = $1 AND device_id IS NOT DISTINCT FROM $2 AND revoked_at IS NULL`,
			[sesion.user_id, sesion.device_id],
		);

		const { rows: nueva } = await cliente.query<{ id: string }>(
			`INSERT INTO user_sessions
				(user_id, token_hash, device_id, device_nombre, ip, user_agent, expires_at, deadline_at)
			 VALUES ($1, $2, $3, $4, $5, $6,
				        LEAST(NOW() + ($7::int * interval '1 day'), $8), $8)
			 RETURNING id`,
			[
				sesion.user_id,
				hashToken(nuevoRefresh),
				sesion.device_id,
				sesion.device_nombre,
				ip ?? sesion.ip,
				userAgent ?? sesion.user_agent,
				REFRESH_DIAS,
				sesion.deadline_at,
			],
		);

		await cliente.query("COMMIT");
		return {
			userId: sesion.user_id,
			sessionId: nueva[0].id,
			nuevoRefreshToken: nuevoRefresh,
		};
	} catch (err) {
		await cliente.query("ROLLBACK");
		throw err;
	} finally {
		cliente.release();
	}
}

/** Cierra la sesion identificada por su refresh token. Idempotente. */
export const revocarPorRefresh = async (
	refreshToken: string,
	reason = "logout",
): Promise<boolean> => {
	const { rowCount } = await pool.query(
		`UPDATE user_sessions SET revoked_at = NOW(), revoked_reason = $2
		 WHERE token_hash = $1 AND revoked_at IS NULL`,
		[hashToken(refreshToken), reason],
	);
	return (rowCount ?? 0) > 0;
};

/** Dispositivos con sesion activa del usuario. */
export const listarSesionesActivas = async (
	userId: string,
): Promise<SesionRow[]> => {
	const { rows } = await pool.query<SesionRow>(
		`SELECT * FROM user_sessions
		 WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()
		 ORDER BY last_seen_at DESC`,
		[userId],
	);
	return rows;
};

export class SesionNoEncontradaError extends Error {
	constructor() {
		super("La sesión no existe o ya fue cerrada");
		this.name = "SesionNoEncontradaError";
	}
}

/** Cierra una sesion puntual. Solo del propio usuario. */
export const revocarSesion = async (
	userId: string,
	sessionId: string,
): Promise<void> => {
	const { rowCount } = await pool.query(
		`UPDATE user_sessions SET revoked_at = NOW(), revoked_reason = 'logout'
		 WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL`,
		[sessionId, userId],
	);
	if (!rowCount) throw new SesionNoEncontradaError();
};

/** Cierra todas menos la actual. */
export const revocarOtrasSesiones = async (
	userId: string,
	sessionIdActual: string,
): Promise<number> => {
	const { rowCount } = await pool.query(
		`UPDATE user_sessions SET revoked_at = NOW(), revoked_reason = 'logout otra sesion'
		 WHERE user_id = $1 AND id <> $2 AND revoked_at IS NULL`,
		[userId, sessionIdActual],
	);
	return rowCount ?? 0;
};

/**
 * Limpieza periodica. Corre desde un job, no a mano.
 * Las revocadas hace mas de 30 dias ya no sirven para nada, y las que no se
 * usan hace 90 son de usuarios que ya no vuelven.
 */
export const limpiarSesiones = async (): Promise<{
	revocadasEliminadas: number;
	inactivasEliminadas: number;
}> => {
	const { rowCount: a } = await pool.query(
		`DELETE FROM user_sessions
		 WHERE revoked_at IS NOT NULL
		   AND revoked_at < NOW() - interval '30 days'`,
	);
	const { rowCount: b } = await pool.query(
		`DELETE FROM user_sessions
		 WHERE revoked_at IS NULL
		   AND last_seen_at < NOW() - interval '90 days'`,
	);
	return {
		revocadasEliminadas: a ?? 0,
		inactivasEliminadas: b ?? 0,
	};
};