import type { Request, Response } from "express";
import {
	ESTADOS_REPORTE_TURNO,
	guardarInformeDisponibilidad,
	listarReportesTurno,
	obtenerInformeDisponibilidad,
	resolverReporteTurno,
	subirReporteTurno,
	type EstadoReporteTurno,
} from "../services/cont-turnos.service";

const getCurrentUserId = (req: Request): string | undefined => {
	const user = (req as Request & { user?: { id?: string } }).user;
	return user?.id;
};

/** Los params de Express pueden venir como string[]; el id siempre es uno solo. */
const getWorkspaceId = (req: Request): string =>
	String(req.params.id || req.params.workspaceId || "");

const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const esUuid = (valor: unknown): valor is string =>
	typeof valor === "string" && UUID_RE.test(valor);

/**
 * DUEÑO: sube (o regenera) la foto del estado para los vendedores de su
 * espacio de trabajo. Esta es la "ranura master" de la que beben los vendedores.
 *
 * El cuerpo viaja cifrado; el servidor no lo lee.
 */
export const putInformeDisponibilidad = async (
	req: Request,
	res: Response,
) => {
	const userId = getCurrentUserId(req);
	if (!userId) {
		res.status(401).json({ error: "Usuario no autenticado" });
		return;
	}
	const workspaceId = getWorkspaceId(req);
	const body = req.body as {
		informe?: unknown;
		informeId?: string;
		huella?: string;
		generadoEn?: string;
	};

	if (typeof body.informe === "undefined") {
		res.status(400).json({ error: "Falta el campo informe" });
		return;
	}
	if (body.informeId !== undefined && body.informeId !== null && !esUuid(body.informeId)) {
		res.status(400).json({ error: "informeId no es un UUID valido" });
		return;
	}

	try {
		const resultado = await guardarInformeDisponibilidad(workspaceId, userId, {
			informe: body.informe,
			informeId: body.informeId ?? null,
			huella: body.huella ?? null,
			generadoEn: body.generadoEn ?? null,
		});
		res.json(resultado);
	} catch (error) {
		console.error("Error guardando informe de disponibilidad:", error);
		res.status(500).json({ error: "Error al guardar el informe de disponibilidad" });
	}
};

/**
 * VENDEDOR: descarga la foto del estado. No descarga el espacio de trabajo,
 * solo el informe. Si el dueño aun no publico ninguno, responde 404.
 */
export const getInformeDisponibilidad = async (
	req: Request,
	res: Response,
) => {
	const workspaceId = getWorkspaceId(req);
	try {
		const informe = await obtenerInformeDisponibilidad(workspaceId);
		if (!informe) {
			res.status(404).json({ error: "El negocio aun no ha publicado el informe de disponibilidad" });
			return;
		}
		res.json(informe);
	} catch (error) {
		console.error("Error obteniendo informe de disponibilidad:", error);
		res.status(500).json({ error: "Error al obtener el informe de disponibilidad" });
	}
};

/**
 * VENDEDOR: sube el reporte de su turno ya cerrado.
 *
 * Idempotente por id: si el mismo reporte llega dos veces (por varias vias o
 * porque hubo reintento), el servidor conserva el primero y no duplica.
 */
export const postReporteTurno = async (req: Request, res: Response) => {
	const userId = getCurrentUserId(req);
	if (!userId) {
		res.status(401).json({ error: "Usuario no autenticado" });
		return;
	}
	const workspaceId = getWorkspaceId(req);
	const body = req.body as {
		id?: string;
		informeOrigenId?: string;
		informeOrigenGeneradoEn?: string;
		vendedorId?: string;
		vendedorNombre?: string;
		turnoId?: string;
		fechaTurno?: string;
		generadoEn?: string;
		paquete?: unknown;
	};

	if (!esUuid(body.id)) {
		res.status(400).json({ error: "Falta el id del reporte o no es un UUID valido" });
		return;
	}
	if (typeof body.vendedorId !== "string" || body.vendedorId.trim() === "") {
		res.status(400).json({ error: "Falta el vendedorId" });
		return;
	}
	if (typeof body.paquete === "undefined") {
		res.status(400).json({ error: "Falta el campo paquete" });
		return;
	}
	if (
		body.informeOrigenId !== undefined &&
		body.informeOrigenId !== null &&
		!esUuid(body.informeOrigenId)
	) {
		res.status(400).json({ error: "informeOrigenId no es un UUID valido" });
		return;
	}

	try {
		const resultado = await subirReporteTurno(workspaceId, userId, {
			id: body.id,
			informeOrigenId: body.informeOrigenId ?? null,
			informeOrigenGeneradoEn: body.informeOrigenGeneradoEn ?? null,
			vendedorId: body.vendedorId,
			vendedorNombre: body.vendedorNombre ?? "",
			turnoId: body.turnoId ?? null,
			fechaTurno: body.fechaTurno ?? null,
			generadoEn: body.generadoEn ?? null,
			paquete: body.paquete,
		});
		res.status(resultado.creado ? 201 : 200).json(resultado);
	} catch (error) {
		console.error("Error subiendo reporte de turno:", error);
		res.status(500).json({ error: "Error al subir el reporte de turno" });
	}
};

/** DUEÑO: lista los reportes de su workspace, opcionalmente por estado. */
export const getReportesTurno = async (req: Request, res: Response) => {
	const workspaceId = getWorkspaceId(req);
	const estado = req.query.estado as string | undefined;

	if (estado !== undefined && !ESTADOS_REPORTE_TURNO.includes(estado as EstadoReporteTurno)) {
		res.status(400).json({
			error: `Estado invalido. Valores permitidos: ${ESTADOS_REPORTE_TURNO.join(", ")}`,
		});
		return;
	}

	try {
		const reportes = await listarReportesTurno(
			workspaceId,
			estado as EstadoReporteTurno | undefined,
		);
		res.json({ reportes });
	} catch (error) {
		console.error("Error listando reportes de turno:", error);
		res.status(500).json({ error: "Error al listar los reportes de turno" });
	}
};

/**
 * DUEÑO: marca un reporte como FUSIONADO o RECHAZADO.
 *
 * Importante: esto NO fusiona nada. La fusion real la hace la app del dueño con
 * el paquete ya descargado, usando la logica de inventario que ya existe y esta
 * probada. Aqui solo se registra la resolucion, para que el vendedor sepa que
 * paso con su turno.
 */
export const patchReporteTurno = async (req: Request, res: Response) => {
	const userId = getCurrentUserId(req);
	if (!userId) {
		res.status(401).json({ error: "Usuario no autenticado" });
		return;
	}
	const workspaceId = getWorkspaceId(req);
	const reporteId = String(req.params.reporteId || "");
	const body = req.body as { estado?: string; nota?: string };

	if (!esUuid(reporteId)) {
		res.status(400).json({ error: "reporteId no es un UUID valido" });
		return;
	}
	if (
		body.estado !== "FUSIONADO" &&
		body.estado !== "RECHAZADO"
	) {
		res.status(400).json({ error: "estado debe ser FUSIONADO o RECHAZADO" });
		return;
	}

	try {
		const resultado = await resolverReporteTurno(
			workspaceId,
			reporteId,
			body.estado,
			body.nota ?? null,
			userId,
		);
		if (!resultado.actualizado) {
			res.status(404).json({ error: "El reporte no existe en este espacio de trabajo" });
			return;
		}
		res.json(resultado);
	} catch (error) {
		console.error("Error resolviendo reporte de turno:", error);
		res.status(500).json({ error: "Error al resolver el reporte de turno" });
	}
};