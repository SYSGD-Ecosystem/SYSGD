import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth-jwt";
import {
	getAdminAppReleases,
	getPublicAppRelease,
	upsertAdminAppRelease,
} from "../controllers/app-releases.controller";

const router = Router();

// Versiones publicadas de las apps: la web (sección Aplicaciones) y la app
// (aviso de actualización) consumen el GET público; el admin publica con PUT.
router.get("/:appKey", getPublicAppRelease);

router.use(isAuthenticated);
router.get("/", getAdminAppReleases);
router.put("/:appKey", upsertAdminAppRelease);

export default router;
