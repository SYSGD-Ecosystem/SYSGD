import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth-jwt";
import {
	getContLedger,
	getContLedgerVersion,
	saveContLedger,
} from "../controllers/cont-ledger.controller";

const router = Router();

router.use(isAuthenticated);

router.get("/version", getContLedgerVersion);
router.get("/", getContLedger);
router.put("/", saveContLedger);

export default router;
