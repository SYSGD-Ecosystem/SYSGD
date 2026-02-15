import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth-jwt";
import {
	createProject,
	deleteProject,
	getProjectById,
	getProjects,
	updateProject,
	createProjectConversation,
} from "../controllers/project.controller";
import { checkProjectLimit } from "../middlewares/usageLimits.middleware";

const router = Router();

// Crear nuevo proyecto
router.post("/", isAuthenticated, checkProjectLimit, createProject);

// Obtener todos los proyectos del usuario (creados y a los que tiene acceso)
router.get("/", isAuthenticated, getProjects);

// Obtener proyecto individual
router.get("/:id", isAuthenticated, getProjectById);

// Actualizar proyecto
router.put("/:id", isAuthenticated, updateProject);

// Eliminar proyecto
router.delete("/:id", isAuthenticated, deleteProject);

// Crear conversación del proyecto (desde ajustes)
router.post("/:projectId/create-conversation", isAuthenticated, createProjectConversation);

export default router;
