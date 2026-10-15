import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth-jwt";
import {
  createGctcpSpaceHandler,
  deleteGctcpSpaceHandler,
  getGctcpSpaceHandler,
  listGctcpSpacesHandler,
  updateGctcpSpaceHandler,
} from "../controllers/gctcp-space.controller";

const router = Router();

router.use(isAuthenticated);

router.get("/", listGctcpSpacesHandler);
router.get("/:spaceId", getGctcpSpaceHandler);
router.put("/:spaceId", updateGctcpSpaceHandler);
router.post("/", createGctcpSpaceHandler);
router.delete("/:spaceId", deleteGctcpSpaceHandler);

export default router;
