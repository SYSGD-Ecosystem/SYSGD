// routes/descubre.ts
import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { isAdmin } from "../middlewares/auth";
import {
	listDescubrePostsController,
	createDescubrePostController,
	listAllDescubrePostsAdminController,
	deleteDescubrePostAdminController,
} from "../controllers/descubre";

const router = Router();

router.get("/posts", listDescubrePostsController); // público, no requiere login para ver
router.post("/posts", isAuthenticated, createDescubrePostController);

// Gestión de moderación (solo admins)
router.get("/admin/posts", isAuthenticated, isAdmin, listAllDescubrePostsAdminController);
router.delete("/admin/posts/:id", isAuthenticated, isAdmin, deleteDescubrePostAdminController);

export default router;
