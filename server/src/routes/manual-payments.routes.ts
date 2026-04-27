import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth-jwt";
import {
	createCurrentUserManualPaymentOrder,
	getAdminManualPaymentOrders,
	getCurrentUserManualPaymentOrders,
	getManualPaymentCatalog,
	reviewAdminManualPaymentOrder,
} from "../controllers/manual-payment.controller";

const router = Router();

router.use(isAuthenticated);

router.get("/products", getManualPaymentCatalog);
router.get("/orders", getCurrentUserManualPaymentOrders);
router.post("/orders", createCurrentUserManualPaymentOrder);
router.get("/admin/orders", getAdminManualPaymentOrders);
router.put("/admin/orders/:id/review", reviewAdminManualPaymentOrder);

export default router;
