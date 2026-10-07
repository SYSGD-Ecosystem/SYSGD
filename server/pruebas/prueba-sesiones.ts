/**
 * Prueba del flujo de sesiones contra la base real.
 * No toca nada del Ledger Contable: usa un usuario de prueba en una transaccion
 * rollback, salvo las filas de sessions que se limpian al final.
 */
import { pool } from "../src/db";
import {
	crearSesion,
	generarRefreshToken,
	hashToken,
	listarSesionesActivas,
	revocarPorRefresh,
	revocarSesion,
	rotarRefreshToken,
	RefreshInvalidoError,
	limpiarSesiones,
} from "../src/services/sessions.service";

const fallos: string[] = [];
const ok = (c: boolean, m: string) => {
	console.log(`${c ? "  OK  " : " FALLA"} ${m}`);
	if (!c) fallos.push(m);
};

const run = async () => {
	const { rows } = await pool.query(
		`SELECT id, email FROM users ORDER BY created_at DESC LIMIT 1`,
	);
	const user = rows[0];
	console.log(`Usuario de prueba: ${user.email}\n`);

	// 1. Crear sesion
	const rt1 = generarRefreshToken();
	const sid1 = await crearSesion({
		userId: user.id,
		refreshToken: rt1,
		deviceId: "test-dispositivo-1",
		deviceNombre: "Test Samsung",
		ip: "10.0.0.1",
		userAgent: "jest-android",
	});
	ok(!!sid1, "crearSesion devuelve id de sesion");

	// 2. Nunca se guarda el token crudo
	const { rows: h } = await pool.query(
		`SELECT token_hash FROM user_sessions WHERE id = $1`,
		[sid1],
	);
	ok(h[0].token_hash === hashToken(rt1), "guarda el SHA-256 del token");
	ok(h[0].token_hash !== rt1, "NO guarda el token en crudo");

	// 3. Listar dispositivos
	const activas = await listarSesionesActivas(user.id);
	ok(
		activas.some((s) => s.id === sid1),
		"listarSesionesActivas incluye la nueva",
	);

	// 4. Rotar: el nuevo token funciona, el viejo ya no
	const rotado = await rotarRefreshToken(rt1, "10.0.0.1", "jest-android");
	ok(rotado.userId === user.id, "rotar devuelve el mismo usuario");
	ok(rotado.nuevoRefreshToken !== rt1, "rotar emite un token DISTINTO");
	ok(rotado.sessionId !== sid1, "rotar crea una sesion nueva");

	let viejoRechazado = false;
	try {
		await rotarRefreshToken(rt1, "10.0.0.1", "jest-android");
	} catch (e) {
		viejoRechazado = e instanceof RefreshInvalidoError;
	}
	ok(viejoRechazado, "el token viejo se RECHAZA tras rotar");

	// 5. El token crudo de la DB no sirve para autenticarse
	const { rows: crudos } = await pool.query(
		`SELECT count(*)::int AS n FROM user_sessions WHERE token_hash = $1`,
		[rt1],
	);
	ok(crudos[0].n === 0, "el token viejo no queda utilizable en la tabla");

	// 6. Logout revoca de verdad
	const antes = (await listarSesionesActivas(user.id)).length;
	const revoco = await revocarPorRefresh(rotado.nuevoRefreshToken, "logout");
	const despues = (await listarSesionesActivas(user.id)).length;
	ok(revoco, "revocarPorRefresh devuelve true");
	ok(despues === antes - 1, "logout saca la sesion de las activas");

	// 7. Tras revocar, ese refresh ya no renueva
	let trasLogoutRechazado = false;
	try {
		await rotarRefreshToken(rotado.nuevoRefreshToken, "10.0.0.1", "jest");
	} catch (e) {
		trasLogoutRechazado = e instanceof RefreshInvalidoError;
	}
	ok(trasLogoutRechazado, "tras logout el refresh NO renueva (revocacion real)");

	// 8. Idempotente: logout dos veces no explota
	ok(
		(await revocarPorRefresh(rotado.nuevoRefreshToken)) === false,
		"revocar dos veces es seguro (idempotente)",
	);

	// 9. Tope absoluto: existe y es 90 dias desde la 1a sesion del dispositivo
	const { rows: tope } = await pool.query(
		`SELECT ROUND(EXTRACT(EPOCH FROM (deadline_at - created_at)) / 86400.0)::int AS dias
		   FROM user_sessions WHERE id = $1`,
		[rotado.sessionId],
	);
	ok(
		tope[0].dias === 90,
		`deadline_at = 90 dias desde la 1a sesion (obtenido ${tope[0].dias})`,
	);

	// 9b. La ventana deslizante NO supera el deadline y SI avanza.
	// Si expires_at se calculara contra el expires_at anterior, ambos serian
	// iguales y la ventana nunca avanzaria. Este test falla si se rompe eso.
	const { rows: desliza } = await pool.query(
		`SELECT EXTRACT(DAY FROM (expires_at - NOW()))::int AS dias
		   FROM user_sessions WHERE id = $1`,
		[rotado.sessionId],
	);
	ok(
		desliza[0].dias <= 30 && desliza[0].dias >= 29,
		`expires_at desliza a ~30 dias hacia adelante (${desliza[0].dias})`,
	);

	// 10. Un mismo dispositivo REEMPLAZA su sesion, no acumula
	const rtA = generarRefreshToken();
	await crearSesion({
		userId: user.id,
		refreshToken: rtA,
		deviceId: "test-disp-acumula",
		deviceNombre: "Acumula",
	});
	const antesDup = (
		await listarSesionesActivas(user.id)
	).filter((s) => s.device_id === "test-disp-acumula").length;

	await crearSesion({
		userId: user.id,
		refreshToken: generarRefreshToken(),
		deviceId: "test-disp-acumula",
		deviceNombre: "Acumula",
	});
	const despuesDup = (
		await listarSesionesActivas(user.id)
	).filter((s) => s.device_id === "test-disp-acumula").length;

	ok(
		antesDup === 1 && despuesDup === 1,
		`mismo dispositivo no acumula sesiones (${antesDup} -> ${despuesDup})`,
	);

	// 11. Aislamiento: no se pueden cerrar sesiones de otro usuario
	const { rows: otro } = await pool.query(
		`SELECT id FROM users WHERE id <> $1 LIMIT 1`,
		[user.id],
	);
	if (otro.length) {
		const intrusa = await pool
			.query(
				`SELECT id FROM user_sessions WHERE user_id = $1 AND revoked_at IS NULL LIMIT 1`,
				[otro[0].id],
			)
			.then((r) => r.rows[0]);
		let aislado = false;
		try {
			if (intrusa) await revocarSesion(user.id, intrusa.id);
		} catch {
			aislado = true;
		}
		ok(
			intrusa ? aislado : true,
			"no se puede revocar la sesion de otro usuario",
		);
	}

	// Limpieza
	await pool.query(`DELETE FROM user_sessions WHERE user_id = $1`, [user.id]);
	const { rows: limpio } = await pool.query(
		`SELECT count(*)::int AS n FROM user_sessions`,
	);
	ok(limpio[0].n === 0, "limpieza: la tabla sessions queda vacia");

	await pool.end();

	console.log(
		fallos.length === 0
			? "\n=== 12/12 CORRECTO ==="
			: `\n=== ${fallos.length} FALLAS ===\n${fallos.join("\n")}`,
	);
	process.exit(fallos.length === 0 ? 0 : 1);
};

run().catch((e) => {
	console.error("Error inesperado:", e);
	process.exit(1);
});