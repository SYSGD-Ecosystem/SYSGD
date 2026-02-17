import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth-jwt";
import { TimeEntriesController } from "../controllers/time-entries.controller";

const router = Router();

router.post("/", isAuthenticated, TimeEntriesController.create);
router.post("/start", isAuthenticated, TimeEntriesController.start);
router.put("/:id", isAuthenticated, TimeEntriesController.update);
router.put("/:id/pause", isAuthenticated, TimeEntriesController.pause);
router.put("/:id/resume", isAuthenticated, TimeEntriesController.resume);
router.put("/:id/stop", isAuthenticated, TimeEntriesController.stop);
router.get("/", isAuthenticated, TimeEntriesController.list);
router.delete("/:id", isAuthenticated, TimeEntriesController.remove);

export default router;
