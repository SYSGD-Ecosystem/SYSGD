// routes/descubre.ts
import { Router } from "express";
import { isAuthenticated, optionalAuth } from "../middlewares/auth-jwt";
import { isAdmin } from "../middlewares/auth";
import {
	listDescubrePostsController,
	createDescubrePostController,
	updateDescubrePostController,
	deleteOwnDescubrePostController,
	toggleDescubrePostVoteController,
	listAllDescubrePostsAdminController,
	deleteDescubrePostAdminController,
} from "../controllers/descubre";

const router = Router();

router.get("/posts", optionalAuth, listDescubrePostsController); // público; enriquecido si hay token
router.post("/posts", isAuthenticated, createDescubrePostController);

// Gestión por el dueño de la publicación
router.put("/posts/:id", isAuthenticated, updateDescubrePostController);
router.delete("/posts/:id", isAuthenticated, deleteOwnDescubrePostController);
router.post("/posts/:id/vote", isAuthenticated, toggleDescubrePostVoteController);

// Gestión de moderación (solo admins)
router.get("/admin/posts", isAuthenticated, isAdmin, listAllDescubrePostsAdminController);
router.delete("/admin/posts/:id", isAuthenticated, isAdmin, deleteDescubrePostAdminController);

export default router;
