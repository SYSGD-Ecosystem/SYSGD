import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth-jwt";
import {
	createAccountingDocumentController,
	generateTcpPdfController,
	getAccountingDocumentController,
	listAccountingDocuments,
	saveAccountingDocumentController,
} from "../controllers/accounting-documents.controller";

const router = Router();

router.use(isAuthenticated);
router.get("/", listAccountingDocuments);
router.post("/", createAccountingDocumentController);
router.post("/pdf/tcp", generateTcpPdfController);
router.get("/:id", getAccountingDocumentController);
router.put("/:id", saveAccountingDocumentController);

export default router;
