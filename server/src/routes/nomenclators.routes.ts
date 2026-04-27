import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth-jwt";
import {
	listAccountingCategoriesController,
	listAccountingSubcategoriesController,
	searchAccountingCatalogController,
	searchCnaeCatalogController,
} from "../controllers/nomenclators.controller";

const router = Router();

router.use(isAuthenticated);

router.get("/accounting/categories", listAccountingCategoriesController);
router.get("/accounting/subcategories", listAccountingSubcategoriesController);
router.get("/accounting/search", searchAccountingCatalogController);
router.get("/cnae/search", searchCnaeCatalogController);

export default router;
