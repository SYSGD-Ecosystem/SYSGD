import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { hasWorkspaceAccess } from "../middlewares/auth";
import {
	getInformeDisponibilidad,
	getReportesTurno,
	patchReporteTurno,
	postReporteTurno,
	putInformeDisponibilidad,
} from "../controllers/cont-turnos.controller";

/**
 * Turnos del vendedor sobre la nube. Servidor tonto a proposito: guarda y
 * devuelve paquetes cifrados, no calcula nada.
 *
 * Flujo:
 *   1. DUEÑO    PUT  .../informe-disponibilidad   publica la foto del estado
 *   2. VENDEDOR GET  .../informe-disponibilidad   la descarga (no el workspace)
 *   3. VENDEDOR POST .../reportes-turno           sube su turno ya cerrado
 *   4. DUEÑO    GET  .../reportes-turno           lista pendientes
 *   5. DUEÑO    PATCH .../reportes-turno/:id      marca FUSIONADO / RECHAZADO
 *
 * La fusion real la hace la app del dueno con el paquete descargado; el paso 5
 * solo deja constancia del resultado.
 *
 * Todas las rutas exigen isAuthenticated + hasWorkspaceAccess: nadie toca un
 * workspace del que no es dueno ni miembro.
 */
const router = Router();

router.use(isAuthenticated);

router.put(
	"/:id/informe-disponibilidad",
	hasWorkspaceAccess,
	putInformeDisponibilidad,
);
router.get(
	"/:id/informe-disponibilidad",
	hasWorkspaceAccess,
	getInformeDisponibilidad,
);

router.post("/:id/reportes-turno", hasWorkspaceAccess, postReporteTurno);
router.get("/:id/reportes-turno", hasWorkspaceAccess, getReportesTurno);
router.patch(
	"/:id/reportes-turno/:reporteId",
	hasWorkspaceAccess,
	patchReporteTurno,
);

export default router;