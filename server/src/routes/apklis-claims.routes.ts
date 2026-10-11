import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth-jwt";
import {
	createCurrentUserApklisClaimOrder,
	getAdminApklisClaimOrders,
	getApklisClaimCatalog,
	getCurrentUserApklisClaimOrders,
	reviewAdminApklisClaimOrder,
} from "../controllers/apklis-claim.controller";

const router = Router();

router.use(isAuthenticated);

// Solicitud de plan Pro para SYSGD Ecosystem por compra de licencia en Apklis
// (Gestor Contable TCP). La licencia da Pro local; el plan en servidor solo
// nace de este reclamo con verificación manual (Decisión 13).
router.get("/products", getApklisClaimCatalog);
router.get("/orders", getCurrentUserApklisClaimOrders);
router.post("/orders", createCurrentUserApklisClaimOrder);
router.get("/admin/orders", getAdminApklisClaimOrders);
router.put("/admin/orders/:id/review", reviewAdminApklisClaimOrder);

export default router;
