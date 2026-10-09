import type { Request, Response } from "express";
import { z } from "zod";
import { getCurrentUserData } from "./users";
import {
	activateApklisLicence,
	isApklisPackage,
	isKnownApklisLicence,
} from "../services/licence-apklis.service";

const activateApklisLicenceSchema = z.object({
	apklis_license_uuid: z.string().min(1),
	apklis_license_name: z.string().min(1).max(120).optional(),
	apklis_license_days: z.coerce.number().int().positive().max(730),
	apklis_license: z.string().min(1).max(4096),
	apklis_username: z.string().min(1).max(255),
	purchased_at: z.coerce.number().int().nonnegative().optional(),
	package_name: z.string().min(1).max(255).optional(),
});

/**
 * POST /api/licence/apklis/activate
 *
 * La app Android (edición Apklis) avisa de una compra de licencia para que el
 * servidor central active el Plan Pro. Idempotente por `(user_id, apklis_license)`.
 */
export const activateApklisLicenceHandler = async (req: Request, res: Response) => {
	const user = getCurrentUserData(req);
	if (!user?.id) {
		res.status(401).json({ error: "Usuario no autenticado" });
		return;
	}

	const parsed = activateApklisLicenceSchema.safeParse(req.body);
	if (!parsed.success) {
		res.status(400).json({ error: "Datos de licencia Apklis inválidos", details: parsed.error.flatten() });
		return;
	}

	const payload = parsed.data;

	if (!isKnownApklisLicence(payload.apklis_license_uuid)) {
		res.status(400).json({ error: "Licencia Apklis no reconocida" });
		return;
	}

	if (payload.package_name && !isApklisPackage(payload.package_name)) {
		res.status(400).json({ error: "Paquete no válido para licencia Apklis" });
		return;
	}

	try {
		const result = await activateApklisLicence(user.id, {
			apklisLicenceUuid: payload.apklis_license_uuid,
			apklisLicenceName: payload.apklis_license_name ?? "",
			apklisLicenceDays: payload.apklis_license_days,
			apklisLicense: payload.apklis_license,
			apklisUsername: payload.apklis_username,
			purchasedAt: payload.purchased_at ?? 0,
			packageName: payload.package_name,
		});

		res.json({
			ok: true,
			alreadyActivated: result.alreadyActivated,
			tier: result.tier,
			planValidity: result.planValidity,
		});
	} catch (error) {
		console.error("Error al activar licencia Apklis:", error);
		res.status(500).json({ error: "No se pudo activar la licencia Apklis" });
	}
};
