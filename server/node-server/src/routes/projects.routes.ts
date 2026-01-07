import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth-jwt";
import {
	createProject,
	getProjectById,
	getProjects,
} from "../controllers/project.controller";
import { checkProjectLimit } from "../middlewares/usageLimits.middleware";

const router = Router();

// Crear nuevo proyecto
router.post("/", isAuthenticated, checkProjectLimit, createProject);

// Obtener todos los proyectos del usuario (creados y a los que tiene acceso)
router.get("/", isAuthenticated, getProjects);

// Obtener proyecto individual
router.get("/:id", isAuthenticated, getProjectById);

export default router;
