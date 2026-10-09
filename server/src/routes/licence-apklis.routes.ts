import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { activateApklisLicenceHandler } from "../controllers/licence-apklis.controller";

const router = Router();

router.use(isAuthenticated);

// La app Android (edición Apklis) notifica la compra de una licencia para que
// el servidor central active el Plan Pro de forma idempotente.
router.post("/apklis/activate", activateApklisLicenceHandler);

export default router;
