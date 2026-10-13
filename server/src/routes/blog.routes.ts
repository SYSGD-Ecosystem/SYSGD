import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth-jwt";
import {
	createAdminPost,
	deleteAdminPost,
	getAdminPosts,
	getPublicPost,
	getPublicPosts,
	updateAdminPost,
} from "../controllers/blog.controller";

const router = Router();

// Blog público del sitio (ayudas y contenidos).
// Admin primero: si van después de /:slug, Express las confunde con un slug.
router.get("/admin/list", isAuthenticated, getAdminPosts);
router.post("/admin", isAuthenticated, createAdminPost);
router.put("/admin/:id", isAuthenticated, updateAdminPost);
router.delete("/admin/:id", isAuthenticated, deleteAdminPost);

router.get("/", getPublicPosts);
router.get("/:slug", getPublicPost);

export default router;
