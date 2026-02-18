import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth-jwt";
import {
	checkAICredits,
	checkTaskLimit,
} from "../middlewares/usageLimits.middleware";
import { TasksController } from "../controllers/tasks.controller";

const router = Router();

router.get("/:project_id", isAuthenticated, TasksController.getByProject);
router.post("/", isAuthenticated, checkTaskLimit, TasksController.create);
router.put("/:taskId", isAuthenticated, TasksController.update);
router.delete("/:taskId", isAuthenticated, TasksController.remove);
router.post(
	"/generate",
	isAuthenticated,
	checkAICredits,
	TasksController.generate,
);

export default router;
