// routes/descubre.ts
import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { listDescubrePostsController, createDescubrePostController } from "../controllers/descubre";

const router = Router();

router.get("/posts", listDescubrePostsController); // público, no requiere login para ver
router.post("/posts", isAuthenticated, createDescubrePostController);

export default router;
