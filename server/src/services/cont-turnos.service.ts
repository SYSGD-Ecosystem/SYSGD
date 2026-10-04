import { pool } from "../db";
import { LedgerEncryptionService, type EncryptedData } from "./ledger-encryption.service";

/**
 * Estado del reporte de turno, desde el punto de vista del dueño.
 * PENDIENTE: el vendedor lo subio, el dueño aun no lo ha resuelto.
 * FUSIONADO: el dueño lo aplico a su maestro.
 * RECHAZADO: el dueño lo descarto.
 */
export type EstadoReporteTurno = "PENDIENTE" | "FUSIONADO" | "RECHAZADO";

export const ESTADOS_REPORTE_TURNO: EstadoReporteTurno[] = [
	"PENDIENTE",
	"FUSIONADO",
	"RECHAZADO",
];

export interface InformeDisponibilidad {
	/**
	 * Paquete cifrado tal como lo genero la app del dueño.
	 * Si no se envia, el servidor genera un UUID nuevo (foto nueva del estado).
	 */
	informe: unknown;
	/**
	 * UUID del informe. Solo enviarlo si se esta re-subiendo el MISMO informe
	 * (por ejemplo tras una reconexion a medias). Si se omite, se genera uno
	 * nuevo, que es el caso normal: el dueño regenera la foto del estado.
	 */
	informeId?: string | null;
	huella?: string | null;
	generadoEn?: string | null;
}

export interface ReporteTurnoSubido {
	/**
	 * Id del reporte (= id del turno en el vendedor). Permite reenviar sin duplicar.
	 *
	 * Debe ser el MISMO valor en todos los reenvios del mismo reporte: es lo que
	 * impide que un reporte ya aplicado se duplique.
	 */
	id: string;
	/** UUID del informe de disponibilidad sobre el que se trabajo. */
	informeOrigenId?: string | null;
	/** Hora/fecha de ese informe, para trazabilidad. */
	informeOrigenGeneradoEn?: string | null;
	vendedorId: string;
	vendedorNombre?: string;
	turnoId?: string | null;
	fechaTurno?: string | null;
	generadoEn?: string | null;
	/** Hechos del turno, cifrados. */
	paquete: unknown;
}

export interface ReporteTurnoListado {
	id: string;
	informeOrigenId: string | null;
	informeOrigenGeneradoEn: string | null;
	vendedorId: string;
	vendedorNombre: string;
	turnoId: string | null;
	fechaTurno: string | null;
	generadoEn: string | null;
	estado: EstadoReporteTurno;
	estadoNota: string | null;
	paquete: unknown;
	createdAt: string;
}

const decrypt = (raw: unknown): unknown => {
	if (LedgerEncryptionService.isEncryptedData(raw)) {
		try {
			return LedgerEncryptionService.decryptLedger(raw as EncryptedData);
		} catch (error) {
			console.error("Error descifrando paquete del reporte de turno:", error);
			return null;
		}
	}
	return raw;
};

/**
 * Sube (o reemplaza) el informe de disponibilidad de la ranura "master".
 *
 * El dueno lo regenera desde su espacio de trabajo activo. Se reemplaza entero a
 * proposito: es una foto del estado de hoy, no un historico. Los reportes de turno
 * son los que se acumulan; este no.
 */
export const guardarInformeDisponibilidad = async (
	workspaceId: string,
	userId: string,
	datos: InformeDisponibilidad,
): Promise<{ actualizado: boolean; informeId: string }> => {
	const cifrado = LedgerEncryptionService.encryptLedger(datos.informe);
	// Si no mandan id, la BD genera uno nuevo: es una foto nueva del estado.
	const { rows } = await pool.query<{ actualizado: boolean; informe_id: string }>(
		`
		INSERT INTO cont_informe_disponibilidad
			(workspace_id, informe_id, informe, generado_en, huella, subido_por)
		VALUES ($1, COALESCE($6::uuid, gen_random_uuid()), $2::jsonb, $3, $4, $5)
		ON CONFLICT (workspace_id) DO UPDATE SET
			informe_id = COALESCE($6::uuid, gen_random_uuid()),
			informe = EXCLUDED.informe,
			generado_en = EXCLUDED.generado_en,
			huella = EXCLUDED.huella,
			subido_por = EXCLUDED.subido_por,
			updated_at = NOW()
		RETURNING (xmax <> '0') AS actualizado, informe_id
		`,
		[
			workspaceId,
			JSON.stringify(cifrado),
			datos.generadoEn ?? null,
			datos.huella ?? null,
			userId,
			datos.informeId ?? null,
		],
	);

	return {
		actualizado: rows[0]?.actualizado === true,
		informeId: rows[0]?.informe_id ?? "",
	};
};

/**
 * Descarga la ranura "master" del informe de disponibilidad.
 * Devuelve null si el dueño todavia no ha subido ninguno.
 */
