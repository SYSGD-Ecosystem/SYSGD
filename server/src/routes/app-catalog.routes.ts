import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth-jwt";
import {
	createAdminApp,
	createAdminAppArticle,
	createAdminAppCategory,
	deleteAdminApp,
	deleteAdminAppArticle,
	deleteAdminAppCategory,
	deleteAdminAppReview,
	deleteOwnReview,
	getAdminAppCategories,
	getAdminAppReviews,
	getAdminApps,
	getPublicApp,
	getPublicAppArticle,
	getPublicAppArticles,
	getPublicAppReviews,
	getPublicApps,
	updateAdminApp,
	updateAdminAppArticle,
	upsertOwnReview,
} from "../controllers/app-catalog.controller";

const router = Router();

// Administración primero: si van después de /:slug, Express las confunde
// con un slug ("admin") y nunca llegan al handler.
router.get("/admin/list", isAuthenticated, getAdminApps);
router.post("/admin", isAuthenticated, createAdminApp);
router.put("/admin/:id", isAuthenticated, updateAdminApp);
router.delete("/admin/:id", isAuthenticated, deleteAdminApp);
router.get("/admin/:id/categories", isAuthenticated, getAdminAppCategories);
router.post("/admin/:id/categories", isAuthenticated, createAdminAppCategory);
router.delete(
	"/admin/categories/:categoryId",
	isAuthenticated,
	deleteAdminAppCategory,
);
router.post("/admin/:id/articles", isAuthenticated, createAdminAppArticle);
router.put("/admin/articles/:articleId", isAuthenticated, updateAdminAppArticle);
router.delete(
	"/admin/articles/:articleId",
	isAuthenticated,
	deleteAdminAppArticle,
);
router.get("/admin/:slug/reviews", isAuthenticated, getAdminAppReviews);
router.delete("/admin/reviews/:reviewId", isAuthenticated, deleteAdminAppReview);

// Reseñas del usuario (autenticado).
router.post("/:slug/reviews", isAuthenticated, upsertOwnReview);
router.delete("/:slug/reviews/mine", isAuthenticated, deleteOwnReview);

// Catálogo público (web + app sin sesión).
router.get("/", getPublicApps);
router.get("/:slug", getPublicApp);
router.get("/:slug/articles", getPublicAppArticles);
router.get("/:slug/articles/:articleSlug", getPublicAppArticle);
router.get("/:slug/reviews", getPublicAppReviews);

export default router;
