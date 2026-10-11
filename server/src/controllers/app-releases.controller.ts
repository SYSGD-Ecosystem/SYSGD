import type { Request, Response } from "express";
import { z } from "zod";
import { getCurrentUserData } from "./users";
import {
	getAppRelease,
	listAppReleases,
	upsertAppRelease,
} from "../services/app-releases.service";

const APP_KEY_RE = /^[a-z0-9-]{1,64}$/;

const upsertAppReleaseSchema = z.object({
	displayName: z.string().min(1).max(120).optional(),
	downloadUrl: z.string().url().max(2000),
	changelog: z.string().max(10000),
	versionName: z.string().min(1).max(64),
	versionCode: z.number().int().positive(),
});

const checkAppKey = (res: Response, appKey: unknown): appKey is string => {
	if (typeof appKey !== "string" || !APP_KEY_RE.test(appKey)) {
		res.status(400).json({ error: "appKey inválido" });
		return false;
	}
	return true;
};

/** GET /api/app-releases/:appKey — PÚBLICO (web + app sin sesión). */
export const getPublicAppRelease = async (req: Request, res: Response) => {
	const appKey = req.params.appKey;
	if (!checkAppKey(res, appKey)) return;

	try {
		const release = await getAppRelease(appKey);
		if (!release) {
			res.status(404).json({ error: "Sin versión publicada" });
			return;
		}
		res.json(release);
	} catch (error) {
		console.error("Error al obtener release:", error);
		res.status(500).json({ error: "Error al obtener versión" });
	}
};

/** GET /api/app-releases — admin: lista todo lo publicado. */
export const getAdminAppReleases = async (req: Request, res: Response) => {
	const user = getCurrentUserData(req);
	if (!user || user.privileges !== "admin") {
		res.status(403).json({ error: "No autorizado" });
		return;
	}

	try {
		res.json({ releases: await listAppReleases() });
	} catch (error) {
		console.error("Error al listar releases:", error);
		res.status(500).json({ error: "Error al listar versiones" });
	}
};

/** PUT /api/app-releases/:appKey — admin: publica/actualiza versión. */
export const upsertAdminAppRelease = async (req: Request, res: Response) => {
	const user = getCurrentUserData(req);
	if (!user || user.privileges !== "admin") {
		res.status(403).json({ error: "No autorizado" });
		return;
	}

	const appKey = req.params.appKey;
	if (!checkAppKey(res, appKey)) return;

	const parsed = upsertAppReleaseSchema.safeParse(req.body);
	if (!parsed.success) {
		res.status(400).json({ error: "Datos de versión inválidos" });
		return;
	}

	try {
		const release = await upsertAppRelease(appKey, user.id, parsed.data);
		res.json({ release });
	} catch (error) {
		console.error("Error al publicar versión:", error);
		res.status(500).json({ error: "Error al publicar versión" });
	}
};