export const obtenerInformeDisponibilidad = async (
	workspaceId: string,
): Promise<{
	informeId: string;
	informe: unknown;
	huella: string | null;
	generadoEn: string | null;
	updatedAt: string;
} | null> => {
	const { rows } = await pool.query(
		`SELECT informe_id, informe, huella, generado_en, updated_at
		 FROM cont_informe_disponibilidad WHERE workspace_id = $1`,
		[workspaceId],
	);

	if (rows.length === 0) return null;

	return {
		informeId: rows[0].informe_id,
		informe: decrypt(rows[0].informe),
		huella: rows[0].huella ?? null,
		generadoEn: rows[0].generado_en ?? null,
		updatedAt: rows[0].updated_at,
	};
};

/**
 * Sube el reporte de un vendedor.
 *
 * Idempotente por (workspace_id, id): si el mismo reporte se reenvia, se
 * conserva el que ya estaba y no se duplica ni se pisa su estado. Eso permite
 * que el vendedor reintente sin miedo.
 */
export const subirReporteTurno = async (
	workspaceId: string,
	userId: string,
	datos: ReporteTurnoSubido,
): Promise<{ creado: boolean; yaExistia: boolean }> => {
	const cifrado = LedgerEncryptionService.encryptLedger(datos.paquete);
	const { rows } = await pool.query<{ creado: boolean }>(
		`
		INSERT INTO cont_reportes_turno
			(id, workspace_id, informe_origen_id, informe_origen_generado_en,
			 vendedor_id, vendedor_nombre, turno_id, fecha_turno,
			 generado_en, estado, paquete, subido_por)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDIENTE', $10::jsonb, $11)
		ON CONFLICT (workspace_id, id) DO NOTHING
		RETURNING true AS creado
		`,
		[
			datos.id,
			workspaceId,
			datos.informeOrigenId ?? null,
			datos.informeOrigenGeneradoEn ?? null,
			datos.vendedorId,
			datos.vendedorNombre ?? "",
			datos.turnoId ?? null,
			datos.fechaTurno ?? null,
			datos.generadoEn ?? null,
			JSON.stringify(cifrado),
			userId,
		],
	);

	const creado = rows.length > 0;
	return { creado, yaExistia: !creado };
};

/** Lista los reportes de un workspace. Sin `estado`, devuelve todos; con ella, filtra. */
export const listarReportesTurno = async (
	workspaceId: string,
	estado?: EstadoReporteTurno,
): Promise<ReporteTurnoListado[]> => {
	const { rows } = await pool.query(
		`SELECT id, informe_origen_id, informe_origen_generado_en,
		        vendedor_id, vendedor_nombre, turno_id, fecha_turno, generado_en,
		        estado, estado_nota, paquete, created_at
		 FROM cont_reportes_turno
		 WHERE workspace_id = $1
		   AND ($2::text IS NULL OR estado = $2)
		 ORDER BY created_at DESC`,
		[workspaceId, estado ?? null],
	);

	return rows.map((row) => ({
		id: row.id,
		informeOrigenId: row.informe_origen_id ?? null,
		informeOrigenGeneradoEn: row.informe_origen_generado_en ?? null,
		vendedorId: row.vendedor_id,
		vendedorNombre: row.vendedor_nombre ?? "",
		turnoId: row.turno_id ?? null,
		fechaTurno: row.fecha_turno ?? null,
		generadoEn: row.generado_en ?? null,
		estado: row.estado as EstadoReporteTurno,
		estadoNota: row.estado_nota ?? null,
		paquete: decrypt(row.paquete),
		createdAt: row.created_at,
	}));
};

export class ReporteTurnoNoEncontradoError extends Error {
	constructor() {
		super("El reporte de turno no existe en este espacio de trabajo");
		this.name = "ReporteTurnoNoEncontradoError";
	}
}

/**
 * Cambia el estado de un reporte. Solo el dueño lo resuelve (FUSIONADO / RECHAZADO);
 * PENDIENTE no es un destino valido desde aqui, se usa al crear.
 */
export const resolverReporteTurno = async (
	workspaceId: string,
	reporteId: string,
	estado: EstadoReporteTurno,
	nota: string | null,
	userId: string,
): Promise<{ actualizado: boolean }> => {
	if (estado === "PENDIENTE") {
		throw new Error("Un reporte no puede volver a PENDIENTE desde aqui");
	}
	const { rows } = await pool.query<{ actualizado: boolean }>(
		`
		UPDATE cont_reportes_turno
		SET estado = $3,
		    estado_nota = $4,
		    resuelto_por = $5,
		    resuelto_en = NOW(),
		    updated_at = NOW()
		WHERE workspace_id = $1 AND id = $2
		RETURNING true AS actualizado
		`,
		[workspaceId, reporteId, estado, nota, userId],
	);

	return { actualizado: rows.length > 0 };
};