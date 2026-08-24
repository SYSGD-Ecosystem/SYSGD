import { Router, type Request } from "express";
import { pool } from "../db";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { hasWorkspaceAccess } from "../middlewares/auth";
import {
	listWorkspacesForUser,
	getWorkspaceForUser,
	createWorkspace,
	renameWorkspace,
	deleteWorkspace,
	getWorkspaceLedger,
	saveWorkspaceLedger,
	WorkspaceConflictError,
	listWorkspaceMembers,
	inviteWorkspaceMember,
	removeWorkspaceMember,
} from "../services/cont-workspaces.service";

const router = Router();

type AuthedRequest = Request & { user?: { id: string; privileges?: string } };

function userIdDe(req: Request): string | undefined {
	return (req as AuthedRequest).user?.id;
}

// Límite blando de espacios propios; ajustar cuando se integre con planes.
const MAX_WORKSPACES_PROPIOS = 10;

router.use(isAuthenticated);

// GET /api/cont-workspaces — propios + compartidos
router.get("/", async (req, res) => {
	try {
		const userId = userIdDe(req);
		if (!userId) {
			res.status(401).json({ error: "Usuario no autenticado" });
			return;
		}
		const workspaces = await listWorkspacesForUser(userId);
		res.json(workspaces);
	} catch (error) {
		console.error("Error listando workspaces:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// POST /api/cont-workspaces — crear espacio propio
router.post("/", async (req, res) => {
	try {
		const userId = userIdDe(req);
		if (!userId) {
			res.status(401).json({ error: "Usuario no autenticado" });
			return;
		}

		const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
		if (!name) {
			res.status(400).json({ error: "El nombre del espacio es obligatorio" });
			return;
		}

		const { rows } = await pool.query<{ count: string }>(
			`SELECT COUNT(*) FROM cont_workspaces WHERE owner_id = $1`,
			[userId],
		);
		if (parseInt(rows[0].count, 10) >= MAX_WORKSPACES_PROPIOS) {
			res.status(403).json({
				error: `Alcanzaste el límite de ${MAX_WORKSPACES_PROPIOS} espacios de trabajo`,
			});
			return;
		}

		const workspace = await createWorkspace(userId, name);
		res.status(201).json(workspace);
	} catch (error) {
		console.error("Error creando workspace:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// Middleware común: existencia + membresía
router.use("/:id", hasWorkspaceAccess);

// GET /api/cont-workspaces/:id — meta + rol del solicitante
router.get("/:id", async (req, res) => {
	try {
		const userId = userIdDe(req);
		const workspace = await getWorkspaceForUser(req.params.id, userId!);
		res.json(workspace);
	} catch (error) {
		console.error("Error obteniendo workspace:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// PUT /api/cont-workspaces/:id/name
router.put("/:id/name", async (req, res) => {
	try {
		const userId = userIdDe(req);
		const workspace = await getWorkspaceForUser(req.params.id, userId!);
		if (!workspace || !["owner", "admin"].includes(workspace.role)) {
			res.status(403).json({ error: "Solo el dueño o un admin puede renombrar" });
			return;
		}
		const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
		if (!name) {
			res.status(400).json({ error: "El nombre es obligatorio" });
			return;
		}
		await renameWorkspace(req.params.id, name);
		res.json({ message: "Espacio actualizado" });
	} catch (error) {
		console.error("Error renombrando workspace:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// DELETE /api/cont-workspaces/:id — solo dueño/admin global
router.delete("/:id", async (req, res) => {
	try {
		const user = (req as AuthedRequest).user;
		const workspace = await getWorkspaceForUser(req.params.id, user!.id);
		const isGlobalAdmin = user?.privileges === "admin";
		if (!workspace || (workspace.role !== "owner" && !isGlobalAdmin)) {
			res.status(403).json({ error: "Solo el dueño puede eliminar el espacio" });
			return;
		}
		await deleteWorkspace(req.params.id);
		res.json({ message: "Espacio eliminado" });
	} catch (error) {
		console.error("Error eliminando workspace:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// GET /api/cont-workspaces/:id/ledger — blob descifrado + versión
router.get("/:id/ledger", async (req, res) => {
	try {
		const data = await getWorkspaceLedger(req.params.id);
		if (!data) {
			res.status(404).json({ error: "Espacio no encontrado" });
			return;
		}
		res.json(data);
	} catch (error) {
		console.error("Error leyendo ledger del workspace:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// PUT /api/cont-workspaces/:id/ledger — escritura optimista {registro, expectedVersion?}
router.put("/:id/ledger", async (req, res) => {
	try {
		const registro = req.body?.registro;
		if (typeof registro === "undefined") {
			res.status(400).json({ error: "Falta el campo registro" });
			return;
		}
		const expectedVersion =
			typeof req.body?.expectedVersion === "string"
				? req.body.expectedVersion
				: undefined;

		const result = await saveWorkspaceLedger(
			req.params.id,
			registro,
			expectedVersion,
		);
		res.json(result);
	} catch (error) {
		if (error instanceof WorkspaceConflictError) {
			res.status(409).json({
				error: "version_conflict",
				serverVersion: error.serverVersion,
			});
			return;
		}
		const status = (error as { statusCode?: number })?.statusCode ?? 500;
		res.status(status).json({
			error: status === 404 ? "Espacio no encontrado" : "Error interno del servidor",
		});
	}
});

// ── Miembros ────────────────────────────────────────────────

// GET /api/cont-workspaces/:id/members
router.get("/:id/members", async (req, res) => {
	try {
		const members = await listWorkspaceMembers(req.params.id);
		res.json(members);
	} catch (error) {
		console.error("Error listando miembros:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

// POST /api/cont-workspaces/:id/members/invite {email, role}
// La aceptación usa el endpoint genérico existente:
// POST /api/members/accept-invite/:invitationId
router.post("/:id/members/invite", async (req, res) => {
	try {
		const user = (req as AuthedRequest).user;
		const workspace = await getWorkspaceForUser(req.params.id, user!.id);
		if (!workspace || !["owner", "admin"].includes(workspace.role)) {
			res.status(403).json({
				error: "Solo el dueño o un admin puede invitar miembros",
			});
			return;
		}
		const email =
			typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
		if (!email || !email.includes("@")) {
			res.status(400).json({ error: "Email inválido" });
			return;
		}
		await inviteWorkspaceMember(
			req.params.id,
			user!.id,
			email,
			req.body?.role,
		);
		res.status(201).json({ message: "Invitación creada" });
	} catch (error) {
		console.error("Error invitando miembro:", error);
		res.status(500).json({ error: "Error al invitar al usuario" });
	}
});

// DELETE /api/cont-workspaces/:id/members/:userId
router.delete("/:id/members/:userId", async (req, res) => {
	try {
		const user = (req as AuthedRequest).user;
		const workspace = await getWorkspaceForUser(req.params.id, user!.id);
		if (!workspace || workspace.role !== "owner") {
			res.status(403).json({ error: "Solo el dueño puede quitar miembros" });
			return;
		}
		if (req.params.userId === workspace.ownerId) {
			res.status(400).json({ error: "El dueño no puede ser removido" });
			return;
		}
		await removeWorkspaceMember(req.params.id, req.params.userId);
		res.json({ message: "Miembro removido" });
	} catch (error) {
		console.error("Error quitando miembro:", error);
		res.status(500).json({ error: "Error interno del servidor" });
	}
});

export default router;
